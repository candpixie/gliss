import * as THREE from 'three'

/**
 * Rings - Onset-triggered pulse rings visualization
 */
export class Rings {
  constructor(scene, preset) {
    this.scene = scene
    this.preset = preset
    this.rings = []
    this.group = new THREE.Group()
    this.scene.add(this.group)
    
    this.activeRings = []
    this.previousFlux = 0
    this.fluxThreshold = 50
  }

  createRing(radius, color) {
    const geometry = new THREE.RingGeometry(radius, radius + 0.1, 64)
    const material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    })
    
    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -2
    
    return ring
  }

  update(features, controls) {
    if (!controls.onsetRings) {
      // Remove all active rings if feature is disabled
      this.activeRings.forEach(ring => {
        this.group.remove(ring.mesh)
        ring.mesh.geometry.dispose()
        ring.mesh.material.dispose()
      })
      this.activeRings = []
      return
    }
    
    const flux = features.flux || 0
    const fluxDelta = flux - this.previousFlux
    
    // Trigger new ring on significant flux increase (onset detection)
    if (fluxDelta > this.fluxThreshold) {
      const color = new THREE.Color(this.preset.colors.secondary)
      const ring = this.createRing(0.5, color)
      this.group.add(ring)
      
      this.activeRings.push({
        mesh: ring,
        radius: 0.5,
        maxRadius: 3,
        speed: 0.05,
        opacity: 0.8,
      })
    }
    
    this.previousFlux = flux
    
    // Update and remove expired rings
    this.activeRings = this.activeRings.filter(ringData => {
      const ring = ringData.mesh
      ringData.radius += ringData.speed
      ringData.opacity -= 0.02
      
      ring.scale.set(ringData.radius / 0.5, 1, ringData.radius / 0.5)
      ring.material.opacity = ringData.opacity
      
      // Remove ring if it's too large or too transparent
      if (ringData.radius > ringData.maxRadius || ringData.opacity <= 0) {
        this.group.remove(ring)
        ring.geometry.dispose()
        ring.material.dispose()
        return false
      }
      
      return true
    })
  }

  updatePreset(preset) {
    this.preset = preset
    // New rings will use new preset colors
  }

  dispose() {
    this.activeRings.forEach(ringData => {
      this.group.remove(ringData.mesh)
      ringData.mesh.geometry.dispose()
      ringData.mesh.material.dispose()
    })
    this.activeRings = []
    this.scene.remove(this.group)
  }
}

