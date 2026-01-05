/**
 * AudioInput - Handles microphone and file input
 */

export class AudioInput {
  constructor(audioContext) {
    this.audioContext = audioContext
    this.source = null
    this.stream = null
  }

  async startMicrophone() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.source = this.audioContext.createMediaStreamSource(this.stream)
      return this.source
    } catch (error) {
      console.error('Error accessing microphone:', error)
      throw error
    }
  }

  async loadFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      // Create a buffer source
      const bufferSource = this.audioContext.createBufferSource()
      bufferSource.buffer = audioBuffer
      
      // Connect to audio context destination for playback
      bufferSource.connect(this.audioContext.destination)
      
      this.source = bufferSource
      return bufferSource
    } catch (error) {
      console.error('Error loading audio file:', error)
      throw error
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    if (this.source && this.source.stop) {
      this.source.stop()
    }
    this.source = null
  }

  getSource() {
    return this.source
  }
}

