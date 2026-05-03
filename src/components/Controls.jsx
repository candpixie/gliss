import { useState } from 'react'

const Controls = ({ controls, onUpdate, onStop }) => {
  const [isLive, setIsLive] = useState(true)

  const handleToggleLive = () => {
    setIsLive(!isLive)
  }

  const Slider = ({ label, value, onChange, min = 0, max = 1, unit = '%' }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">{label}</span>
        <span className="text-xs text-text-primary font-mono tabular-nums">
          {Math.round(value * 100)}{unit}
        </span>
      </div>
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-visible group">
        <div
          className="absolute inset-y-0 left-0 bg-accent-glacier/70 rounded-full transition-all duration-100"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={0.01}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-text-primary rounded-full
            ring-1 ring-accent-glacier/50
            group-hover:ring-2 group-hover:ring-accent-glacier/70
            transition-all duration-200 pointer-events-none z-10"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 7px)` }}
        />
      </div>
    </div>
  )

  const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-text-primary/85">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className={`
          relative w-11 h-6 rounded-full transition-all duration-300 ease-out
          ${checked
            ? 'bg-accent-glacier/60'
            : 'bg-white/10 hover:bg-white/15'}
        `}
      >
        <div className={`
          absolute top-1 w-4 h-4 bg-text-primary rounded-full transition-all duration-300 ease-out
          shadow-[0_1px_3px_rgba(0,0,0,0.3)]
          ${checked ? 'left-6' : 'left-1'}
        `} />
      </button>
    </div>
  )

  const SectionHeader = ({ children }) => (
    <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.14em] mb-4">
      {children}
    </h3>
  )

  const GlassPanel = ({ children, className = '', padding = 'sm' }) => {
    const paddingMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' }
    return (
      <div className={`
        relative rounded-2xl ${paddingMap[padding]}
        bg-gradient-to-br from-white/[0.05] to-white/[0.015]
        backdrop-blur-xl border border-white/[0.07]
        shadow-frost
        ${className}
      `}>
        {children}
      </div>
    )
  }

  return (
    <div className="h-full p-4 overflow-y-auto border-l border-white/[0.06] bg-black/30 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Controls Section */}
        <GlassPanel>
          <SectionHeader>Session</SectionHeader>
          <div className="space-y-4">
            <button
              onClick={handleToggleLive}
              className="w-full px-6 py-3 rounded-xl font-medium text-sm
                bg-accent-glacier/15 text-text-primary
                border border-accent-glacier/40
                hover:bg-accent-glacier/25 hover:border-accent-glacier/60
                transition-all duration-200"
            >
              {isLive ? 'Pause' : 'Resume'}
            </button>

            <button
              onClick={onStop}
              className="w-full px-6 py-3 rounded-xl font-medium text-sm
                bg-transparent text-text-muted border border-white/10
                hover:bg-bg-surfaceHover hover:text-text-primary transition-all duration-200"
            >
              Disconnect
            </button>

            <Slider
              label="Sensitivity"
              value={controls.sensitivity}
              onChange={(v) => onUpdate('sensitivity', v)}
            />
            <Slider
              label="Smoothing"
              value={controls.smoothing}
              onChange={(v) => onUpdate('smoothing', v)}
            />
          </div>
        </GlassPanel>

        {/* Visual Mapping Section */}
        <GlassPanel>
          <SectionHeader>Visual</SectionHeader>
          <div className="space-y-4">
            <Slider
              label="Bloom"
              value={controls.bloom}
              onChange={(v) => onUpdate('bloom', v)}
            />
            <Slider
              label="Trail Length"
              value={controls.trailLength}
              onChange={(v) => onUpdate('trailLength', v)}
            />
            <Slider
              label="Particle Density"
              value={controls.particleDensity}
              onChange={(v) => onUpdate('particleDensity', v)}
            />

            <div className="h-px bg-white/[0.06] my-2" />

            <Toggle
              label="Onset rings"
              checked={controls.onsetRings}
              onChange={(v) => onUpdate('onsetRings', v)}
            />
          </div>
        </GlassPanel>

        {/* Music-aware Section */}
        <GlassPanel>
          <SectionHeader>Music-aware</SectionHeader>
          <div className="space-y-3">
            <Toggle
              label="Vibrato response"
              checked={controls.vibratoResponse}
              onChange={(v) => onUpdate('vibratoResponse', v)}
            />
            <p className="text-[11px] text-text-dim leading-relaxed pt-1">
              Lets shimmer, ribbon waver, and standing-wave interference react to detected vibrato.
            </p>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

export default Controls
