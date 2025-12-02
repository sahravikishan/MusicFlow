// Application State
let notes = [];
let chords = [];
let bpm = 120;
let key = '';
let timeSignature = '4/4';
let compositionDuration = 30;
let selectedPickingPattern = '';
let customPattern = '';
let isPlaying = false;
let hasGenerated = false;
let currentTime = 0;
let totalDuration = 0;
let playInterval = null;
let capo = 0;

// Guitar configurations
const GUITAR_STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

const NOTE_POSITIONS = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
};

const DURATION_VALUES = {
    whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25
};

const DURATION_SYMBOLS = {
    whole: '𝅝', half: '𝅗𝅥', quarter: '𝅘𝅥', eighth: '𝅘𝅥𝅮', sixteenth: '𝅘𝅥𝅯'
};

const FRET_MARKERS = [3, 5, 7, 9, 12];

// Utility Functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function calculateTotalDuration() {
    // Use note.durationValue if present, else fallback to DURATION_VALUES or 1
    return notes.reduce((acc, note) => {
        if (typeof note.durationValue === 'number') return acc + note.durationValue;
        return acc + (DURATION_VALUES[note.duration] || 1);
    }, 0);
}

// Compute total duration in seconds based on beats and BPM for consistent timing displays and playback progress
function getTotalSeconds() {
    return calculateTotalDuration() * (60 / bpm);
}

// Note Management
function addNote() {
    const noteName = document.getElementById('noteName').value;
    const octave = parseInt(document.getElementById('octave').value);
    const durationSelect = document.getElementById('duration');
    const duration = durationSelect ? durationSelect.value : 'quarter';

    let durationValue;
    if (duration === 'custom') {
        // Either read stored data-custom-value or current custom input
        const customVal = parseFloat(durationSelect.dataset.customValue || document.getElementById('customDuration').value);
        durationValue = (!isNaN(customVal) && customVal > 0) ? customVal : 1;
    } else {
        durationValue = DURATION_VALUES[duration] || 1;
    }

    const note = {
        id: generateId(),
        name: noteName,
        octave: octave,
        duration: duration,
        durationValue: durationValue
    };

    notes.push(note);
    updateUI();
}

function removeNote(id) {
    notes = notes.filter(note => note.id !== id);
    updateUI();
}

function clearAllNotes() {
    notes = [];
    updateUI();
}

function parseNotes() {
    const inputEl = document.getElementById('quickInput');
    if (!inputEl) return;
    const input = inputEl.value.trim();
    if (!input) return;

    const noteStrings = input.split(/\s+/);
    const parsedNotes = [];

    noteStrings.forEach(noteString => {
        const parts = noteString.split('-');
        const noteOctave = parts[0];
        const durationPart = parts[1] || 'quarter';

        // noteOctave expected like "C3" or "C#3"
        const noteName = noteOctave.slice(0, -1);
        const octaveStr = noteOctave.slice(-1);
        const octave = parseInt(octaveStr);

        if (Object.keys(NOTE_POSITIONS).includes(noteName) && !isNaN(octave)) {
            let durationValue;
            if (!isNaN(parseFloat(durationPart))) {
                durationValue = parseFloat(durationPart);
            } else {
                durationValue = DURATION_VALUES[durationPart] || 1;
            }

            parsedNotes.push({
                id: generateId(),
                name: noteName,
                octave,
                duration: isNaN(parseFloat(durationPart)) ? durationPart : 'custom',
                durationValue
            });
        }
    });

    notes.push(...parsedNotes);
    inputEl.value = '';
    updateUI();
}

// Chord Management
function addChord() {
    const chord = prompt('Enter chord name (e.g., G, C, Am):', 'G');
    if (chord && chords.indexOf(chord) === -1) {
        chords.push(chord);
        updateChordsDisplay();
        updateUI();
    }
}

function removeChord(index) {
    chords.splice(index, 1);
    updateChordsDisplay();
    updateUI();
}

// Capo Management
function updateCapoDisplay() {
    const capoInfo = document.getElementById('capo-info');
    if (!capoInfo) return;
    if (capo === 0) {
        capoInfo.textContent = 'No capo - Frets relative to nut';
    } else {
        capoInfo.textContent = `Capo on fret ${capo} - Transposed up ${capo} semitone${capo > 1 ? 's' : ''}`;
    }
}

function updateChordsDisplay() {
    const container = document.getElementById('chordsContainer');
    if (!container) return;
    if (chords.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0">No chords added yet</p>';
        return;
    }
    let html = '';
    chords.forEach((chord, i) => {
        html += `<span class="chord-badge">${chord} <button class="btn-close btn-close-white ms-2" style="font-size: 0.75em;" onclick="removeChord(${i})"></button></span>`;
    });
    container.innerHTML = html;
}

// Picking
function handlePatternChange() {
    const select = document.getElementById('strummingPattern');
    if (!select) return;
    selectedPickingPattern = select.value;
    const cont = document.getElementById('customPatternContainer');
    // FIXED BUG: Changed 'Custom' to 'custom' to match the select option value (case-sensitive comparison)
    if (selectedPickingPattern === 'custom') {
        cont.style.display = 'block';
    } else {
        if (cont) cont.style.display = 'none';
    }
}

// Settings (simple update function)
function updateBPM(val) {
    bpm = parseInt(val);
    const bpmValueEl = document.getElementById('bpmValue');
    if (bpmValueEl) bpmValueEl.textContent = val;
    if (document.getElementById('analysisTempo')) {
        document.getElementById('analysisTempo').textContent = `${val} BPM`;
    }
    updateStats();
}

function updateDuration(val) {
    compositionDuration = parseInt(val);
    const durationValue = document.getElementById('durationValue');
    if (durationValue) durationValue.textContent = val + 's';
}

// Volume
function updateVolume(val) {
    const el = document.getElementById('volumeDisplay');
    if (el) el.textContent = val + '%';
}

// Fretboard Generation
function getNoteAtFret(stringNote, visualFret) {
    const stringNoteName = stringNote.slice(0, -1);
    const stringOctave = parseInt(stringNote.slice(-1));
    const stringPosition = NOTE_POSITIONS[stringNoteName];
    const totalSemitones = stringPosition + visualFret + capo;
    const octaveOffset = Math.floor(totalSemitones / 12);
    const posInOctave = ((totalSemitones % 12) + 12) % 12; // handle negative safer
    const noteName = Object.keys(NOTE_POSITIONS)[posInOctave];
    const noteOctave = stringOctave + octaveOffset;
    return `${noteName}${noteOctave}`;
}

function isNoteActive(stringNote, visualFret) {
    const noteAtFret = getNoteAtFret(stringNote, visualFret);
    return notes.some(note => `${note.name}${note.octave}` === noteAtFret);
}

function getActiveNote(stringNote, visualFret) {
    const noteAtFret = getNoteAtFret(stringNote, visualFret);
    return notes.find(note => `${note.name}${note.octave}` === noteAtFret);
}

function updateFretboard() {
    const container = document.getElementById('fretboardContainer');
    const emptyMessage = document.getElementById('fretboardEmpty');
    const strings = GUITAR_STRINGS;
    const numFrets = 12;

    if (!container || !emptyMessage) return;

    if (notes.length === 0) {
        container.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    emptyMessage.style.display = 'none';

    let html = '';

    // Fret numbers row
    html += '<div class="fret-markers"><div style="width: 60px;"></div>';
    for (let i = 0; i < numFrets; i++) {
        html += `<div class="fret-marker">${i + 1}</div>`;
    }
    html += '</div>';

    // Fret marker dots row
    html += '<div class="fret-markers"><div style="width: 60px;"></div>';
    for (let i = 0; i < numFrets; i++) {
        html += '<div class="fret-marker">';
        if (FRET_MARKERS.includes(i + 1)) {
            html += '<div class="fret-marker-dot"></div>';
        }
        html += '</div>';
    }
    html += '</div>';

    // Strings
    strings.forEach(stringNote => {
        html += '<div class="fret-row">';
        html += `<div class="string-label"><code>${stringNote}</code></div>`;

        // Open string (fret 0)
        html += '<div class="fret-cell">';
        if (isNoteActive(stringNote, 0)) {
            const note = getActiveNote(stringNote, 0);
            html += `<div class="fret-note">${note.name}</div>`;
        }
        html += '</div>';

        // Frets
        for (let fret = 1; fret <= numFrets; fret++) {
            html += '<div class="fret-cell">';
            if (isNoteActive(stringNote, fret)) {
                const note = getActiveNote(stringNote, fret);
                html += `<div class="fret-note">${note.name}</div>`;
            }
            html += '</div>';
        }

        html += '</div>';
    });

    container.innerHTML = html;
}

// Audio Player
function togglePlayback() {
    if (notes.length === 0 && chords.length === 0) {
        showToast('Add some notes or chords first!');
        return;
    }

    if (!hasGenerated) {
        generateAudio();
        return;
    }

    if (isPlaying) {
        pausePlayback();
    } else {
        startPlayback();
    }
}

async function generateAudio() {
    const playBtn = document.getElementById('generateBtn');
    if (playBtn) {
        playBtn.disabled = true;
        playBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
    }

    // Simulate audio generation
    await new Promise(resolve => setTimeout(resolve, 1200));

    hasGenerated = true;
    if (playBtn) {
        playBtn.disabled = false;
        playBtn.innerHTML = '<i class="fas fa-play me-2"></i>Play';
    }

    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) stopBtn.disabled = false;
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = false;
    const noNotes = document.getElementById('no-notes-message');
    if (noNotes) noNotes.style.display = 'none';

    // Compute totalDuration in seconds using BPM for accurate playback timing and display
    totalDuration = getTotalSeconds();
    const totalTime = document.getElementById('totalTime');
    if (totalTime) totalTime.textContent = formatTime(totalDuration);
    const analysisTotalDuration = document.getElementById('analysisTotalDuration');
    if (analysisTotalDuration) analysisTotalDuration.textContent = formatTime(totalDuration);

    showToast('Audio generated successfully!');

    startPlayback();
}

function startPlayback() {
    if (totalDuration === 0) return;

    isPlaying = true;
    const playBtn = document.getElementById('generateBtn');
    if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';

    // clear previous interval if any
    if (playInterval) clearInterval(playInterval);

    playInterval = setInterval(() => {
        currentTime += 0.1;
        if (currentTime >= totalDuration) {
            stopPlayback();
            return;
        }
        updateProgressBar();
    }, 100);
}

function pausePlayback() {
    isPlaying = false;
    if (playInterval) clearInterval(playInterval);
    const playBtn = document.getElementById('generateBtn');
    if (playBtn) playBtn.innerHTML = '<i class="fas fa-play me-2"></i>Play';
}

function stopPlayback() {
    pausePlayback();
    currentTime = 0;
    updateProgressBar();
}

function updateProgressBar() {
    const current = document.getElementById('currentTime');
    if (current) current.textContent = formatTime(currentTime);
    const progressEl = document.getElementById('progressBar');
    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
    if (progressEl) progressEl.style.width = `${progress}%`;
}

function downloadAudio() {
    showToast('Download feature (mock): guitar-composition-classical.wav');
}

// Composition Analysis
function getDetectedChords() {
    const uniqueNotes = [...new Set(notes.map(note => note.name))];
    const detected = [];

    // Basic chord detection from notes
    if (uniqueNotes.includes('C') && uniqueNotes.includes('E') && uniqueNotes.includes('G')) detected.push('C');
    if (uniqueNotes.includes('D') && uniqueNotes.includes('F#') && uniqueNotes.includes('A')) detected.push('D');
    if (uniqueNotes.includes('E') && uniqueNotes.includes('G#') && uniqueNotes.includes('B')) detected.push('E');
    if (uniqueNotes.includes('F') && uniqueNotes.includes('A') && uniqueNotes.includes('C')) detected.push('F');
    if (uniqueNotes.includes('G') && uniqueNotes.includes('B') && uniqueNotes.includes('D')) detected.push('G');
    if (uniqueNotes.includes('A') && uniqueNotes.includes('C#') && uniqueNotes.includes('E')) detected.push('A');

    return detected.length > 0 ? detected : ['N/A'];
}

function updateAnalysis() {
    const content = document.getElementById('analysisContent');
    if (!content) return;
    if (notes.length === 0) {
        content.style.display = 'none';
        return;
    }
    content.style.display = 'block';

    const minOctave = Math.min(...notes.map(n => n.octave));
    const maxOctave = Math.max(...notes.map(n => n.octave));
    const noteRangeEl = document.getElementById('noteRange');
    if (noteRangeEl) noteRangeEl.textContent = `${minOctave}-${maxOctave}`;

    const detected = getDetectedChords();
    const chordsDiv = document.getElementById('detectedChords');
    if (chordsDiv) chordsDiv.innerHTML = detected.map(chord => `<span class="chord-badge">${chord}</span>`).join('') || '<span class="chord-badge">N/A</span>';

    const detectedKeyEl = document.getElementById('detectedKey');
    if (detectedKeyEl) detectedKeyEl.textContent = key || 'C Major (estimated)';
    const analysisTimeEl = document.getElementById('analysisTime');
    if (analysisTimeEl) analysisTimeEl.textContent = timeSignature;
    const analysisTempoEl = document.getElementById('analysisTempo');
    if (analysisTempoEl) analysisTempoEl.textContent = `${bpm} BPM`;

    // Compute beats and seconds separately for accurate display in beats and time
    const totalBeats = calculateTotalDuration();
    const totalSeconds = getTotalSeconds();
    const totalBeatsEl = document.getElementById('totalBeats');
    if (totalBeatsEl) totalBeatsEl.textContent = totalBeats;

    const patternDisplay = document.getElementById('analysisPattern');
    if (patternDisplay) patternDisplay.textContent = selectedPickingPattern
        ? (selectedPickingPattern === 'custom' ? customPattern || 'Custom Pattern' : selectedPickingPattern)
        : 'N/A';

    const notesDisplay = document.getElementById('analysisNotes');
    if (notesDisplay) notesDisplay.textContent = notes.length > 0
        ? notes.map(n => `${n.name}${n.octave}`).join(' - ')
        : 'N/A';

    const durationDisplay = document.getElementById('analysisTotalDuration');
    if (durationDisplay) durationDisplay.textContent = formatTime(totalSeconds);
}

function updateStats() {
    const statNotes = document.getElementById('statNotes');
    const statChords = document.getElementById('statChords');
    const statDuration = document.getElementById('statDuration');
    const statKey = document.getElementById('statKey');

    if (statNotes) statNotes.textContent = notes.length;
    if (statChords) statChords.textContent = chords.length;
    // Use getTotalSeconds() for accurate time display in seconds
    const totalSec = getTotalSeconds();
    if (statDuration) statDuration.textContent = formatTime(totalSec);
    if (statKey) statKey.textContent = key || 'Auto';
}

// UI Updates
function updateNotesDisplay() {
    const displayDiv = document.getElementById('notesDisplay');
    const countSpan = document.getElementById('noteCount');
    const clearBtn = document.getElementById('clearNotes');
    const playBtn = document.getElementById('generateBtn');
    const noNotesMsg = document.getElementById('no-notes-message');

    if (countSpan) countSpan.textContent = notes.length;

    if ((!notes || notes.length === 0) && (!chords || chords.length === 0)) {
        if (displayDiv) displayDiv.innerHTML = '<p class="text-muted mb-0">No notes added yet</p>';
        if (clearBtn) clearBtn.style.display = 'none';
        if (playBtn) playBtn.disabled = true;
        if (noNotesMsg) noNotesMsg.style.display = 'block';
    } else {
        let html = '';
        notes.forEach(note => {
            const symbol = DURATION_SYMBOLS[note.duration] || (note.duration === 'custom' ? `${note.durationValue}b` : '𝅘𝅥');
            html += `<span class="note-badge">${note.name}${note.octave} <span class="duration-symbol">${symbol}</span> <button class="btn-close btn-close-white ms-2" style="font-size: 0.75em;" onclick="removeNote('${note.id}')"></button></span>`;
        });
        if (displayDiv) displayDiv.innerHTML = html;
        if (clearBtn) clearBtn.style.display = 'inline-block';
        if (playBtn) playBtn.disabled = false;
        if (noNotesMsg) noNotesMsg.style.display = 'none';
    }
}

function updateUI() {
    updateNotesDisplay();
    updateChordsDisplay();
    updateFretboard();
    updateAnalysis();
    updateStats();
    updateCapoDisplay();
    hasGenerated = false;
    currentTime = 0;
    updateProgressBar();

    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const genBtn = document.getElementById('generateBtn');
    if (stopBtn) stopBtn.disabled = true;
    if (downloadBtn) downloadBtn.disabled = true;
    if (genBtn) genBtn.innerHTML = '<i class="fas fa-play me-2"></i>Generate & Play';
}

function showToast(message) {
    const toastEl = document.getElementById('toast');
    if (!toastEl) {
        console.log('[Toast]', message);
        return;
    }
    document.getElementById('toastMessage').textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Event Listeners and initialization
document.addEventListener('DOMContentLoaded', function() {
    // Debug: confirm JS loaded
    console.log('✅ Classical JS Loaded');

    // Wire inputs once
    const pickingSelect = document.getElementById('strummingPattern');
    if (pickingSelect) pickingSelect.addEventListener('change', handlePatternChange);

    const customPatternInput = document.getElementById('customPattern');
    if (customPatternInput) customPatternInput.addEventListener('input', function(e) {
        customPattern = e.target.value;
    });

    const keySelect = document.getElementById('keySelect');
    if (keySelect) keySelect.addEventListener('change', function(e) {
        key = e.target.value;
        updateAnalysis();
        updateStats();
    });

    const timeSignatureEl = document.getElementById('timeSignature');
    if (timeSignatureEl) timeSignatureEl.addEventListener('change', function(e) {
        timeSignature = e.target.value;
        updateAnalysis();
    });

    const bpmSlider = document.getElementById('bpmSlider');
    if (bpmSlider) {
        bpmSlider.addEventListener('input', function(e) {
            updateBPM(e.target.value);
            const bpmProgress = document.getElementById('bpmProgress');
            if (bpmProgress) bpmProgress.style.width = ((e.target.value - 40) / (200 - 40)) * 100 + '%';
        });
    }

    const durationSlider = document.getElementById('durationSlider');
    if (durationSlider) {
        durationSlider.addEventListener('input', function(e) {
            updateDuration(e.target.value);
            const durationProgress = document.getElementById('durationProgress');
            if (durationProgress) durationProgress.style.width = ((e.target.value - 10) / (120 - 10)) * 100 + '%';
        });
    }

    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) volumeSlider.addEventListener('input', function(e) {
        updateVolume(e.target.value);
    });

    const quickInputEl = document.getElementById('quickInput');
    if (quickInputEl) quickInputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') parseNotes();
    });

    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.addEventListener('click', togglePlayback);

    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) stopBtn.addEventListener('click', stopPlayback);

    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadAudio);

    // duration custom handling
    const durationSelect = document.getElementById("duration");
    const customInput = document.getElementById("customDuration");
    if (durationSelect && customInput) {
        durationSelect.addEventListener("change", () => {
            if (durationSelect.value === "custom") {
                durationSelect.style.display = "none";
                customInput.style.display = "block";
                customInput.focus();
            }
        });

        customInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const val = parseFloat(customInput.value);
                if (!isNaN(val) && val > 0) {
                    // store custom numeric duration on the select element
                    durationSelect.dataset.customValue = val;
                    customInput.style.display = "none";
                    durationSelect.style.display = "block";
                    durationSelect.value = "custom";
                } else {
                    alert("Please enter a valid number (e.g., 1.5)");
                }
            } else if (e.key === "Escape") {
                customInput.style.display = "none";
                durationSelect.style.display = "block";
                durationSelect.value = "quarter";
            }
        });
    }

    // Move capo listener inside DOMContentLoaded to avoid null errors
    const capoEl = document.getElementById('capoPosition');
    if (capoEl) {
        capoEl.addEventListener('change', function (e) {
            capo = parseInt(e.target.value) || 0;
            updateUI();
        });
    }

    // expose some functions globally for inline onclick attributes
    window.addNote = addNote;
    window.parseNotes = parseNotes;
    window.clearAllNotes = clearAllNotes;
    window.addChord = addChord;
    window.removeNote = removeNote;
    window.removeChord = removeChord;

    // initialize UI
    updateUI();
});

