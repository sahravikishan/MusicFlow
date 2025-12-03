import os
import pretty_midi
from django.conf import settings


def create_guitar_music(guitar_type: str, notes_list, duration=1.0, filename=None):
    """
    Convert notes + guitar type → real .wav file with real guitar sound
    guitar_type: 'acoustic', 'bass', 'classical', 'electric'
    notes_list: list of MIDI numbers, e.g. [40, 45, 50, 55]  (E2, A2, D3, G3)
    duration: how long each note plays (seconds)
    filename: optional custom name, otherwise auto-generated
    Returns: full path to the generated .wav file
    """
    # 1. Map guitar type → your .sf2 file
    soundfont_map = {
        'acoustic': os.path.join(settings.BASE_DIR, 'sondfonts', 'acoustic_guitar.sf2'),
        'bass': os.path.join(settings.BASE_DIR, 'sondfonts', 'bass_guitar.sf2'),
        'classical': os.path.join(settings.BASE_DIR, 'sondfonts', 'classical_guitar.sf2'),
        'electric': os.path.join(settings.BASE_DIR, 'sondfonts', 'electric_guitar.sf2'),
    }

    if guitar_type not in soundfont_map:
        raise ValueError("Invalid guitar_type. Choose: acoustic, bass, classical, electric")

    sf2_path = soundfont_map[guitar_type]

    # 2. Create MIDI with the notes
    midi = pretty_midi.PrettyMIDI()
    guitar = pretty_midi.Instrument(program=25)  # Acoustic Guitar (nylon) – works great with all your sf2

    time = 0
    for pitch in notes_list:
        note = pretty_midi.Note(
            velocity=100,  # loudness
            pitch=pitch,  # MIDI note number
            start=time,
            end=time + duration
        )
        guitar.notes.append(note)
        time += duration

    midi.instruments.append(guitar)

    # 3. Render MIDI → real audio using your .sf2 + fluidsynth.exe
    audio_data = midi.fluidsynth(sf2_path=sf2_path, fs=44100)

    # 4. Save the .wav file in media/generated/
    os.makedirs(os.path.join(settings.MEDIA_ROOT, 'generated'), exist_ok=True)

    if filename is None:
        filename = f"{guitar_type}_song_{pretty_midi.note_number_to_name(notes_list[0])}.wav"

    full_path = os.path.join(settings.MEDIA_ROOT, 'generated', filename)
    import soundfile as sf
    sf.write(full_path, audio_data, 44100)

    # Return the URL so you can play/download it
    file_url = os.path.join(settings.MEDIA_URL, 'generated', filename)
    return file_url

