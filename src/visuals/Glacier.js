import * as THREE from 'three'

/**
 * Glacier — a screen-filling crystalline ice sheet.
 *
 * Original GLSL: drifting Voronoi ice plates with frost seams, faceted
 * micro-detail, and a sparkle dusting, over a cold vertical depth gradient
 * (deep navy → ice teal → frost white). Every pixel is glacier — no floating
 * geometry. Driven by AudioFrame uniforms.
 *
 * Uniforms:
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

  // Hash + value noise + fbm (2D, screen-space ice field)
  float hash1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2  hash2(vec2 p){
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    float a = hash1(i),           b = hash1(i+vec2(1,0));
    float c = hash1(i+vec2(0,1)), d = hash1(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 5; i++){ v += a*vnoise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  // Voronoi ice plates → vec3(F1 dist, F2 dist, cell random). Cells drift slowly.
  vec3 voronoi(vec2 x){
    vec2 n = floor(x), f = fract(x);
    float f1 = 8.0, f2 = 8.0; vec2 mg = vec2(0.0);
    for(int j = -1; j <= 1; j++)
    for(int i = -1; i <= 1; i++){
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.5 * sin(uTime * 0.22 + 6.2831 * o);   // gentle plate drift
      vec2 r = g + o - f;
      float d = dot(r, r);
      if(d < f1){ f2 = f1; f1 = d; mg = n + g + o; }
      else if(d < f2){ f2 = d; }
    }
    return vec3(sqrt(f1), sqrt(f2), hash1(mg));
  }

  void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy) / uResolution.y;

    // Domain-warp the whole field so plates read organic, not gridded.
    // Vibrato adds a refractive horizontal shimmer.
    float shim = uShimmer * 0.10 * sin(uTime * 6.2831 * uShimmerRate * 0.16 + uv.y * 4.0);
    vec2 warp = vec2(fbm(uv*1.7 + uTime*0.03), fbm(uv*1.7 + 5.2 - uTime*0.025));
    vec2 p = uv * 3.1 + (warp - 0.5) * 0.85 + vec2(shim, 0.0);

    // Two scales of ice plates fill the entire frame.
    vec3 v1 = voronoi(p);
    vec3 v2 = voronoi(p * 2.4 + 11.0);

    // Cracks = thin seams where two plates meet (small F2-F1).
    float edge1 = smoothstep(0.07, 0.0, v1.y - v1.x);
    float edge2 = smoothstep(0.05, 0.0, v2.y - v2.x) * 0.55;
    float cracks = clamp(edge1 + edge2, 0.0, 1.0);

    // Per-plate ice tone + faceted micro-detail.
    float plate = mix(0.30, 1.0, v1.z);
    float facet = fbm(p * 3.2) * 0.5 + 0.5;

    // Base vertical depth: deep navy up top, frosted toward the bottom.
    float depth = clamp(0.5 - uv.y * 0.7, 0.0, 1.0);
    vec3 col = mix(COLD_DEEP, COLD_DEEP + COLD_TEAL * 0.10, depth);

    // Ice body — every pixel is glacier now.
    vec3 ice = mix(COLD_DEEP, COLD_TEAL, plate * 0.85 * facet);
    ice = mix(ice, COLD_ACCENT, pow(facet, 2.0) * 0.55);
    ice *= mix(0.55, 1.25, uTranslucency);
    col = mix(col, ice, 0.88);

    // f0 → a glowing frost ridge that rides up/down with pitch.
    float band = exp(-pow((uv.y - uHighlightAxis.y * 0.5) * 2.2, 2.0));
    col += COLD_FROST * band * (0.12 + 0.30 * uShimmer);

    // Plate seams as frost lines; attacks flash them white.
    col += COLD_FROST * cracks * (0.22 + uCrack * 1.5);

    // Sparkle dusting on the ice.
    float spark = smoothstep(0.86, 1.0, fbm(p * 6.5 - uTime * 0.12));
    col += COLD_FROST * spark * 0.20;

    // Soft vignette + fog.
    float vig = smoothstep(1.55, 0.35, length(uv));
    col *= 0.50 + 0.50 * vig;

    gl_FragColor = vec4(col, 1.0);
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
