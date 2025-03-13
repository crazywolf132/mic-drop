# @foxycorps/mic-drop Example Application

This is an interactive demo application for the [@foxycorps/mic-drop](https://github.com/foxycorps/mic-drop) library, which makes it easy to capture and visualize microphone audio in web applications.

## Features

This example demonstrates:
- Microphone access and audio capture
- Real-time audio visualization in both waveform and frequency modes
- Audio format information display
- Pause/resume functionality
- Error handling with helpful messages
- Modern UI with appropriate feedback indicators

## Getting Started

### Prerequisites
- Node.js 16+
- pnpm (recommended) or npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/foxycorps/mic-drop.git
   cd mic-drop
   ```

2. Install dependencies (from the root directory):
   ```bash
   pnpm install
   ```

3. Build the library:
   ```bash
   pnpm build
   ```

4. Navigate to the example directory and start the development server:
   ```bash
   cd example
   pnpm dev
   ```

5. Open your browser to the local development URL (typically http://localhost:5173)

## Usage

1. Click "Start Recording" to begin capturing audio from your microphone
2. The waveform display will show your audio input in real-time
3. Switch between waveform and frequency visualization modes
4. Click "Pause Recording" to temporarily stop capturing audio
5. Click "Stop Recording" to completely stop and reset

## Browser Compatibility

This example works in all modern browsers:
- Chrome 55+
- Firefox 52+
- Safari 14.1+
- Edge 79+
- iOS Safari 14.5+

## Troubleshooting

- **No audio data?** Make sure your browser has permission to access your microphone
- **Browser errors?** Check the console for detailed error messages
- **Visualization not working?** Try disabling legacy API fallback in the settings

## Learn More

For more information about the @foxycorps/mic-drop library:
- [GitHub Repository](https://github.com/foxycorps/mic-drop)
- [NPM Package](https://www.npmjs.com/package/@foxycorps/mic-drop)
- [Main Documentation](https://github.com/foxycorps/mic-drop#readme)

## License

ISC License
