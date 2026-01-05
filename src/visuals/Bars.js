import * as THREE from 'three'

/**
 * Bars - Frequency spectrum bars visualization
 */
export class Bars {
  constructor(scene, preset) {
    this.scene = scene
    this.preset = preset
    this.bars = []
    this.group = new THREE.Group()
    this.scene.add(this.group)
    
    this.createBars()
  }

  createBars() {
    const barCount = 64
    const barWidth = 0.1
    const spacing = 0.15
    const totalWidth = (barCount - 1) * spacing
    
    for (let i = 0; i < barCount; i++) {
      const geometry = new THREE.BoxGeometry(barWidth, 0.1, barWidth)
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.preset.colors.primary),
        transparent: true,
        opacity: 0.8,
      })
      
      const bar = new THREE.Mesh(geometry, material)
      bar.position.x = (i - barCount / 2) * spacing
      bar.position.y = -2
      
      this.bars.push(bar)
      this.group.add(bar)
    }
  }

  update(features, controls) {
    if (!features.frequencyData) return
    
    const frequencyData = features.frequencyData
    const barCount = this.bars.length
    const dataStep = Math.floor(frequencyData.length / barCount)
    
    // Use RMS for overall amplitude scaling
    const amplitudeScale = Math.max(0, features.rms || 0) * (controls.sensitivity || 0.65) * 5
    const centroid = features.centroid || 0
    const maxCentroid = 10000 // Normalize to 0-1 range
    
    this.bars.forEach((bar, i) => {
      const dataIndex = Math.min(i * dataStep, frequencyData.length - 1)
      const magnitude = Math.max(0, (frequencyData[dataIndex] + 100) / 100) // Normalize from dB
      
      // Calculate bar height
      const height = Math.max(0.1, magnitude * amplitudeScale * 2)
      bar.scale.y = height
      bar.position.y = -2 + height / 2
      
      // Color based on centroid (pitch to color)
      if (controls.pitchToColor) {
        const hue = (centroid / maxCentroid) * 60 + this.preset.hue // Shift hue based on centroid
        bar.material.color.setHSL(hue / 360, 0.8, 0.6)
      } else {
        const hue = (i / barCount) * 60 + this.preset.hue
        bar.material.color.setHSL(hue / 360, 0.8, 0.6)
      }
      
      // Opacity based on magnitude
      bar.material.opacity = Math.min(1, magnitude * 0.8 + 0.2)
    })
  }

  updatePreset(preset) {
    this.preset = preset
    // Update bar colors based on new preset
    this.bars.forEach((bar, i) => {
      const hue = (i / this.bars.length) * 60 + preset.hue
      bar.material.color.setHSL(hue / 360, 0.8, 0.6)
    })
  }

  dispose() {
    this.bars.forEach(bar => {
      bar.geometry.dispose()
      bar.material.dispose()
    })
    this.scene.remove(this.group)
  }
}

