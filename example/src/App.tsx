import { useState, useRef, useEffect, useCallback } from 'react'
import MicrophoneStream from '@foxycorps/mic-drop'
import './App.css'

function App() {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [audioData, setAudioData] = useState<Float32Array | null>(null)
  const [audioFormat, setAudioFormat] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [visualMode, setVisualMode] = useState<'waveform' | 'frequency'>('waveform')
  const [volume, setVolume] = useState(0)
  const [dataReceived, setDataReceived] = useState(false)
  const [maxVolume, setMaxVolume] = useState(0)
  const [disableLegacyApi, setDisableLegacyApi] = useState(false)

  const micStreamRef = useRef<MicrophoneStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  // Store event listeners in refs so we can properly remove them
  const dataHandlerRef = useRef<((event: Event) => void) | null>(null)

  // Create a stable data handler function that won't change on re-renders
  const handleAudioData = useCallback((event: Event) => {
    const dataEvent = event as CustomEvent
    const data = dataEvent.detail as Float32Array
    
    // Log first time we receive data
    if (!dataReceived) {
      console.log('First audio data received:', data.length, 'samples')
      setDataReceived(true)
    }
    
    // Calculate volume (simple RMS)
    let rms = 0
    let peak = 0
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i])
      rms += data[i] * data[i]
      if (abs > peak) peak = abs
    }
    rms = Math.sqrt(rms / data.length)
    
    // Occasionally log audio levels for debugging
    if (Math.random() < 0.01) {
      console.log(`Audio levels - RMS: ${rms.toFixed(4)}, Peak: ${peak.toFixed(4)}, Length: ${data.length}`)
    }
    
    // Track maximum volume for visualization scaling
    if (rms > maxVolume) {
      setMaxVolume(rms)
    }
    
    setAudioData(data)
    setVolume(rms)
  }, [dataReceived, maxVolume])

  // Core audio setup function that both startRecording and restartAudioPipeline can use
  const setupAudioRecording = useCallback(async (showLogs = true) => {
    try {
      if (showLogs) {
        console.log('Setting up audio recording - requesting microphone access')
      }
      
      // Create a new instance if needed
      if (!micStreamRef.current) {
        if (showLogs) console.log('Creating new MicrophoneStream instance')
        micStreamRef.current = new MicrophoneStream({ 
          allowScriptProcessorFallback: !disableLegacyApi 
        })
      }
      
      // Check if there's an existing MicrophoneStream with a closed context
      const micInstance = micStreamRef.current as any
      if (micInstance.context?.state === 'closed') {
        if (showLogs) console.log('Detected closed AudioContext, creating a new MicrophoneStream instance')
        // Clean up previous instance
        micStreamRef.current = new MicrophoneStream({ 
          allowScriptProcessorFallback: !disableLegacyApi 
        })
      }
      
      // Get user media with improved settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Ensure decent sample rate and bit depth
          sampleRate: { ideal: 44100 },
          sampleSize: { ideal: 16 }
        } 
      })
      
      if (showLogs) console.log('Microphone access granted, setting up data handler')
      
      // Store the data handler in a ref so we can remove it later
      dataHandlerRef.current = handleAudioData
      
      // Set stream and add listener
      if (micStreamRef.current) {
        // Add the data event listener
        micStreamRef.current.addEventListener('data', dataHandlerRef.current)
        
        if (showLogs) console.log('Setting stream to MicrophoneStream')
        await micStreamRef.current.setStream(stream)
        setRecording(true)
        setPaused(false)
        setError(null)
        
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error in setupAudioRecording:', err)
      
      // Provide a more helpful error message when AudioWorklet isn't available and fallback is disabled
      if (err instanceof Error && err.message.includes('ScriptProcessorNode fallback is disabled')) {
        setError(`${err.message}\n\nYour browser may not support AudioWorklet, which is required when legacy API fallback is disabled.`)
      } else {
        setError((err as Error).message)
      }
      
      return false
    }
  }, [handleAudioData, disableLegacyApi])

  // Function to restart the audio pipeline if needed
  const restartAudioPipeline = useCallback(async () => {
    if (!micStreamRef.current || !recording) return
    
    try {
      console.log('Checking AudioContext state...')
      // Check if we need to restart (if context is closed)
      const micInstance = micStreamRef.current as any
      const contextState = micInstance.context?.state
      
      if (contextState === 'closed') {
        console.log('AudioContext is closed, restarting recording')
        
        // Clean up the old instance
        if (dataHandlerRef.current) {
          micStreamRef.current.removeEventListener('data', dataHandlerRef.current)
          dataHandlerRef.current = null
        }
        
        // Reset visualization data
        setMaxVolume(0)
        setDataReceived(false)
        setAudioData(null)
        
        // Setup recording again
        const success = await setupAudioRecording()
        
        if (success && !animationRef.current) {
          console.log('Restarting animation')
          animateCanvas()
        }
      } else {
        console.log('AudioContext state is:', contextState, '- no restart needed')
      }
    } catch (err) {
      console.error('Error checking/restarting audio pipeline:', err)
      setError(`Error restarting: ${(err as Error).message}`)
    }
  }, [recording, setupAudioRecording])

  // Handle visualization mode changes
  const handleVisualizationChange = useCallback((mode: 'waveform' | 'frequency') => {
    console.log(`Changing visualization mode to: ${mode}`)
    setVisualMode(mode)
    
    // Check if we need to restart the audio pipeline
    // This is a safety check to ensure that switching visualization modes
    // doesn't leave us with a closed AudioContext
    restartAudioPipeline()
  }, [restartAudioPipeline])

  // Initialize the MicrophoneStream on component mount
  useEffect(() => {
    console.log('Initializing MicrophoneStream')
    // Create a MicrophoneStream instance
    micStreamRef.current = new MicrophoneStream({ 
      allowScriptProcessorFallback: !disableLegacyApi 
    })

    // Set up event listeners
    const onFormat = (event: Event) => {
      const formatEvent = event as CustomEvent
      console.log('Received format data:', formatEvent.detail)
      setAudioFormat(formatEvent.detail)
    }

    const onError = (event: Event) => {
      const errorEvent = event as ErrorEvent
      console.error('MicrophoneStream error:', errorEvent.message)
      setError(errorEvent.message)
    }

    micStreamRef.current.addEventListener('format', onFormat)
    micStreamRef.current.addEventListener('error', onError)

    // Clean up on component unmount
    return () => {
      console.log('Cleaning up MicrophoneStream - destroying instance')
      if (micStreamRef.current) {
        micStreamRef.current.removeEventListener('format', onFormat)
        micStreamRef.current.removeEventListener('error', onError)
        
        // Also remove data handler if it exists
        if (dataHandlerRef.current) {
          micStreamRef.current.removeEventListener('data', dataHandlerRef.current)
          dataHandlerRef.current = null
        }
        
        // Get the MicrophoneStream instance with any type to access methods that might not be in the type definition
        const micInstance = micStreamRef.current as any
        
        // Try to use destroy() but fall back to stop() if it doesn't exist
        if (typeof micInstance.destroy === 'function') {
          console.log('Using destroy() method for cleanup')
          micInstance.destroy()
        } else {
          console.log('destroy() method not available, using stop() instead')
          micInstance.stop()
          
          // Additional cleanup for MediaStream if possible
          try {
            const mediaDevices = navigator.mediaDevices as any
            if (mediaDevices && typeof mediaDevices.getUserMedia === 'function') {
              const tracks = mediaDevices.getSupportedConstraints ? 
                mediaDevices.getSupportedConstraints() : []
              console.log('Available tracks:', tracks)
            }
          } catch (e) {
            console.error('Error attempting additional cleanup:', e)
          }
        }
        
        micStreamRef.current = null
      }
      // Cancel animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [disableLegacyApi])

  // Start recording
  const startRecording = async () => {
    try {
      console.log('Starting recording')
      // Reset visualization data
      setMaxVolume(0)
      setDataReceived(false)
      setAudioData(null)
      
      // Use the core setup function
      const success = await setupAudioRecording(true)
      
      if (success) {
        // Start visualizer animation
        console.log('Starting animation')
        if (!animationRef.current) {
          animateCanvas()
        }
      }
    } catch (err) {
      console.error('Error starting recording:', err)
      setError((err as Error).message)
    }
  }

  // Stop recording
  const stopRecording = () => {
    console.log('Stopping recording')
    if (micStreamRef.current) {
      // Remove the data event listener
      if (dataHandlerRef.current) {
        micStreamRef.current.removeEventListener('data', dataHandlerRef.current)
        dataHandlerRef.current = null
      }
      
      // Stop recording but keep the instance for reuse
      micStreamRef.current.stop()
      setRecording(false)
      setPaused(false)
      
      // Don't cancel animation frame to keep the last visualization visible
    }
  }

  // Pause recording
  const pauseRecording = () => {
    console.log('Toggling pause state')
    if (micStreamRef.current && recording) {
      if (!paused) {
        micStreamRef.current.pauseRecording()
        setPaused(true)
      } else {
        micStreamRef.current.resumeRecording()
        setPaused(false)
      }
    }
  }

  // Animate canvas for audio visualization
  const animateCanvas = () => {
    // Continue the animation loop even if there's no data yet
    animationRef.current = requestAnimationFrame(animateCanvas)
    
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Background grid
    drawBackgroundGrid(ctx, canvas.width, canvas.height)
    
    // If we don't have data, show a waiting indicator
    if (!audioData) {
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Waiting for audio...', canvas.width / 2, canvas.height / 2)
      
      if (recording && !dataReceived) {
        ctx.fillStyle = 'rgba(220, 53, 69, 0.7)'
        ctx.font = '12px Arial'
        ctx.fillText('Make sure your microphone is unmuted and try speaking', canvas.width / 2, canvas.height / 2 + 30)
      }
      return
    }

    if (visualMode === 'waveform') {
      // Draw waveform
      ctx.beginPath()
      ctx.strokeStyle = 'rgb(0, 125, 255)'
      ctx.lineWidth = 2
      
      const sliceWidth = canvas.width / audioData.length
      let x = 0
      
      for (let i = 0; i < audioData.length; i++) {
        // Scale the waveform to make it more visible
        const amplifiedValue = audioData[i] * 2 
        const y = (amplifiedValue * 0.5 + 0.5) * canvas.height
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    } else {
      // Simple frequency visualization (just for demo)
      ctx.fillStyle = 'rgb(0, 125, 255)'
      const barWidth = 5
      const bars = Math.floor(canvas.width / (barWidth + 1))
      const step = Math.floor(audioData.length / bars)
      
      for (let i = 0; i < bars; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) {
          const idx = i * step + j
          if (idx < audioData.length) {
            sum += Math.abs(audioData[idx])
          }
        }
        const avgValue = sum / step
        // Amplify the visualization
        const barHeight = Math.min(avgValue * canvas.height * 3, canvas.height)
        
        ctx.fillRect(
          i * (barWidth + 1),
          canvas.height - barHeight,
          barWidth,
          barHeight
        )
      }
    }

    // Draw volume meter with color scale
    const scaleFactor = maxVolume > 0 ? 1 / maxVolume : 3
    const meterHeight = Math.min(volume * canvas.height * scaleFactor, canvas.height)
    
    // Color gradient based on volume
    let meterColor
    if (volume > 0.1) {
      meterColor = 'rgb(255, 50, 50)' // High volume: red
    } else if (volume > 0.05) {
      meterColor = 'rgb(255, 165, 0)' // Medium volume: orange
    } else {
      meterColor = 'rgb(0, 200, 0)' // Low volume: green
    }
    
    ctx.fillStyle = meterColor
    ctx.fillRect(
      canvas.width - 20,
      canvas.height - meterHeight,
      15,
      meterHeight
    )
    
    // Draw volume text
    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`Vol: ${(volume * 100).toFixed(1)}%`, canvas.width - 25, 20)
  }
  
  // Draw a grid background for the canvas
  const drawBackgroundGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)'
    ctx.lineWidth = 1
    
    // Draw horizontal lines
    const step = height / 5
    for (let i = 1; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * step)
      ctx.lineTo(width, i * step)
      ctx.stroke()
    }
    
    // Draw vertical lines
    const vStep = width / 10
    for (let i = 1; i < 10; i++) {
      ctx.beginPath()
      ctx.moveTo(i * vStep, 0)
      ctx.lineTo(i * vStep, height)
      ctx.stroke()
    }
  }

  // Toggle legacy API fallback
  const toggleLegacyApiFallback = () => {
    // If we're currently recording, stop first
    if (recording) {
      stopRecording()
    }
    
    // Toggle the setting
    setDisableLegacyApi(prev => !prev)
    
    // Clean up any existing instance
    if (micStreamRef.current) {
      const micInstance = micStreamRef.current as any
      if (typeof micInstance.destroy === 'function') {
        micInstance.destroy()
      } else {
        micInstance.stop()
      }
      micStreamRef.current = null
    }
    
    // Clear any existing error
    setError(null)
  }

  return (
    <div className="app-container">
      <header>
        <h1>🎤 @foxycorps/mic-drop Demo</h1>
        <p>A modern browser microphone audio stream library</p>
      </header>

      <div className="demo-container">
        <div className="visualizer-container">
          <canvas 
            ref={canvasRef}
            width={600}
            height={200}
            className="visualizer"
          />
          
          <div className="visual-controls">
            <button 
              onClick={() => handleVisualizationChange('waveform')}
              className={visualMode === 'waveform' ? 'active' : ''}
            >
              Waveform
            </button>
            <button 
              onClick={() => handleVisualizationChange('frequency')}
              className={visualMode === 'frequency' ? 'active' : ''}
            >
              Frequency
            </button>
          </div>
        </div>

        <div className="controls">
          {!recording ? (
            <button className="record-button" onClick={startRecording}>
              Start Recording
            </button>
          ) : (
            <div className="recording-controls">
              <button className="stop-button" onClick={stopRecording}>
                Stop
              </button>
              <button className="pause-button" onClick={pauseRecording}>
                {paused ? 'Resume' : 'Pause'}
              </button>
            </div>
          )}
        </div>

        {recording && (
          <div className="status">
            <div className="status-indicator">
              <div className={`recording-dot ${paused ? 'paused' : ''}`}></div>
              <span>{paused ? 'Paused' : 'Recording'}</span>
              {!dataReceived && <span className="waiting-text">(Waiting for audio data...)</span>}
              {dataReceived && volume < 0.01 && <span className="low-volume-text">(Low volume detected - speak louder)</span>}
            </div>
          </div>
        )}

        <div className="settings-controls">
          <label className="setting-toggle">
            <input 
              type="checkbox" 
              checked={disableLegacyApi} 
              onChange={toggleLegacyApiFallback} 
            />
            <span>Disable deprecated ScriptProcessorNode fallback</span>
            <span className="help-tooltip" title="When enabled, the app will only use modern AudioWorklet API and won't fall back to the deprecated ScriptProcessorNode. This may not work in some older browsers.">ⓘ</span>
          </label>
        </div>

        {error && (
          <div className="error-message">
            <h4>Error:</h4>
            <pre>{error}</pre>
            {error.includes('ScriptProcessorNode fallback is disabled') && (
              <div className="error-help">
                <p>Your browser may not support the required modern audio APIs.</p>
                <button onClick={() => {
                  setDisableLegacyApi(false)
                  setError(null)
                }}>
                  Enable legacy API fallback
                </button>
              </div>
            )}
          </div>
        )}

        {audioFormat && (
          <div className="audio-info">
            <h3>Audio Format</h3>
            <table>
              <tbody>
                <tr>
                  <td>Channels:</td>
                  <td>{audioFormat.channels}</td>
                </tr>
                <tr>
                  <td>Sample Rate:</td>
                  <td>{audioFormat.sampleRate} Hz</td>
                </tr>
                <tr>
                  <td>Bit Depth:</td>
                  <td>{audioFormat.bitDepth} bits</td>
                </tr>
                <tr>
                  <td>Format:</td>
                  <td>{audioFormat.float ? 'Float' : 'Integer'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer>
        <p>
          Check out the <a href="https://github.com/foxycorps/mic-drop" target="_blank" rel="noopener noreferrer">GitHub repository</a> for more information
        </p>
      </footer>
    </div>
  )
}

export default App
