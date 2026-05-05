import * as THREE from 'three'

/**
 * Glacier — crystalline shards in a dark teal sea.
 *
 * Forked from Shadertoy "Curious Crystal" by mrange
 * (https://www.shadertoy.com/view/slccDX, CC BY-NC-SA 3.0).
 * The original raymarches scattering media inside a refractive substance;
 * this port keeps that structure (refractive boundary + internal
 * volumetric scattering) but swaps constants for AudioFrame uniforms
 * and recolors to the cold palette: deep navy → ice teal → frost white.
 *
 * Uniforms (per docs/agent-prompts/lane-b-visuals.md):
 *   uHighlightAxis (vec3)  ← f0 → vertical highlight position
 *   uShimmer       (float) ← vibrato active ? amDepth + extentCents/100 : 0
 *   uCrack         (float) ← flux, ease-out ~400ms
 *   uTranslucency  (float) ← harmonicEnergy (smoothed)
 *   uParticleBurst (float) ← percussiveEnergy (drives particle layer)
 *   uTime          (float) ← seconds elapsed
 */

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
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
  uniform vec3  uHighlightAxis;
  uniform float uShimmer;
  uniform float uShimmerRate;
  uniform float uCrack;
  uniform float uTranslucency;

  // Cold palette
  const vec3 COLD_DEEP   = vec3(0.016, 0.024, 0.047); // #04060c
  const vec3 COLD_TEAL   = vec3(0.365, 0.710, 0.725); // #5db5b9
  const vec3 COLD_FROST  = vec3(0.910, 0.933, 0.961); // #e8eef5
  const vec3 COLD_ACCENT = vec3(0.557, 0.722, 0.788); // #8eb8c9

  // Hash + noise (iq)
  float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
  float noise(vec3 p){
    vec3 i = floor(p); vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
          mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
          mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p){
    float v = 0.0; float a = 0.5;
    for(int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  // Crystal SDF: union of rotated boxes → "shards"
  float sdBox(vec3 p, vec3 b){ vec3 q = abs(p)-b; return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0); }
  mat3 rot(vec3 a, float t){
    float c = cos(t), s = sin(t); vec3 n = normalize(a);
    return mat3(
      c + (1.0-c)*n.x*n.x,        (1.0-c)*n.x*n.y - s*n.z,  (1.0-c)*n.x*n.z + s*n.y,
      (1.0-c)*n.y*n.x + s*n.z,    c + (1.0-c)*n.y*n.y,      (1.0-c)*n.y*n.z - s*n.x,
      (1.0-c)*n.z*n.x - s*n.y,    (1.0-c)*n.z*n.y + s*n.x,  c + (1.0-c)*n.z*n.z
    );
  }
  float scene(vec3 p){
    float d = 1e9;
    // primary shard
    vec3 q = rot(vec3(0.4,1.0,0.2), uTime*0.15) * p;
    d = min(d, sdBox(q, vec3(0.55, 1.6, 0.55)));
    // secondary cluster
    vec3 r = rot(vec3(1.0,0.3,0.6), -uTime*0.11 + 1.2) * (p + vec3(1.4, -0.2, 0.6));
    d = min(d, sdBox(r, vec3(0.35, 1.1, 0.35)));
    vec3 s = rot(vec3(0.2,0.7,0.9), uTime*0.09 + 2.4) * (p + vec3(-1.5, 0.4, -0.4));
    d = min(d, sdBox(s, vec3(0.30, 0.9, 0.30)));
    // refractive wobble (vibrato shimmer)
    float wob = uShimmer * 0.06 * sin(uTime * 6.2832 * uShimmerRate + p.y * 3.0);
    return d - 0.05 + wob;
  }
  vec3 nrm(vec3 p){
    vec2 e = vec2(0.0015, 0.0);
    return normalize(vec3(
      scene(p+e.xyy) - scene(p-e.xyy),
      scene(p+e.yxy) - scene(p-e.yxy),
      scene(p+e.yyx) - scene(p-e.yyx)));
  }

  void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy) / uResolution.y;
    vec3 ro = vec3(0.0, 0.0, 4.5);
    vec3 rd = normalize(vec3(uv, -1.4));

    // Raymarch surface
    float t = 0.0; float hit = -1.0;
    for(int i = 0; i < 64; i++){
      vec3 p = ro + rd * t;
      float d = scene(p);
      if(d < 0.001){ hit = t; break; }
      t += d * 0.85;
      if(t > 12.0) break;
    }

    vec3 col = COLD_DEEP;

    // background gradient + soft moonlit fog
    float bgY = 0.5 - uv.y * 0.5;
    col = mix(COLD_DEEP, COLD_DEEP + COLD_TEAL * 0.08, bgY);

    if(hit > 0.0){
      vec3 p = ro + rd * hit;
      vec3 n = nrm(p);

      // Sharper rim (higher Fresnel exponent → thinner, brighter edge).
      float ndv = max(0.0, dot(n, -rd));
      float rim = pow(1.0 - ndv, 4.5);
      // Specular hot-spot — sharp, bright, audio-modulated.
      vec3  L = normalize(vec3(0.45, 0.85, 0.55));
      vec3  H = normalize(L - rd);
      float spec = pow(max(0.0, dot(n, H)), 64.0);
      // highlight cluster glow follows f0
      float cluster = exp(-pow((p.y - uHighlightAxis.y) * 1.5, 2.0));
      // refraction tint via internal scattering proxy
      float scatter = fbm(p * 1.6 + uTime * 0.05);
      float trans = mix(0.18, 0.95, uTranslucency);
      vec3 inner = mix(COLD_DEEP * 0.6, COLD_TEAL, scatter);

      vec3 surf = mix(inner, COLD_ACCENT, rim);
      surf = mix(surf, COLD_FROST * 1.6, rim * cluster * (0.7 + 0.6 * uShimmer));
      surf += COLD_FROST * spec * (1.2 + 2.5 * uShimmer);
      surf *= mix(0.55, 1.55, trans);

      // Secondary cursor-driven highlight: rim-modulated glow at the mouse.
      vec2 mouseUv = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
      float md = length(uv - mouseUv);
      float mouseHL = exp(-md * md / 0.035);
      surf = mix(surf, COLD_FROST * 1.8, rim * mouseHL * 1.0);
      surf += COLD_FROST * mouseHL * spec * 1.4;

      // crack: white fissures on attack, decays via uCrack — hotter & sharper.
      float crackPattern = smoothstep(0.78, 0.96, fbm(p * 4.5 + vec3(uTime*0.4)));
      surf += COLD_FROST * crackPattern * uCrack * 3.0;

      // depth fog
      float fog = exp(-hit * 0.18);
      col = mix(col, surf, fog);
    }

    // Stronger vignette → deeper darks at edges.
    float vig = smoothstep(1.5, 0.25, length(uv));
    col *= 0.35 + 0.65 * vig;

    // ACES filmic tone-map + gamma — gives bloom something to bite on
    // and pushes the blacks low without crushing color.
    vec3 x = col;
    vec3 mapped = clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);
    mapped = pow(mapped, vec3(1.0/2.2));

    gl_FragColor = vec4(mapped, 1.0);
  }
`

export class Glacier {
  constructor(scene, preset) {
    this.scene = scene
    this.preset = preset
    this.time = 0
    this.crack = 0
    this.particle = 0

    // fullscreen quad
    this.geometry = new THREE.PlaneGeometry(2, 2)
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHighlightAxis: { value: new THREE.Vector3(0, 0, 0) },
      uShimmer: { value: 0 },
      uShimmerRate: { value: 5.5 },
      uCrack: { value: 0 },
      uTranslucency: { value: 0.4 },
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

    // particle layer for percussiveEnergy
    this._buildParticles()
  }

  _buildParticles() {
    const n = 600
    const positions = new Float32Array(n * 3)
    const seeds = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 6
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2
      seeds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    this.particleUniforms = {
      uTime: { value: 0 },
      uBurst: { value: 0 },
    }
    const mat = new THREE.ShaderMaterial({
      uniforms: this.particleUniforms,
      vertexShader: /* glsl */`
        attribute float aSeed;
        uniform float uTime;
        uniform float uBurst;
        varying float vAlpha;
        void main(){
          vec3 p = position;
          float wob = sin(uTime * 1.6 + aSeed * 12.0) * 0.08;
          p.y += wob + uBurst * (aSeed - 0.5) * 0.6;
          p.x += cos(uTime * 0.9 + aSeed * 8.0) * 0.05;
          vAlpha = 0.15 + uBurst * 0.85;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.5 + uBurst * 4.5) * (1.0 + aSeed);
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        varying float vAlpha;
        void main(){
          vec2 d = gl_PointCoord - 0.5;
          float a = smoothstep(0.5, 0.0, length(d)) * vAlpha;
          gl_FragColor = vec4(vec3(0.91, 0.93, 0.96), a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.particles = new THREE.Points(geo, mat)
    this.particles.frustumCulled = false
    this.scene.add(this.particles)
    this._particleGeo = geo
    this._particleMat = mat
  }

  update(audio, controls) {
    const dt = 1 / 60
    this.time += dt

    // ease-out crack from flux spike (~400ms tau)
    const flux = audio?.flux ?? 0
    this.crack = Math.max(this.crack * Math.exp(-dt / 0.4), flux)

    // ease-out particle burst from percussiveEnergy
    const perc = audio?.percussiveEnergy ?? 0
    this.particle = Math.max(this.particle * Math.exp(-dt / 0.3), perc)

    // f0 → log-mapped vertical highlight position
    const f0 = audio?.f0
    let yHL = 0
    if (f0 && f0 > 20) {
      // map 80..1200 Hz log → -1.4..1.4
      const k = Math.log2(Math.max(80, Math.min(1200, f0)) / 80) / Math.log2(1200 / 80)
      yHL = -1.4 + k * 2.8
    }

    const vib = audio?.vibrato
    const shimmer = vib?.active ? Math.min(1, (vib.amDepth || 0) + (vib.extentCents || 0) / 100) : 0

    this.uniforms.uTime.value = this.time
    this.uniforms.uHighlightAxis.value.set(0, yHL, 0)
    this.uniforms.uShimmer.value = shimmer
    this.uniforms.uShimmerRate.value = vib?.active ? Math.max(2, vib.rateHz || 5) : 5.5
    this.uniforms.uCrack.value = this.crack
    this.uniforms.uTranslucency.value = audio?.harmonicEnergy ?? 0

    this.particleUniforms.uTime.value = this.time
    this.particleUniforms.uBurst.value = this.particle
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
    this.scene.remove(this.particles)
    this.geometry.dispose()
    this.material.dispose()
    this._particleGeo.dispose()
    this._particleMat.dispose()
  }
}
