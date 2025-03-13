declare module '@foxycorps/mic-drop' {
  export type AudioFormat = {
    channels: number;
    bitDepth: number;
    sampleRate: number;
    signed: boolean;
    float: boolean;
  };

  export type MicrophoneStreamOptions = {
    stream?: MediaStream;
    objectMode?: boolean;
    bufferSize?: number;
    context?: AudioContext;
    allowScriptProcessorFallback?: boolean;
  };

  export type MicrophoneStreamEvents = {
    data: CustomEvent<Float32Array | AudioBuffer>;
    format: CustomEvent<AudioFormat>;
    close: Event;
    error: ErrorEvent;
  };

  export default class MicrophoneStream extends EventTarget {
    public context: AudioContext;
    public audioInput: MediaStreamAudioSourceNode | null;

    constructor(opts?: MicrophoneStreamOptions);

    public setStream(stream: MediaStream): Promise<void>;
    public pauseRecording(): void;
    public resumeRecording(): void;
    public stop(): void;
    public destroy(): void;

    public addEventListener<K extends keyof MicrophoneStreamEvents>(
      type: K,
      listener: (event: MicrophoneStreamEvents[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void;

    public removeEventListener<K extends keyof MicrophoneStreamEvents>(
      type: K,
      listener: (event: MicrophoneStreamEvents[K]) => void,
      options?: boolean | EventListenerOptions
    ): void;

    public static toAudioBuffer(raw: Float32Array, sampleRate: number): AudioBuffer;
  }
} 