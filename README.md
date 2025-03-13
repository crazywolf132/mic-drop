# 🎤 mic-drop

[![NPM Version](https://img.shields.io/npm/v/mic-drop.svg)](https://www.npmjs.com/package/mic-drop)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/mic-drop)](https://bundlephobia.com/package/mic-drop)

**A straightforward library for capturing microphone audio in web apps**

Working with microphone input in the browser can be a real headache. This library simplifies that, giving you an easy way to capture and process audio data without all the Web Audio API complexity.

## What is this?

`mic-drop` helps you:
- Capture audio from the user's microphone
- Process real-time audio data
- Build visualizations, voice features, or recording apps
- Work around browser quirks (especially Safari and iOS)

All without having to become a Web Audio API expert.

## Install

```bash
# Pick your favorite package manager
npm install mic-drop
pnpm add mic-drop
yarn add mic-drop
```

## Quick Example

Here's how to get started with basic recording:

```javascript
import MicrophoneStream from 'mic-drop';

async function startRecording() {
  try {
    // Get access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create a new instance
    const mic = new MicrophoneStream({ stream });
    
    // Listen for audio data
    mic.addEventListener('data', (event) => {
      const audioData = event.detail; // This is a Float32Array
      
      // Do something with the audio data:
      // - Visualize it
      // - Analyze it
      // - Send it to a server
      // - Save it locally
    });
    
    return mic; // Keep a reference to stop it later
  } catch (err) {
    console.error('Could not access microphone:', err);
  }
}

// To stop recording
function stopRecording(mic) {
  if (mic) {
    mic.stop();
  }
}
```

## Working with iOS/Safari

iOS is notoriously picky about audio. Here's a pattern that works well:

```javascript
// Create the instance BEFORE any user interaction
const mic = new MicrophoneStream();

// Then in response to a button click:
recordButton.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  await mic.setStream(stream); // Now we're recording!
});
```

## Avoid Deprecated APIs

Use the `allowScriptProcessorFallback` option to prevent falling back to deprecated APIs:

```javascript
// Modern browsers only - safer for the future
const mic = new MicrophoneStream({
  allowScriptProcessorFallback: false
});

// Will throw an error rather than use deprecated APIs
```

## Building a Simple Visualizer

Here's a practical example of how to create a waveform visualizer:

```javascript
const mic = new MicrophoneStream({ stream });
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

mic.addEventListener('data', (event) => {
  const audioData = event.detail;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw waveform
  ctx.beginPath();
  ctx.strokeStyle = '#0077ff';
  ctx.lineWidth = 2;
  
  const sliceWidth = canvas.width / audioData.length;
  let x = 0;
  
  for (let i = 0; i < audioData.length; i++) {
    // Convert audio data to y-position (0 to canvas height)
    const y = (audioData[i] * 0.5 + 0.5) * canvas.height;
    
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    x += sliceWidth;
  }
  
  ctx.stroke();
});
```

## API Overview

### Creating an instance

```javascript
// Basic usage
const mic = new MicrophoneStream();

// With options
const mic = new MicrophoneStream({
  stream: mediaStream,       // MediaStream from getUserMedia
  objectMode: false,         // true for AudioBuffer, false for Float32Array
  bufferSize: 4096,          // Buffer size (256 to 16384, power of 2)
  context: audioContext,     // Custom AudioContext (optional)
  allowScriptProcessorFallback: true // Set to false for modern browsers only
});
```

### Methods

- **setStream(stream)**: Connect to a microphone stream
- **pauseRecording()**: Pause data collection temporarily
- **resumeRecording()**: Resume after pausing
- **stop()**: Stop recording but keep the instance for later use
- **destroy()**: Completely clean up resources when done

### Events

```javascript
// Audio data event
mic.addEventListener('data', (event) => {
  const audioData = event.detail; // Float32Array or AudioBuffer
});

// Format information
mic.addEventListener('format', (event) => {
  const format = event.detail;
  console.log(`Sample rate: ${format.sampleRate}Hz`);
});

// Error handling
mic.addEventListener('error', (event) => {
  console.error('Microphone error:', event.error);
});
```

## Tips for Better Performance

- **Buffer Size**: Smaller = lower latency but higher CPU usage. Default 4096 works well for most cases
- **Audio Processing**: Do heavy processing in a Web Worker if possible
- **Memory Usage**: Remove event listeners when done to prevent memory leaks
- **Mobile Devices**: Be mindful of battery usage with long-running audio processing

## Browser Support

Works in all modern browsers:
- Chrome 55+
- Firefox 52+
- Safari 14.1+
- Edge 79+
- iOS Safari 14.5+

## Troubleshooting Common Issues

- **No audio data?** Check that your microphone permissions are granted
- **Browser errors?** Try using `allowScriptProcessorFallback: false` and handle errors
- **iOS not working?** Make sure you create the instance before user interaction
- **High CPU usage?** Try increasing the buffer size

## Contributing

Found a bug or want to help? Contributions are welcome!

1. Fork the repo
2. Create your branch (`git checkout -b fix/awesome-fix`)
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

ISC License - go wild, just keep the attribution.

## Credit Where It's Due

Built on the shoulders of the Web Audio API and inspired by earlier microphone libraries. 