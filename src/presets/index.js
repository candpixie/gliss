/**
 * Presets — cold-elemental v1 set.
 * Each preset is consumed by the Three.js scene module of the same name.
 * Lane B reads the `style` field to instantiate the matching scene.
 */

export const presets = {
  Glacier: {
    name: 'Glacier',
    description: 'Crystalline shards in a dark teal sea — pitch lights the cluster, vibrato shimmers.',
    colors: {
      primary: '#8eb8c9',   // accent.glacier — frost-blue
      secondary: '#cfe1ea', // pale ice
      accent: '#e8eef5',    // text.primary as rim-light
    },
    hue: 200,
    bloom: 0.55,
    style: 'glacier',
  },

  Tide: {
    name: 'Tide',
    description: 'Reflective water surface with caustics — RMS swells, vibrato sets standing waves.',
    colors: {
      primary: '#5db5b9',   // accent.tide — glacier-teal
      secondary: '#8eb8c9',
      accent: '#cfe1ea',
    },
    hue: 190,
    bloom: 0.5,
    style: 'tide',
  },

  Aurora: {
    name: 'Aurora',
    description: 'Borealis ribbons — pitch sets height, vibrato modulates waver and brightness.',
    colors: {
      primary: '#c8d9b4',   // accent.aurora — mint pale
      secondary: '#8eb8c9',
      accent: '#dccbd6',    // pale rose hint
    },
    hue: 150,
    bloom: 0.65,
    style: 'aurora',
  },
}

/**
 * Get preset by name. Falls back to Glacier when the name is unknown.
 */
export function getPreset(name) {
  return presets[name] || presets.Glacier
}

/**
 * Get all preset names in display order.
 */
export function getPresetNames() {
  return Object.keys(presets)
}
