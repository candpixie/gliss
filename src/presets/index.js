/**
 * Presets - Visual preset configurations
 */

export const presets = {
  'Neon Spectrum': {
    name: 'Neon Spectrum',
    description: 'Classic frequency bars with bloom glow',
    colors: {
      primary: '#8b5cf6', // violet-500
      secondary: '#d946ef', // fuchsia-500
      accent: '#a78bfa', // violet-400
    },
    hue: 270, // Purple base hue
    bloom: 0.75,
    style: 'bars',
  },
  
  'Aurora Ribbons': {
    name: 'Aurora Ribbons',
    description: 'Flowing ribbons controlled by spectral centroid',
    colors: {
      primary: '#06b6d4', // cyan-500
      secondary: '#8b5cf6', // violet-500
      accent: '#ec4899', // pink-500
    },
    hue: 180, // Cyan base hue
    bloom: 0.8,
    style: 'ribbons',
  },
  
  'Cyber Rosette': {
    name: 'Cyber Rosette',
    description: 'Radial visualization with onset-triggered rings',
    colors: {
      primary: '#f59e0b', // amber-500
      secondary: '#ef4444', // red-500
      accent: '#8b5cf6', // violet-500
    },
    hue: 30, // Orange/amber base hue
    bloom: 0.7,
    style: 'radial',
  },
}

/**
 * Get preset by name
 */
export function getPreset(name) {
  return presets[name] || presets['Neon Spectrum']
}

/**
 * Get all preset names
 */
export function getPresetNames() {
  return Object.keys(presets)
}

