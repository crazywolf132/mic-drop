# 🎤 Mic-Drop

[![NPM Version](https://img.shields.io/npm/v/mic-drop.svg)](https://www.npmjs.com/package/mic-drop)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/mic-drop)](https://bundlephobia.com/package/mic-drop)

**A modern, browser-compatible library for capturing microphone audio in web applications**

Mic-Drop provides a simple, powerful interface for accessing microphone input and processing audio data in real-time. Built with modern web standards and full TypeScript support.

<p align="center">
  <img src="https://user-images.githubusercontent.com/put-your-image-url-here/mic-drop-banner.png" alt="Mic-Drop Banner" width="600">
</p>

## ✨ Features

- **💪 Modern API** - Uses EventTarget instead of Node.js streams for better browser compatibility
- **🔄 Browser Compatible** - Works across Chrome, Firefox, Safari, Edge, and mobile browsers
- **🎧 Advanced Audio Processing** - Uses cutting-edge AudioWorklet API with fallback to ScriptProcessorNode
- **📱 iOS Support** - Specially designed for iOS compatibility 
- **🧩 Framework Agnostic** - Works with any bundler (Webpack, Vite, Rollup) or directly in browsers
- **🔊 Flexible Output** - Handle audio data as raw Float32Arrays or AudioBuffers
- **📊 TypeScript Support** - Full type definitions and type safety
- **🧪 Thoroughly Tested** - Comprehensive test suite ensures reliability
- **🪶 Lightweight** - Small footprint with zero dependencies

## 📦 Installation

```bash
# Using npm
npm install mic-drop

# Using yarn
yarn add mic-drop

# Using pnpm
pnpm add mic-drop
```

## 🚀 Quick Start

```typescript
import MicrophoneStream from 'mic-drop';

// Request access to the microphone
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    // Create a new MicrophoneStream instance
    const micStream = new MicrophoneStream({ stream });
    
    // Listen for audio data
    micStream.addEventListener('data', (event) => {
      const audioData = event.detail; // Float32Array by default
      console.log('Received audio data:', audioData.length);
      
      // Do something with the audio data here...
    });
    
    // Stop recording after 5 seconds
    setTimeout(() => {
      micStream.stop();
    }, 5000);
  })
  .catch(err => {
    console.error('Error accessing microphone:', err);
  });
```

## 📚 Usage Examples

### Using Object Mode (AudioBuffer)

```typescript
const micStream = new MicrophoneStream({
  stream,
  objectMode: true // Emit AudioBuffer objects instead of Float32Arrays
});

micStream.addEventListener('data', (event) => {
  const audioBuffer = event.detail; // AudioBuffer
  
  // Get specific channel data
  const leftChannel = audioBuffer.getChannelData(0);
  
  console.log('Received AudioBuffer with duration:', audioBuffer.duration);
  
  // AudioBuffer provides useful methods for audio processing
});
```

### iOS Compatibility

```typescript
// Create instance BEFORE user interaction
const micStream = new MicrophoneStream();

// In response to user interaction (like a button click)
startRecordButton.addEventListener('click', async () => {
  try {
    // Get media stream AFTER user interaction for iOS compatibility
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    await micStream.setStream(stream);
    
    // Now the stream is connected and recording
    recordingStatus.textContent = 'Recording...';
  } catch (err) {
    console.error('Error accessing microphone:', err);
  }
});

// Stop recording when the stop button is clicked
stopRecordButton.addEventListener('click', () => {
  micStream.stop();
  recordingStatus.textContent = 'Recording stopped';
});
```

### Pausing and Resuming

```typescript
// Pause recording temporarily
pauseButton.addEventListener('click', () => {
  micStream.pauseRecording();
  recordingStatus.textContent = 'Paused';
});

// Resume recording
resumeButton.addEventListener('click', () => {
  micStream.resumeRecording();
  recordingStatus.textContent = 'Recording...';
});
```

### Visualizing Audio Data

```typescript
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

micStream.addEventListener('data', (event) => {
  const audioData = event.detail;
  
  // Clear the canvas
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the waveform
  canvasCtx.beginPath();
  const sliceWidth = canvas.width / audioData.length;
  let x = 0;
  
  for (let i = 0; i < audioData.length; i++) {
    const v = audioData[i] * 0.5 + 0.5; // Convert to range 0-1
    const y = v * canvas.height;
    
    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
});
```

## 📋 API Reference

### `MicrophoneStream`

#### Constructor

```typescript
constructor(options?: MicrophoneStreamOptions)
```

#### Options

```typescript
interface MicrophoneStreamOptions {
  // The MediaStream from getUserMedia (optional)
  stream?: MediaStream;
  
  // Whether to emit AudioBuffers (true) or Float32Arrays (false)
  objectMode?: boolean; // default: false
  
  // Buffer size for audio processing (power of 2)
  // Valid values: 256, 512, 1024, 2048, 4096, 8192, 16384
  bufferSize?: number; // default: 4096
  
  // Custom AudioContext to use
  context?: AudioContext; // default: new AudioContext()
}
```

#### Methods

| Method | Description |
|--------|-------------|
| `setStream(stream: MediaStream): Promise<void>` | Set the MediaStream to record from |
| `pauseRecording(): void` | Temporarily pause recording |
| `resumeRecording(): void` | Resume recording after pausing |
| `stop(): void` | Stop recording and clean up resources |
| `addEventListener(type, listener, options?)` | Add an event listener |
| `removeEventListener(type, listener, options?)` | Remove an event listener |

#### Static Methods

| Method | Description |
|--------|-------------|
| `toAudioBuffer(raw: Float32Array, sampleRate: number): AudioBuffer` | Convert a Float32Array to an AudioBuffer |

#### Events

| Event | Detail Type | Description |
|-------|-------------|-------------|
| `data` | `Float32Array \| AudioBuffer` | Emitted when new audio data is available |
| `format` | `AudioFormat` | Emitted with format information |
| `close` | - | Emitted when recording is stopped |
| `error` | `Error` | Emitted when an error occurs |

#### AudioFormat Object

```typescript
interface AudioFormat {
  channels: number;    // Number of audio channels
  bitDepth: number;    // Bit depth (32 for Float32Array)
  sampleRate: number;  // Sample rate in Hz (e.g., 44100)
  signed: boolean;     // Whether values are signed
  float: boolean;      // Whether values are floating point
}
```

## 🔧 Browser Compatibility

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 55+ |
| Firefox | 52+ |
| Safari | 14.1+ |
| Edge | 79+ |
| iOS Safari | 14.5+ |
| Android Chrome | 55+ |

## 🧪 Testing

To run tests locally:

```bash
# Run tests once
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📈 Performance Considerations

- The default buffer size (4096) provides a good balance between latency and performance
- Smaller buffer sizes provide lower latency but higher CPU usage
- For real-time applications like voice recognition, consider using smaller buffer sizes
- For audio recording or analysis, larger buffer sizes are more efficient

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Inspired by the [microphone-stream](https://github.com/AshcroftTwelve/microphone-stream) package
- Special thanks to the Web Audio API working group 