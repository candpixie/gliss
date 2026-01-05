/**
 * Bloom - Post-processing bloom effect configuration
 * 
 * This module exports utility functions for configuring bloom effects.
 * The actual bloom implementation is handled by the postprocessing library
 * in Scene.js, but this file can contain bloom-related utilities if needed.
 */

/**
 * Calculate bloom intensity based on audio RMS
 */
export function calculateBloomIntensity(rms, baseIntensity = 0.75, sensitivity = 1.0) {
  const normalizedRMS = Math.max(0, Math.min(1, rms * 10)) // Normalize RMS to 0-1
  return baseIntensity + normalizedRMS * 0.5 * sensitivity
}

/**
 * Get bloom configuration for a preset
 */
export function getBloomConfig(preset) {
  return {
    intensity: preset.bloom || 0.75,
    luminanceThreshold: 0.4,
    luminanceSmoothing: 0.9,
  }
}

