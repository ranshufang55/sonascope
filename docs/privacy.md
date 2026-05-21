# Local audio handling

## Data path

The workbench reads files selected through the browser file picker. WAV decoding, analysis, canvas rendering and downloads occur in the page. Microphone samples are used locally for visualization. The application includes no analytics, uploads or external font requests.

Browser media permissions remain under the user's control. Stop capture to release the tracks; closing the page also ends its resources. AudioSession.close is available to applications embedding the library.

Downloaded WAV files contain audio samples. JSON analysis exposes spectral and timing information. Treat exported artifacts according to the sensitivity of the source recording, even though processing occurred locally.

For development, only the project directory is needed inside an isolated environment. Git credentials and unrelated home directories are not runtime requirements.
