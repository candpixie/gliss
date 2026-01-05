/**
 * Features - Audio feature extraction (RMS, centroid, flux, band energy)
 */

/**
 * Calculate RMS (Root Mean Square) - measures loudness
 */
export function calculateRMS(timeData) {
  let sum = 0
  for (let i = 0; i < timeData.length; i++) {
    sum += timeData[i] * timeData[i]
  }
  return Math.sqrt(sum / timeData.length)
}

/**
 * Calculate Spectral Centroid - brightness of sound
 */
export function calculateCentroid(frequencyData, sampleRate = 44100) {
  let weightedSum = 0
  let magnitudeSum = 0
  
  const nyquist = sampleRate / 2
  const binWidth = nyquist / frequencyData.length
  
  for (let i = 0; i < frequencyData.length; i++) {
    const magnitude = Math.pow(10, frequencyData[i] / 20) // Convert dB to linear
    const frequency = i * binWidth
    weightedSum += frequency * magnitude
    magnitudeSum += magnitude
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
}

/**
 * Calculate Spectral Flux - detects onsets/transients
 */
export function calculateFlux(frequencyData, previousFrequencyData) {
  let flux = 0
  
  for (let i = 0; i < frequencyData.length; i++) {
    const diff = frequencyData[i] - (previousFrequencyData[i] || 0)
    if (diff > 0) {
      flux += diff
    }
  }
  
  return flux
}

/**
 * Calculate Band Energy - energy in frequency ranges
 */
export function calculateBandEnergy(frequencyData, lowEnd = 60, midEnd = 2000, highEnd = 8000, sampleRate = 44100) {
  const nyquist = sampleRate / 2
  const binWidth = nyquist / frequencyData.length
  
  let lowEnergy = 0
  let midEnergy = 0
  let highEnergy = 0
  
  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = i * binWidth
    const magnitude = Math.pow(10, frequencyData[i] / 20) // Convert dB to linear
    
    if (frequency < lowEnd) {
      lowEnergy += magnitude
    } else if (frequency < midEnd) {
      midEnergy += magnitude
    } else if (frequency < highEnd) {
      highEnergy += magnitude
    }
  }
  
  return { low: lowEnergy, mid: midEnergy, high: highEnergy }
}

/**
 * Extract all audio features
 */
let previousFrequencyData = null

export function extractFeatures(frequencyData, timeData, sampleRate = 44100) {
  const rms = calculateRMS(timeData)
  const centroid = calculateCentroid(frequencyData, sampleRate)
  const flux = previousFrequencyData 
    ? calculateFlux(frequencyData, previousFrequencyData)
    : 0
  const bands = calculateBandEnergy(frequencyData, 60, 2000, 8000, sampleRate)
  
  // Store current frequency data for next flux calculation
  previousFrequencyData = new Float32Array(frequencyData)
  
  return {
    rms,
    centroid,
    flux,
    bands,
    frequencyData: new Float32Array(frequencyData),
    timeData: new Float32Array(timeData),
  }
}

/**
 * Smooth feature values using exponential moving average
 */
export function smoothFeature(current, previous, alpha = 0.3) {
  if (previous === undefined || previous === null) {
    return current
  }
  return alpha * current + (1 - alpha) * previous
}

