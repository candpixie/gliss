import * as THREE from 'three'
import { EffectComposer, BloomEffect, RenderPass } from 'postprocessing'
import { Glacier } from './Glacier'
import { Tide } from './Tide'
import { Aurora } from './Aurora'
import { getPreset } from '../presets'

const PRESET_MODULES = {
  glacier: Glacier,
  tide: Tide,
  aurora: Aurora,
}

function moduleFor(preset) {
  return PRESET_MODULES[preset?.style] || Glacier
}

/**
 * Scene — Three.js scene + active preset module.
 * Swaps in the matching preset (Glacier / Tide / Aurora) based on preset.style.
 */
export class Scene {
  constructor(canvas, presetName, controls) {
    this.canvas = canvas
    this.preset = typeof presetName === 'string' ? getPreset(presetName) : presetName
    this.controls = controls

    const width = canvas.width || canvas.clientWidth || window.innerWidth || 800
    const height = canvas.height || canvas.clientHeight || window.innerHeight || 600

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x04060c)

    const aspect = width / height
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    this.camera.position.z = 5

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // allow MediaRecorder / screenshot capture
    })
    this.renderer.setSize(width, height, false)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    try {
      this.composer = new EffectComposer(this.renderer, { multisampling: 4 })
      const renderPass = new RenderPass(this.scene, this.camera)
      this.composer.addPass(renderPass)
      this.bloomEffect = new BloomEffect({
        intensity: controls?.bloom ?? this.preset.bloom ?? 1.1,
        luminanceThreshold: 0.55,
        luminanceSmoothing: 0.7,
      })
      this.composer.addEffect(this.bloomEffect)
      this.composer.setSize(width, height)
      this.useComposer = true
    } catch (error) {
      console.warn('Post-processing not available, using direct renderer:', error)
      this.useComposer = false
      this.composer = null
      this.bloomEffect = null
    }

    // active preset module
    const Module = moduleFor(this.preset)
    this.activeModule = new Module(this.scene, this.preset)
    if (typeof this.activeModule.resize === 'function') {
      this.activeModule.resize(width, height)
    }

    this.animate = this.animate.bind(this)
    this.animationId = null
    this.animate()
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate)
    if (this.useComposer && this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  update(features, controls) {
    this.controls = controls
    if (this.bloomEffect) {
      this.bloomEffect.intensity = controls?.bloom ?? this.preset.bloom ?? 1.1
    }
    if (this.activeModule) {
      this.activeModule.update(features, controls)
    }
  }

  setPointer(pointer) {
    if (this.activeModule && typeof this.activeModule.setPointer === 'function') {
      this.activeModule.setPointer(pointer)
    }
  }

  updateControls(controls) {
    this.controls = controls
    if (this.bloomEffect) {
      this.bloomEffect.intensity = controls?.bloom ?? this.preset.bloom ?? 1.1
    }
  }

  updatePreset(presetOrName) {
    const next = typeof presetOrName === 'string' ? getPreset(presetOrName) : presetOrName
    if (!next) return
    if (this.preset?.style === next.style && this.activeModule) {
      this.preset = next
      if (typeof this.activeModule.updatePreset === 'function') {
        this.activeModule.updatePreset(next)
      }
      return
    }
    // style changed → dispose + instantiate
    if (this.activeModule && typeof this.activeModule.dispose === 'function') {
      this.activeModule.dispose()
    }
    this.preset = next
    const Module = moduleFor(next)
    this.activeModule = new Module(this.scene, next)
    const w = this.canvas.width
    const h = this.canvas.height
    if (typeof this.activeModule.resize === 'function') {
      this.activeModule.resize(w, h)
    }
  }

  resize(width, height) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    if (this.composer) this.composer.setSize(width, height)
    if (this.activeModule && typeof this.activeModule.resize === 'function') {
      this.activeModule.resize(width, height)
    }
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.activeModule && typeof this.activeModule.dispose === 'function') {
      this.activeModule.dispose()
    }
    if (this.composer) {
      this.composer.dispose()
    }
    this.renderer.dispose()
  }
}
