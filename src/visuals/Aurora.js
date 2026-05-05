import * as THREE from 'three'

/**
 * Aurora — borealis ribbons over a starfield.
 *
 * Forked from Shadertoy "Auroras" by nimitz (https://www.shadertoy.com/view/XtGGRt,
 * CC BY-NC-SA 3.0). Original is a flowing aurora over a star background; this
 * port keeps the layered ribbon-of-noise structure and the star layer, strips
 * the warm reds/yellows for the cool palette: navy → mint → pale rose → silver.
 *
 * Uniforms (per docs/agent-prompts/lane-b-visuals.md):
 *   uBandY        (float) ← f0                  log-mapped vertical position
 *   uWaverAmp     (float) ← vibrato.extentCents wider for strings/voice
 *   uBrightnessAM (float) ← vibrato.amDepth     woodwind/brass shimmer
 *   uRibbonSpawn  (float) ← flux                attack spawn (decaying)
 *   uRibbonCount  (float) ← harmonicEnergy      how many concurrent ribbons
 *   uTime         (float) ← seconds elapsed
 */

const VERT = /* glsl */`
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;          // normalized 0..1, bottom-left origin
  uniform float uBandY;
  uniform float uWaverAmp;
  uniform float uBrightnessAM;
  uniform float uRibbonSpawn;
  uniform float uRibbonCount;

  // Cold palette
  const vec3 NAVY  = vec3(0.016, 0.024, 0.047); // #04060c
  const vec3 MINT  = vec3(0.784, 0.851, 0.706); // #c8d9b4
  const vec3 ROSE  = vec3(0.941, 0.851, 0.831); // #f0d9d4 (used sparingly)
  const vec3 SILVER= vec3(0.910, 0.933, 0.961);

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(hash(i),                hash(i+vec2(1.0,0.0)), f.x),
      mix(hash(i+vec2(0.0,1.0)),  hash(i+vec2(1.0,1.0)), f.x), f.y);
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.5;
    for(int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  // Single ribbon: thin sinuous band centered at y = cy, with FBM displacement.
  // Brighter near its center; thickness modulated by uWaverAmp.
  vec3 ribbon(vec2 uv, float cy, float seed, float bright){
    // Cursor-driven flow: mouse.x (-1..1) accelerates / reverses horizontal
    // ribbon scroll, mouse.y nudges vertical bias.
    float flow = (uMouse.x - 0.5) * 2.0;
    float xPhase = uTime * (0.3 + flow * 0.7) + seed * 13.0;
    float displ = fbm(vec2(uv.x * 1.4 + xPhase, seed * 7.0)) - 0.5;
    displ += sin(uv.x * 3.5 + uTime * (0.6 + seed) + flow * 1.4)
           * (0.05 + uWaverAmp * 0.35);
    cy += (uMouse.y - 0.5) * 0.18;
    float y = cy + displ * 0.45;
    float thickness = 0.05 + uWaverAmp * 0.22;
    float d = abs(uv.y - y) / thickness;
    float intensity = exp(-d * d * 2.6);
    // Vertical falloff — ribbon brighter at top edge, fades to bottom
    float vshape = smoothstep(-0.5, 0.6, uv.y - cy + 0.4);
    intensity *= vshape;
    // Color gradient: deep mint at base → pale silver-mint at apex.
    // Keep colored — never pure white — so ribbons read as aurora not smoke.
    vec3 colHi = mix(MINT, SILVER, 0.35 * seed);
    vec3 colLo = MINT * 0.55;
    vec3 col = mix(colLo, colHi, smoothstep(0.0, 1.0, intensity));
    // Sparing rose hint near apex on attack-spawned ribbons
    col = mix(col, ROSE, intensity * uRibbonSpawn * 0.25 * step(0.8, seed));
    // Brighter, sharper ribbon core. Higher exponent tightens the band;
    // multiplier pushes the apex into bloom-bright territory.
    return col * pow(intensity, 1.1) * bright * 2.6;
  }

  void main(){
    vec2 frag = (gl_FragCoord.xy - 0.5*uResolution.xy) / uResolution.y;
    // map to 0..1 vertical; aurora lives mostly in upper half
    vec2 uv = vec2(frag.x, frag.y);

    // Star background — denser, brighter, more variety in twinkle.
    vec3 col = NAVY * 0.6;
    vec2 starGrid = floor(frag * uResolution.y * 0.65);
    float s = hash(starGrid);
    if(s > 0.985){
      float tw = 0.5 + 0.5 * sin(uTime * 1.7 + s * 31.0);
      col += vec3(0.85, 0.92, 1.05) * (s - 0.985) * 360.0 * tw;
    }
    // Mint horizon glow on flux spike, cursor-modulated for taste.
    col += MINT * (0.05 + 0.18 * uRibbonSpawn) * smoothstep(-0.4, -1.0, frag.y);

    // Ribbons — count driven by harmonicEnergy (1..5)
    float count = clamp(1.0 + floor(uRibbonCount * 4.0 + 0.5), 1.0, 5.0);
    float bright = 0.85 + uBrightnessAM * 0.6;
    bright *= 0.85 + 0.15 * sin(uTime * 6.0 * (0.5 + uBrightnessAM));

    // Primary ribbon at uBandY; siblings offset above/below
    for(int i = 0; i < 5; i++){
      if(float(i) >= count) break;
      float seed = fract(sin(float(i) * 12.9898) * 43758.5453);
      float offset = (float(i) - (count - 1.0) * 0.5) * 0.28;
      float cy = clamp(uBandY + offset, -0.6, 0.7);
      // Spawned ribbon: extra brightness on flux spike
      float b = bright * (1.0 + uRibbonSpawn * (0.4 + 0.6 * seed));
      col += ribbon(uv, cy, seed, b);
    }

    // Stronger vignette — deeper edge falloff for cinematic dome feel.
    float vig = smoothstep(1.6, 0.2, length(frag));
    col *= 0.4 + 0.6 * vig;

    // ACES filmic + gamma → ribbon cores bloom hard, sky goes deep.
    vec3 mapped = clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14), 0.0, 1.0);
    mapped = pow(mapped, vec3(1.0/2.2));
    gl_FragColor = vec4(mapped, 1.0);
  }
`

export class Aurora {
  constructor(scene, preset) {
    this.scene = scene
    this.preset = preset
    this.time = 0
    this.spawn = 0

    this.geometry = new THREE.PlaneGeometry(2, 2)
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uBandY: { value: 0.2 },
      uWaverAmp: { value: 0 },
      uBrightnessAM: { value: 0 },
      uRibbonSpawn: { value: 0 },
      uRibbonCount: { value: 0 },
    }
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  update(audio, controls) {
    const dt = 1 / 60
    this.time += dt

    // ease-out spawn from flux
    const flux = audio?.flux ?? 0
    this.spawn = Math.max(this.spawn * Math.exp(-dt / 0.5), flux)

    const f0 = audio?.f0
    let bandY = 0.2
    if (f0 && f0 > 20) {
      const k = Math.log2(Math.max(80, Math.min(1200, f0)) / 80) / Math.log2(1200 / 80)
      bandY = -0.4 + k * 1.0 // -0.4..0.6
    }

    const vib = audio?.vibrato
    const waver = vib?.active ? Math.min(1, (vib.extentCents || 0) / 80) : 0
    const am = vib?.active ? (vib.amDepth || 0) : 0

    this.uniforms.uTime.value = this.time
    this.uniforms.uBandY.value = bandY
    this.uniforms.uWaverAmp.value = waver
    this.uniforms.uBrightnessAM.value = am
    this.uniforms.uRibbonSpawn.value = this.spawn
    this.uniforms.uRibbonCount.value = audio?.harmonicEnergy ?? 0
  }

  setPointer(pointer) {
    if (!pointer) return
    const m = pointer.mouse
    if (m) this.uniforms.uMouse.value.set(m.x, m.y)
  }

  updatePreset(preset) {
    this.preset = preset
  }

  resize(w, h) {
    this.uniforms.uResolution.value.set(w, h)
  }

  dispose() {
    this.scene.remove(this.mesh)
    this.geometry.dispose()
    this.material.dispose()
  }
}
