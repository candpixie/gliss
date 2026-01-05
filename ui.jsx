import React, { useState } from 'react';

// ============================================
// NEON RV443 - Real-Time Audio Visualizer UI
// ============================================
// Theme: Cyber Neon Purple | Aurora Haze | Holographic
// Frames: Landing, Performance, Settings, Mobile

const NeonRV443Design = () => {
  const [activeFrame, setActiveFrame] = useState('landing');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [preset, setPreset] = useState('Neon Spectrum');
  const [isLive, setIsLive] = useState(true);
  const [controls, setControls] = useState({
    sensitivity: 65,
    smoothing: 40,
    bloom: 75,
    trailLength: 50,
    particleDensity: 60,
    onsetRings: true,
    pitchToColor: true,
  });

  // ============================================
  // SHARED COMPONENTS
  // ============================================

  const GlassPanel = ({ children, className = '', glow = false }) => (
    <div className={`
      relative rounded-2xl p-6
      bg-gradient-to-br from-white/[0.08] to-white/[0.02]
      backdrop-blur-xl
      border border-white/10
      ${glow ? 'shadow-[0_0_40px_rgba(168,85,247,0.15)]' : 'shadow-2xl'}
      ${className}
    `}>
      {children}
    </div>
  );

  const NeonButton = ({ children, variant = 'primary', onClick, className = '' }) => {
    const baseStyles = `
      relative px-6 py-3 rounded-xl font-semibold text-sm tracking-wide
      transition-all duration-300 ease-out
      ${className}
    `;
    
    if (variant === 'primary') {
      return (
        <button onClick={onClick} className={`${baseStyles}
          bg-gradient-to-r from-violet-600 to-fuchsia-600
          text-white
          shadow-[0_0_20px_rgba(168,85,247,0.4),0_0_40px_rgba(168,85,247,0.2)]
          hover:shadow-[0_0_30px_rgba(168,85,247,0.6),0_0_60px_rgba(168,85,247,0.3)]
          hover:scale-[1.02]
          active:scale-[0.98]
        `}>{children}</button>
      );
    }
    
    return (
      <button onClick={onClick} className={`${baseStyles}
        bg-transparent
        text-violet-300
        border border-violet-500/40
        hover:bg-violet-500/10
        hover:border-violet-400/60
        hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]
      `}>{children}</button>
    );
  };

  const StatusPill = ({ status }) => (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider
      ${status === 'LIVE' 
        ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
        : 'bg-amber-500/20 text-amber-400'}
    `}>
      {status === 'LIVE' && (
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      )}
      {status}
    </div>
  );

  const Slider = ({ label, value, onChange, min = 0, max = 100 }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-violet-300/70 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-violet-200 font-mono">{value}%</span>
      </div>
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
          style={{ width: `${value}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"
          style={{ left: `calc(${value}% - 6px)` }}
        />
      </div>
    </div>
  );

  const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-violet-200/80">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-all duration-300
          ${checked 
            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
            : 'bg-white/10'}
        `}
      >
        <div className={`
          absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300
          ${checked ? 'left-6' : 'left-1'}
        `} />
      </button>
    </div>
  );

  const Logo = ({ size = 'md' }) => (
    <div className={`flex items-center gap-2 ${size === 'sm' ? 'text-lg' : 'text-xl'}`}>
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-lg bg-violet-500/50 blur-lg -z-10" />
      </div>
      <span className="font-black tracking-tight text-white">
        NEON <span className="text-violet-400">RV443</span>
      </span>
    </div>
  );

  // ============================================
  // FRAME NAVIGATION
  // ============================================

  const FrameSelector = () => (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-1 p-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
        {[
          { id: 'landing', label: 'Landing' },
          { id: 'performance', label: 'Performance' },
          { id: 'settings', label: 'Settings' },
          { id: 'mobile', label: 'Mobile' },
        ].map(frame => (
          <button
            key={frame.id}
            onClick={() => setActiveFrame(frame.id)}
            className={`
              px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300
              ${activeFrame === frame.id 
                ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                : 'text-violet-300/70 hover:text-white'}
            `}
          >
            {frame.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ============================================
  // FRAME 1: LANDING / PERMISSION
  // ============================================

  const LandingFrame = () => (
    <div className="relative w-[1440px] h-[900px] bg-[#0a0a0f] overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <GlassPanel className="w-[480px] text-center" glow>
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-violet-500/40 blur-2xl -z-10" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-white">
                NEON <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">RV443</span>
              </h1>
              <p className="text-violet-300/70 text-lg">
                Turn your playing into live neon visuals.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <NeonButton 
                variant="primary" 
                onClick={() => setShowPermissionModal(true)}
                className="w-full"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start with Microphone
                </span>
              </NeonButton>
              <NeonButton variant="secondary" className="w-full">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Audio File
                </span>
              </NeonButton>
            </div>

            {/* Privacy note */}
            <div className="flex items-center justify-center gap-2 text-xs text-violet-400/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              We only process audio locally.
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-violet-400/30 tracking-wider">
        v0.1 • Built for live performance
      </div>

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassPanel className="w-[400px] text-center" glow>
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Microphone Access Required</h3>
                <p className="text-sm text-violet-300/60">
                  NEON RV443 needs microphone access to visualize your audio in real-time.
                </p>
              </div>
              <div className="flex gap-3">
                <NeonButton 
                  variant="secondary" 
                  onClick={() => setShowPermissionModal(false)}
                  className="flex-1"
                >
                  Cancel
                </NeonButton>
                <NeonButton 
                  variant="primary"
                  onClick={() => {
                    setShowPermissionModal(false);
                    setActiveFrame('performance');
                  }}
                  className="flex-1"
                >
                  Allow
                </NeonButton>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );

  // ============================================
  // FRAME 2: PERFORMANCE CANVAS
  // ============================================

  const PerformanceFrame = () => (
    <div className="relative w-[1440px] h-[900px] bg-[#0a0a0f] overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 z-20 px-6 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5">
        <Logo />
        
        {/* Preset Dropdown */}
        <div className="relative">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="appearance-none px-4 py-2 pr-10 rounded-lg bg-white/5 border border-violet-500/30 text-violet-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
          >
            <option>Neon Spectrum</option>
            <option>Aurora Ribbons</option>
            <option>Cyber Rosette</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-violet-400/60">Device:</span>
            <select className="appearance-none px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-violet-200 text-sm focus:outline-none cursor-pointer">
              <option>MacBook Pro Mic</option>
              <option>External USB</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="text-xs text-emerald-400 font-medium">Low Latency</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="absolute top-16 left-0 right-[320px] bottom-16">
        {/* Visualizer Placeholder */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Aurora Background */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/3 w-[600px] h-[400px] bg-violet-600/30 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/15 rounded-full blur-[80px]" />
          </div>

          {/* Visualizer Bars (Placeholder) */}
          <div className="relative z-10 flex items-end gap-1 h-[300px]">
            {Array.from({ length: 48 }).map((_, i) => {
              const height = Math.sin(i * 0.3) * 50 + Math.random() * 100 + 50;
              return (
                <div
                  key={i}
                  className="w-3 rounded-t-sm bg-gradient-to-t from-violet-600 via-fuchsia-500 to-pink-400"
                  style={{ 
                    height: `${height}px`,
                    boxShadow: '0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.3)',
                    animation: `pulse ${1 + Math.random()}s ease-in-out infinite`
                  }}
                />
              );
            })}
          </div>

          {/* Canvas Mini HUD */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-xs text-violet-200">Mic</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-violet-400/60">BPM</span>
                <span className="text-xs text-violet-200 font-mono">—</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <StatusPill status={isLive ? 'LIVE' : 'PAUSED'} />
            </div>
          </div>
        </div>
      </div>

      {/* Right Control Panel */}
      <div className="absolute top-16 right-0 bottom-16 w-[320px] p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Controls Section */}
          <GlassPanel className="!p-4">
            <h3 className="text-xs font-bold text-violet-400/80 uppercase tracking-wider mb-4">Controls</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button className="flex-1 py-2 px-3 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-200 text-sm font-medium">Mic</button>
                <button className="flex-1 py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-violet-300/50 text-sm">File</button>
              </div>
              <NeonButton 
                variant="primary" 
                className="w-full"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? 'Stop' : 'Start'}
              </NeonButton>
              <Slider 
                label="Sensitivity" 
                value={controls.sensitivity} 
                onChange={(v) => setControls({...controls, sensitivity: v})}
              />
              <Slider 
                label="Smoothing" 
                value={controls.smoothing} 
                onChange={(v) => setControls({...controls, smoothing: v})}
              />
            </div>
          </GlassPanel>

          {/* Visual Mapping Section */}
          <GlassPanel className="!p-4">
            <h3 className="text-xs font-bold text-violet-400/80 uppercase tracking-wider mb-4">Visual Mapping</h3>
            <div className="space-y-4">
              <Slider 
                label="Bloom" 
                value={controls.bloom} 
                onChange={(v) => setControls({...controls, bloom: v})}
              />
              <Slider 
                label="Trail Length" 
                value={controls.trailLength} 
                onChange={(v) => setControls({...controls, trailLength: v})}
              />
              <Slider 
                label="Particle Density" 
                value={controls.particleDensity} 
                onChange={(v) => setControls({...controls, particleDensity: v})}
              />
              <div className="h-px bg-white/5" />
              <Toggle 
                label="Onset Rings" 
                checked={controls.onsetRings}
                onChange={(v) => setControls({...controls, onsetRings: v})}
              />
              <Toggle 
                label="Pitch to Color" 
                checked={controls.pitchToColor}
                onChange={(v) => setControls({...controls, pitchToColor: v})}
              />
            </div>
          </GlassPanel>

          {/* Quick Actions */}
          <GlassPanel className="!p-4">
            <h3 className="text-xs font-bold text-violet-400/80 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="flex gap-2">
              <NeonButton variant="secondary" className="flex-1 !py-2 !text-xs">
                Save Preset
              </NeonButton>
              <NeonButton variant="secondary" className="flex-1 !py-2 !text-xs">
                Reset
              </NeonButton>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Bottom Transport Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-20 px-6 flex items-center justify-center gap-6 bg-black/40 backdrop-blur-xl border-t border-white/5">
        <button className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center hover:bg-red-500/30 transition-colors">
          <div className="w-4 h-4 bg-red-500 rounded-full" />
        </button>
        <NeonButton variant="secondary" className="!py-2">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export WebM
          </span>
        </NeonButton>
        <div className="text-lg font-mono text-violet-300/60 tracking-wider">00:00</div>
      </div>
    </div>
  );

  // ============================================
  // FRAME 3: SETTINGS / CALIBRATION
  // ============================================

  const SettingsFrame = () => {
    const [activeNav, setActiveNav] = useState('settings');
    
    return (
      <div className="relative w-[1440px] h-[900px] bg-[#0a0a0f] overflow-hidden flex">
        {/* Left Sidebar */}
        <div className="w-[280px] h-full p-4 border-r border-white/5">
          <div className="mb-8">
            <Logo />
          </div>
          <nav className="space-y-1">
            {[
              { id: 'performance', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z', label: 'Performance' },
              { id: 'presets', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Presets' },
              { id: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Settings' },
              { id: 'about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'About' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeNav === item.id 
                    ? 'bg-violet-500/20 text-violet-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                    : 'text-violet-300/50 hover:text-violet-200 hover:bg-white/5'}
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>
          
          <div className="grid grid-cols-2 gap-6 max-w-[1000px]">
            {/* Audio Settings */}
            <GlassPanel className="!p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828 2.828" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Audio</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Sample Rate</label>
                  <select className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option>44100 Hz</option>
                    <option>48000 Hz</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">FFT Size</label>
                  <select className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option>1024</option>
                    <option>2048</option>
                    <option>4096</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Input Device</label>
                  <select className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option>MacBook Pro Microphone</option>
                    <option>External USB Mic</option>
                  </select>
                </div>
              </div>
            </GlassPanel>

            {/* Visual Settings */}
            <GlassPanel className="!p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Visual</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Resolution Scale</label>
                  <select className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option>100% (Native)</option>
                    <option>75%</option>
                    <option>50%</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">FPS Target</label>
                  <select className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option>60 FPS</option>
                    <option>30 FPS</option>
                    <option>Unlimited</option>
                  </select>
                </div>
              </div>
            </GlassPanel>

            {/* Export Settings */}
            <GlassPanel className="!p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Export</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Quality</label>
                  <select className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option>High (1080p)</option>
                    <option>Medium (720p)</option>
                    <option>Low (480p)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Format</label>
                  <select className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option>WebM (VP9)</option>
                    <option>MP4 (H.264)</option>
                    <option>GIF</option>
                  </select>
                </div>
              </div>
            </GlassPanel>

            {/* Calibration Wizard */}
            <GlassPanel className="!p-5" glow>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Calibration</h3>
              </div>
              <p className="text-sm text-violet-300/60 mb-4">
                Play a long, steady note to calibrate input levels.
              </p>
              {/* Live Meter */}
              <div className="space-y-3">
                <div className="h-8 rounded-lg bg-white/5 overflow-hidden relative">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg transition-all duration-100"
                    style={{ width: '45%' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white/60 font-mono">
                    -12 dB
                  </div>
                </div>
                <NeonButton variant="primary" className="w-full">
                  Start Calibration
                </NeonButton>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // FRAME 4: MOBILE VIEWER MODE
  // ============================================

  const MobileFrame = () => (
    <div className="relative w-[390px] h-[844px] bg-[#0a0a0f] overflow-hidden rounded-[40px] border-4 border-gray-800">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-2xl z-50" />
      
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-12 z-40 flex items-end justify-between px-8 pb-1 text-xs text-white/60">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>100%</span>
        </div>
      </div>

      {/* Full Screen Canvas */}
      <div className="absolute inset-0 pt-12">
        {/* Aurora Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-violet-600/40 rounded-full blur-[80px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-fuchsia-600/30 rounded-full blur-[60px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-[50px]" />
        </div>

        {/* Circular Visualizer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[280px] h-[280px]">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 blur-xl animate-pulse" />
            
            {/* Circular bars */}
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 32 }).map((_, i) => {
                const angle = (i / 32) * 360;
                const height = 30 + Math.random() * 50;
                return (
                  <div
                    key={i}
                    className="absolute w-1.5 origin-bottom rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400"
                    style={{
                      height: `${height}px`,
                      transform: `rotate(${angle}deg) translateY(-100px)`,
                      boxShadow: '0 0 10px rgba(168,85,247,0.6)',
                    }}
                  />
                );
              })}
            </div>

            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Status Pill - Top */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <StatusPill status="LIVE" />
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-10">
          <GlassPanel className="!p-4 space-y-4">
            {/* Preset Picker */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
              {['Neon Spectrum', 'Aurora Ribbons', 'Cyber Rosette'].map((p, i) => (
                <button
                  key={p}
                  className={`
                    whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all
                    ${i === 0 
                      ? 'bg-violet-500/30 text-violet-200 border border-violet-500/40' 
                      : 'bg-white/5 text-violet-300/50 border border-white/10'}
                  `}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Start/Stop Button */}
            <NeonButton variant="primary" className="w-full !py-4">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Stop
              </span>
            </NeonButton>

            {/* Bloom Slider */}
            <Slider 
              label="Bloom" 
              value={controls.bloom} 
              onChange={(v) => setControls({...controls, bloom: v})}
            />
          </GlassPanel>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#050508] p-8 pt-20 flex items-center justify-center">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.1); }
        }
      `}</style>
      
      <FrameSelector />
      
      <div className="relative">
        {/* Frame Container with shadow */}
        <div className="rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.15)]">
          {activeFrame === 'landing' && <LandingFrame />}
          {activeFrame === 'performance' && <PerformanceFrame />}
          {activeFrame === 'settings' && <SettingsFrame />}
          {activeFrame === 'mobile' && <MobileFrame />}
        </div>
        
        {/* Frame Label */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm text-violet-400/50 font-mono">
          {activeFrame === 'landing' && 'Frame 1: Landing / Permission — 1440×900'}
          {activeFrame === 'performance' && 'Frame 2: Performance Canvas — 1440×900'}
          {activeFrame === 'settings' && 'Frame 3: Settings / Calibration — 1440×900'}
          {activeFrame === 'mobile' && 'Frame 4: Mobile Viewer — 390×844'}
        </div>
      </div>
    </div>
  );
};

export default NeonRV443Design;
