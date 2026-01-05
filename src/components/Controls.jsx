import { useState } from 'react'

const Controls = ({ controls, onUpdate, onStop, inputMode }) => {
  const [isLive, setIsLive] = useState(true)

  const handleToggleLive = () => {
    setIsLive(!isLive)
  }

  const Slider = ({ label, value, onChange, min = 0, max = 100, unit = '%' }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-violet-300/70 uppercase tracking-wider font-medium">{label}</span>
        <span className="text-xs text-violet-200 font-mono tabular-nums">{Math.round(value * 100)}{unit}</span>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-visible group">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-100"
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
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full
            shadow-[0_0_12px_rgba(168,85,247,0.8)]
            group-hover:shadow-[0_0_16px_rgba(168,85,247,1)]
            transition-shadow duration-200 pointer-events-none z-10"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 8px)` }}
        />
      </div>
    </div>
  )

  const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-violet-200/80">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className={`
          relative w-12 h-6 rounded-full transition-all duration-300 ease-out
          ${checked
            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
            : 'bg-white/10 hover:bg-white/15'}
        `}
      >
        <div className={`
          absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ease-out
          shadow-[0_1px_3px_rgba(0,0,0,0.3)]
          ${checked ? 'left-7' : 'left-1'}
        `} />
      </button>
    </div>
  )

  const SectionHeader = ({ children }) => (
    <h3 className="text-xs font-bold text-violet-400/80 uppercase tracking-wider mb-4">
      {children}
    </h3>
  )

  const GlassPanel = ({ children, className = '', padding = 'sm' }) => {
    const paddingMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' }
    return (
      <div className={`
        relative rounded-2xl ${paddingMap[padding]}
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        backdrop-blur-xl border border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        ${className}
      `}>
        {children}
      </div>
    )
  }

  return (
    <div className="h-full p-4 overflow-y-auto border-l border-white/5 bg-black/30 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Controls Section */}
        <GlassPanel>
          <SectionHeader>Controls</SectionHeader>
          <div className="space-y-4">
            <button
              onClick={handleToggleLive}
              className="w-full px-6 py-3 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-600 text-white
                shadow-[0_0_20px_rgba(168,85,247,0.4)]
                hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                transition-all duration-300"
            >
              {isLive ? 'Stop' : 'Start'}
            </button>

            <button
              onClick={onStop}
              className="w-full px-6 py-3 rounded-xl font-semibold text-sm
                bg-transparent text-violet-300 border border-violet-500/40
                hover:bg-violet-500/10 transition-all duration-200"
            >
              Disconnect
            </button>

            <Slider
              label="Sensitivity"
              value={controls.sensitivity}
              onChange={(v) => onUpdate('sensitivity', v)}
              min={0}
              max={1}
            />
            <Slider
              label="Smoothing"
              value={controls.smoothing}
              onChange={(v) => onUpdate('smoothing', v)}
              min={0}
              max={1}
            />
          </div>
        </GlassPanel>

        {/* Visual Mapping Section */}
        <GlassPanel>
          <SectionHeader>Visual Mapping</SectionHeader>
          <div className="space-y-4">
            <Slider
              label="Bloom"
              value={controls.bloom}
              onChange={(v) => onUpdate('bloom', v)}
              min={0}
              max={1}
            />
            <Slider
              label="Trail Length"
              value={controls.trailLength}
              onChange={(v) => onUpdate('trailLength', v)}
              min={0}
              max={1}
            />
            <Slider
              label="Particle Density"
              value={controls.particleDensity}
              onChange={(v) => onUpdate('particleDensity', v)}
              min={0}
              max={1}
            />

            <div className="h-px bg-white/5 my-2" />

            <Toggle
              label="Onset Rings"
              checked={controls.onsetRings}
              onChange={(v) => onUpdate('onsetRings', v)}
            />
            <Toggle
              label="Pitch to Color"
              checked={controls.pitchToColor}
              onChange={(v) => onUpdate('pitchToColor', v)}
            />
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

export default Controls

