/**
 * Analyser - FFT wrapper for audio analysis
 */

export class Analyser {
  constructor(audioContext, source, options = {}) {
    this.audioContext = audioContext
    this.analyser = audioContext.createAnalyser()
    
    // Configure FFT
    this.analyser.fftSize = options.fftSize || 2048
    this.analyser.smoothingTimeConstant = options.smoothing || 0.8
    
    // Connect source to analyser
    if (source) {
      source.connect(this.analyser)
    }
    
    // Create data arrays
    this.frequencyBinCount = this.analyser.frequencyBinCount
    this.frequencyData = new Float32Array(this.frequencyBinCount)
    this.timeData = new Float32Array(this.analyser.fftSize)
  }

  getFrequencyData() {
    this.analyser.getFloatFrequencyData(this.frequencyData)
    return this.frequencyData
  }

  getTimeData() {
    this.analyser.getFloatTimeDomainData(this.timeData)
    return this.timeData
  }

  getAnalyserNode() {
    return this.analyser
  }

  setFFTSize(size) {
    this.analyser.fftSize = size
    this.frequencyBinCount = this.analyser.frequencyBinCount
    this.frequencyData = new Float32Array(this.frequencyBinCount)
    this.timeData = new Float32Array(this.analyser.fftSize)
  }

  setSmoothing(value) {
    this.analyser.smoothingTimeConstant = value
  }

  connect(source) {
    source.connect(this.analyser)
  }

  disconnect() {
    this.analyser.disconnect()
  }
}

