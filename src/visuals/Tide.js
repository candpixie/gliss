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
  uniform vec2  uMouse;          // normalized 0..1, bottom-left origin
  uniform vec2  uClickPos;       // last click in normalized 0..1
  uniform float uClickAge;       // seconds since last click (large = no recent click)
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

    // Click ripple — Evan-Wallace-style "drop a stone" at the cursor.
    // Project click NDC into the same world-XZ plane as the rest of the surface,
    // then add a decaying expanding ring centered there.
    if (uClickAge < 6.0) {
      vec2 clickFrag = vec2(
        (uClickPos.x - 0.5) * (uResolution.x / uResolution.y),
        uClickPos.y - 0.5
      );
      float clickDepth = max(0.001, horizon - clickFrag.y);
      float clickWZ = 1.0 / clickDepth;
      float clickWX = clickFrag.x * clickWZ * 1.4;
      vec2 clickWP = vec2(clickWX, clickWZ);
      float cr = length(wp - clickWP);
      float decay = exp(-uClickAge * 0.9);
      // Expanding wave-front: peak radius grows with age.
      float front = exp(-pow(cr - uClickAge * 1.6, 2.0) * 0.6);
      ripple += 0.32 * decay * front * sin(cr * 6.0 - uTime * 4.0);
    }

    float h = ripple + standingWave(wp);
    float c = caustic(wp, uCausticDensity);

    // Underwater fog (bands.low) — adds blue haze to far water
    float fog = 1.0 - exp(-worldZ * (0.05 + uFogDensity * 0.25));

    // Base water color — pushed darker so caustics & sparkle have somewhere
    // to peak from. Caustic curve sharpened (higher exponent on c).
    vec3 water = mix(MIDNIGHT * 0.5, MOONCYAN, pow(clamp(c + h*0.6, 0.0, 1.0), 1.4));
    water = mix(water, MIDNIGHT * 0.4, fog * 0.85);

    // Specular sparkle on crests — much sharper threshold + brighter peaks.
    float crest = smoothstep(0.78, 1.0, c + h);
    crest = pow(crest, 1.8);
    vec3 sparkle = (SILVER * 1.6 + FOAM * 0.7) * crest * (0.6 + uSparkle * 2.5);
    water += sparkle;

    // Cursor "wake": cursor-induced sparkle wherever the pointer hovers
    // over water — feels like a finger trailing through the surface.
    if (uMouse.y < 0.62) {
      vec2 mouseFrag = vec2(
        (uMouse.x - 0.5) * (uResolution.x / uResolution.y),
        uMouse.y - 0.5
      );
      float md = length(frag - mouseFrag);
      float wake = exp(-md * md * 22.0);
      water += FOAM * wake * 0.55;
    }

    // Sky above horizon — slightly darker base, brighter star pops.
    vec3 sky = mix(MIDNIGHT * 0.55, MIDNIGHT + MOONCYAN * 0.10, smoothstep(horizon, 1.0, frag.y));
    float starSeed = hash(floor(frag * uResolution.y * 0.5));
    if(starSeed > 0.996) sky += vec3(0.85, 0.92, 1.0) * (starSeed - 0.996) * 300.0;

    vec3 col = mix(sky, water, belowHorizon);

    // Stronger vignette for cinematic edges.
    float vig = smoothstep(1.6, 0.2, length(frag));
    col *= 0.32 + 0.68 * vig;

    // ACES filmic + gamma → richer blacks, blooming highlights.
    vec3 mapped = clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14), 0.0, 1.0);
    mapped = pow(mapped, vec3(1.0/2.2));
    gl_FragColor = vec4(mapped, 1.0);
  }
`

export class Tide {
  constructor(scene, preset) {
    this.scene = scene
    this.preset = preset
    this.time = 0
    this.smoothCurrent = new THREE.Vector2(0, 0)

    this.geometry = new THREE.PlaneGeometry(2, 2)
    this.clickAge = 999
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uClickPos: { value: new THREE.Vector2(0.5, 0.5) },
      uClickAge: { value: 999 },
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

    this.clickAge += dt
    this.uniforms.uClickAge.value = this.clickAge

    this.uniforms.uTime.value = this.time
    this.uniforms.uWaveAmp.value = Math.min(1.5, (audio?.rms ?? 0) * 3)
    this.uniforms.uCausticDensity.value = audio?.centroid ?? 0
    this.uniforms.uStandingWavePeriod.value = standingPeriod
    this.uniforms.uCurrentDirection.value.copy(this.smoothCurrent)
    this.uniforms.uFogDensity.value = audio?.bands?.low ?? 0
    this.uniforms.uSparkle.value = audio?.bands?.high ?? 0
  }

  setPointer(pointer) {
    if (!pointer) return
    const m = pointer.mouse
    if (m) this.uniforms.uMouse.value.set(m.x, m.y)
    const click = pointer.click
    if (click && click.serial !== this._lastClickSerial) {
      this._lastClickSerial = click.serial
      this.uniforms.uClickPos.value.set(click.x, click.y)
      this.clickAge = 0
    }
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
