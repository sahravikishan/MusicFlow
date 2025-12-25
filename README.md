# MusicFlow

## Description

MusicFlow is a web application built with Django that converts guitar notes into audio files in MP3 format. It utilizes FluidSynth for audio synthesis with soundfonts to generate music from user-input notes. The project supports user authentication, profile management, and a music player interface. It appears to focus on guitar instruments, potentially with variations based on available soundfonts.

## Features

- User authentication: Likely includes sign up, login, and profile management (inferred from forms.py and models.py).
- Profile management: Update user details and display profiles.
- Guitar note conversion: Input notes and generate MP3 audio using MIDI utilities and FluidSynth.
- Music player: Interface with play, pause, and other controls.
- Theme customization and guitar index page.
- Audio synthesis powered by FluidSynth with custom soundfonts.

## Requirements

The project requires Python 3.x and dependencies listed in `requirements.txt`. Based on file structure, key libraries include:
- Django (for the web framework)
- mido (for MIDI handling, inferred from midi_utils.py)
- fluidsynth (Python bindings for audio synthesis)
- Other potential libraries for forms, audio utils, etc. (see `requirements.txt` for the full list).

The project includes `fluidsynth.exe` for Windows-based audio synthesis. Soundfonts are provided in the `sondfonts/` directory.

## Installation

1. Clone the repository : https://github.com/sahravikishan/MusicFlow.git
2. Create a virtual environment : python -m venv venv
3. Install dependencies : pip install -r requirements.txt
4. Apply database migrations : "python manage.py makemigrations" & "python manage.py migrate"
5. Create a superuser (optional, for admin access) : python manage.py createsuperuser
6. Run the development server : python manage.py runserver


Access the app at `http://127.0.0.1:8000/`.

## Usage

- **Sign Up/Login**: Create an account or log in to access features (assumed based on standard Django auth).
- **Profile Update**: Edit user details in the profile section.
- **Guitar Note Input**: Navigate to the guitar index page, input notes via the UI, and generate MP3 files using the audio conversion tools.
- **Music Player**: Play generated audio with controls like play and pause.
- **Audio Generation**: The app uses MIDI utilities to create note sequences and FluidSynth to synthesize them into MP3 using selected soundfonts.

Note: Ensure `fluidsynth.exe` is configured for Windows. For other OS, install FluidSynth system-wide. Soundfonts in `sondfonts/` provide instrument sounds.

## Project Structure

- `.idea/`: IDE configuration (e.g., PyCharm).
- `musicflow/`: Django project settings, including __init__.py, asgi.py, settings.py, urls.py, wsgi.py.
- `player/`: Main app directory with:
- `migrations/`: Database migrations.
- `templates/player/`: HTML templates for pages.
- `__init__.py`, `admin.py`, `apps.py`: Standard Django app files.
- `audio_utils.py`: Utilities for audio handling.
- `forms.py`: Form definitions (e.g., for user input).
- `midi_utils.py`: Utilities for MIDI note processing.
- `models.py`: Database models (e.g., for users, music).
- `tests.py`: Unit tests.
- `urls.py`: URL routing for the app.
- `views.py`: View functions for handling requests.
- `sondfonts/`: Directory containing .sf2 soundfont files for audio synthesis.
- `static/`: Static assets with subdirectories:
- `css/`: Stylesheets.
- `images/`: Images.
- `js/`: JavaScript files.
- `.gitignore`: Git ignore rules.
- `Frezz`: Unknown file (possibly a placeholder).
- `README.md`: Project documentation.
- `fluidsynth.exe`: Executable for FluidSynth on Windows.
- `manage.py`: Django management script.
- `requirements.txt`: List of Python dependencies.
- `user.json`: Possibly sample user data or fixtures.

## Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request. Ensure to follow the code style and add tests where applicable.

## License

This project is open-source and available under the MIT License 
