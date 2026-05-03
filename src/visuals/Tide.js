import * as THREE from 'three'

/**
 * Tide — reflective water surface with caustics.
 *
 * Forked from Evan Wallace's WebGL Water (https://madebyevan.com/webgl-water/,
 * https://github.com/evanw/webgl-water — MIT). The original simulates a
 * height-field with click-driven ripples and renders caustics underneath.
 * This port keeps the spirit (low-angle water surface + caustic shimmer)
 * but replaces click input with audio-driven ripple sources, runs the
 * caustic math in a single fragment shader, and recolors to the cold
 * palette: midnight blue → moonlit cyan → silver foam.
 *
 * Uniforms (per docs/agent-prompts/lane-b-visuals.md):
 *   uWaveAmp           (float) ← rms              vertex displacement
 *   uCausticDensity    (float) ← centroid         log-mapped
 *   uStandingWavePeriod(float) ← vibrato.rateHz   sinusoidal interference
 *   uCurrentDirection  (vec2)  ← f0               log-mapped 2D bias
 *   uFogDensity        (float) ← bands.low        underwater fog
 *   uSparkle           (float) ← bands.high       crest sparkle density
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
  uniform float uWaveAmp;
  uniform float uCausticDensity;
  uniform float uStandingWavePeriod;
  uniform vec2  uCurrentDirection;
  uniform float uFogDensity;
  uniform float uSparkle;

  // Cold palette
  const vec3 MIDNIGHT  = vec3(0.024, 0.047, 0.094); // deep midnight blue
  const vec3 MOONCYAN  = vec3(0.365, 0.710, 0.725); // #5db5b9
  const vec3 SILVER    = vec3(0.784, 0.851, 0.706); // #c8d9b4
  const vec3 FOAM      = vec3(0.910, 0.933, 0.961);

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
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

  // Caustic via sum-of-sines + warped fbm — cheap version of Evan Wallace's
  // refracted-light pattern, but parameterised for audio.
  float caustic(vec2 p, float density){
    vec2 q = p * (3.0 + density * 7.0);
    q += uCurrentDirection * uTime * 0.4;
    float c = 0.0;
    for(int i = 0; i < 4; i++){
      float t = uTime * (0.4 + 0.15 * float(i));
      vec2 d = vec2(cos(t + float(i)*1.7), sin(t*0.8 + float(i)*2.1));
      c += pow(0.5 + 0.5*sin(dot(q + d, vec2(1.3, 1.7)) + fbm(q*0.7)), 6.0);
      q *= 1.35;
    }
    return c * 0.32;
  }

  // Standing-wave interference (vibrato.rateHz)
  float standingWave(vec2 p){
    if(uStandingWavePeriod <= 0.001) return 0.0;
    float k = 6.2832 / max(0.05, uStandingWavePeriod);
    return 0.06 * sin(p.x * 4.0) * sin(p.y * 4.0 + uTime * k);
  }

  void main(){
    vec2 frag = (gl_FragCoord.xy - 0.5*uResolution.xy) / uResolution.y;

    // Low-angle horizon — split into sky (top) and water (bottom)
    float horizon = 0.18;
    float belowHorizon = step(frag.y, horizon);

    // Water plane: project the fragment back into world XZ assuming camera
    // is just above the surface. Closer to the bottom of the screen → closer
    // to camera; closer to the horizon → further away.
    float depth = max(0.001, horizon - frag.y);
    float worldZ = 1.0 / depth;
    float worldX = frag.x * worldZ * 1.4;
    vec2 wp = vec2(worldX, worldZ);

    // Audio-driven ripple sources at fixed positions; intensity = uWaveAmp.
    float ripple = 0.0;
    vec2 sources[3];
    sources[0] = vec2(-0.6, 2.5);
    sources[1] = vec2( 0.7, 4.0);
    sources[2] = vec2( 0.0, 7.0);
    for(int i = 0; i < 3; i++){
      float r = length(wp - sources[i]);
      ripple += uWaveAmp * 0.18 * sin(r * 6.0 - uTime * 4.0) * exp(-r * 0.4);
    }

    float h = ripple + standingWave(wp);
    float c = caustic(wp, uCausticDensity);

    // Underwater fog (bands.low) — adds blue haze to far water
    float fog = 1.0 - exp(-worldZ * (0.05 + uFogDensity * 0.25));

    // Base water color
    vec3 water = mix(MIDNIGHT, MOONCYAN, c + h * 0.5);
    water = mix(water, MIDNIGHT * 1.2, fog * 0.7);

    // Specular sparkle on crests (bands.high)
    float crest = smoothstep(0.65, 0.98, c + h);
    vec3 sparkle = SILVER * crest * (0.25 + uSparkle * 1.0);
    water += sparkle;

    // Sky above horizon — soft gradient with subtle stars
    vec3 sky = mix(MIDNIGHT * 0.8, MIDNIGHT + MOONCYAN * 0.06, smoothstep(horizon, 1.0, frag.y));
    float starSeed = hash(floor(frag * uResolution.y * 0.5));
    if(starSeed > 0.997) sky += vec3(0.6) * (starSeed - 0.997) * 333.0;

    vec3 col = mix(sky, water, belowHorizon);

    // Vignette
    float vig = smoothstep(1.5, 0.3, length(frag));
    col *= 0.55 + 0.45 * vig;

    gl_FragColor = vec4(col, 1.0);
  }
`

export class Tide {
  constructor(scene, preset) {
    this.scene = scene
    this.preset = preset
    this.time = 0
    this.smoothCurrent = new THREE.Vector2(0, 0)

    this.geometry = new THREE.PlaneGeometry(2, 2)
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uWaveAmp: { value: 0 },
      uCausticDensity: { value: 0 },
      uStandingWavePeriod: { value: 0 },
      uCurrentDirection: { value: new THREE.Vector2(0, 0) },
      uFogDensity: { value: 0 },
      uSparkle: { value: 0 },
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

    // f0 → 2D current bias (log-mapped angle)
    const f0 = audio?.f0
    let cx = 0
    let cy = 0
    if (f0 && f0 > 20) {
      const k = Math.log2(Math.max(80, Math.min(1200, f0)) / 80) / Math.log2(1200 / 80)
      const angle = k * Math.PI * 2
      cx = Math.cos(angle) * 0.7
      cy = Math.sin(angle) * 0.7
    }
    // smooth current direction so it doesn't jitter
    this.smoothCurrent.x = this.smoothCurrent.x * 0.92 + cx * 0.08
    this.smoothCurrent.y = this.smoothCurrent.y * 0.92 + cy * 0.08

    const vib = audio?.vibrato
    const standingPeriod = vib?.active ? Math.max(0.1, 1 / Math.max(0.5, vib.rateHz || 5)) : 0

    this.uniforms.uTime.value = this.time
    this.uniforms.uWaveAmp.value = Math.min(1.5, (audio?.rms ?? 0) * 3)
    this.uniforms.uCausticDensity.value = audio?.centroid ?? 0
    this.uniforms.uStandingWavePeriod.value = standingPeriod
    this.uniforms.uCurrentDirection.value.copy(this.smoothCurrent)
    this.uniforms.uFogDensity.value = audio?.bands?.low ?? 0
    this.uniforms.uSparkle.value = audio?.bands?.high ?? 0
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
