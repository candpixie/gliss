import * as THREE from 'three'
import { EffectComposer, BloomEffect, RenderPass } from 'postprocessing'
import { Bars } from './Bars'
import { Rings } from './Rings'
import { getPreset } from '../presets'

/**
 * Scene - Main Three.js scene manager
 */
export class Scene {
  constructor(canvas, presetName, controls) {
    this.canvas = canvas
    this.preset = getPreset(presetName)
    this.controls = controls
    
    // Get canvas dimensions
    const width = canvas.clientWidth || canvas.width || 800
    const height = canvas.clientHeight || canvas.height || 600
    
    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a0f)
    
    // Camera
    const aspect = width / height
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    this.camera.position.z = 5
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(width, height, false)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Post-processing
    this.composer = new EffectComposer(this.renderer, {
      multisampling: 4,
    })
    
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)
    
    this.bloomEffect = new BloomEffect({
      intensity: controls.bloom || 0.75,
      luminanceThreshold: 0.4,
      luminanceSmoothing: 0.9,
    })
    this.composer.addEffect(this.bloomEffect)
    
    // Visual elements
    this.bars = new Bars(this.scene, this.preset)
    this.rings = new Rings(this.scene, this.preset)
    
    // Animation
    this.animate = this.animate.bind(this)
    this.animationId = null
    this.animate()
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate)
    this.composer.render()
  }

  update(features, controls) {
    this.controls = controls
    
    // Update bloom intensity
    if (this.bloomEffect) {
      this.bloomEffect.intensity = controls.bloom || 0.75
    }
    
    // Update visual elements
    this.bars.update(features, controls)
    this.rings.update(features, controls)
  }

  updateControls(controls) {
    this.controls = controls
    if (this.bloomEffect) {
      this.bloomEffect.intensity = controls.bloom || 0.75
    }
  }

  updatePreset(presetName) {
    this.preset = getPreset(presetName)
    this.bars.updatePreset(this.preset)
    this.rings.updatePreset(this.preset)
  }

  resize(width, height) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.composer.setSize(width, height)
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.bars.dispose()
    this.rings.dispose()
    if (this.composer) {
      this.composer.dispose()
    }
    this.renderer.dispose()
  }
}

