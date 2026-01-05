import React, { useState, useCallback } from 'react';

// ============================================================================
// NEON RV443 — Real-Time Audio Visualizer UI Design System
// ============================================================================
// Theme: Cyber Neon Purple | Aurora Haze | Holographic | Glassmorphism
// Style Keywords: neon purple, aurora haze, holographic, minimal pro, music-tech
// Grid: 8px base unit
// Typography: Clean sans-serif (Inter-like), high contrast, minimal text
//
// FRAMES:
//   1. Landing / Permission (1440×900)
//   2. Performance Canvas (1440×900)
//   3. Settings / Calibration (1440×900)
//   4. Mobile Viewer Mode (390×844)
//
// INTERACTIONS (Prototype Notes):
//   - Landing: Click "Start with Microphone" → Permission Modal → Performance
//   - Preset dropdown → Canvas theme updates instantly
//   - Record → Timer starts → Export → Toast "Saved"
//   - All sliders have real-time visual feedback
//   - Hover states on all interactive elements
// ============================================================================

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const tokens = {
  colors: {
    // Base
    background: '#0a0a0f',
    backgroundDeep: '#050508',
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceHover: 'rgba(255, 255, 255, 0.06)',

    // Neon Purple Palette
    violet: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    fuchsia: {
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
    },

    // Status Colors
    live: '#10b981',
    paused: '#f59e0b',
    record: '#ef4444',

    // Glow effects
    glowPrimary: 'rgba(168, 85, 247, 0.4)',
    glowSecondary: 'rgba(217, 70, 239, 0.3)',
    glowBloom: 'rgba(168, 85, 247, 0.15)',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },

  shadows: {
    glow: '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)',
    glowIntense: '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.3)',
    glowSubtle: '0 0 40px rgba(168, 85, 247, 0.15)',
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const NeonRV443Design = () => {
  // App State
  const [activeFrame, setActiveFrame] = useState('landing');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [preset, setPreset] = useState('Neon Spectrum');
  const [isLive, setIsLive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [inputMode, setInputMode] = useState('mic'); // 'mic' | 'file'

  // Control Panel State
  const [controls, setControls] = useState({
    sensitivity: 65,
    smoothing: 40,
    bloom: 75,
    trailLength: 50,
    particleDensity: 60,
    onsetRings: true,
    pitchToColor: true,
  });

  // Handlers
  const handleStartWithMic = useCallback(() => {
    setShowPermissionModal(true);
  }, []);

  const handlePermissionAllow = useCallback(() => {
    setShowPermissionModal(false);
    setActiveFrame('performance');
  }, []);

  const handleExport = useCallback(() => {
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  }, []);

  const updateControl = useCallback((key, value) => {
    setControls(prev => ({ ...prev, [key]: value }));
  }, []);

  // ============================================================================
  // REUSABLE COMPONENTS
  // ============================================================================

  /**
   * GlassPanel — Glassmorphism container with blur and subtle glow
   * @param {boolean} glow - Enable neon glow border effect
   * @param {string} padding - Padding size (sm, md, lg)
   */
  const GlassPanel = ({ children, className = '', glow = false, padding = 'md' }) => {
    const paddingMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' };
    return (
      <div className={`
        relative rounded-2xl ${paddingMap[padding]}
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        backdrop-blur-xl
        border border-white/10
        ${glow
          ? 'shadow-[0_0_40px_rgba(168,85,247,0.15),inset_0_0_0_1px_rgba(168,85,247,0.1)]'
          : 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'}
        ${className}
      `}>
        {/* Subtle inner highlight */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </div>
    );
  };

  /**
   * NeonButton — Primary/Secondary button with glow effects
   * INTERACTION: Hover → glow intensifies, scale 1.02; Active → scale 0.98
   */
  const NeonButton = ({
    children,
    variant = 'primary',
    onClick,
    className = '',
    size = 'md',
    disabled = false
  }) => {
    const sizeMap = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    const baseStyles = `
      relative ${sizeMap[size]} rounded-xl font-semibold tracking-wide
      transition-all duration-300 ease-out
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `;

    if (variant === 'primary') {
      return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyles}
          bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-600
          text-white
          shadow-[0_0_20px_rgba(168,85,247,0.4),0_0_40px_rgba(168,85,247,0.2)]
          hover:shadow-[0_0_30px_rgba(168,85,247,0.6),0_0_60px_rgba(168,85,247,0.3)]
          hover:scale-[1.02] hover:brightness-110
          active:scale-[0.98]
          before:absolute before:inset-0 before:rounded-xl before:bg-white/20 before:opacity-0
          hover:before:opacity-100 before:transition-opacity
        `}>{children}</button>
      );
    }

    return (
      <button onClick={onClick} disabled={disabled} className={`${baseStyles}
        bg-transparent
        text-violet-300
        border border-violet-500/40
        hover:bg-violet-500/10
        hover:border-violet-400/60
        hover:text-violet-200
        hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]
        active:scale-[0.98]
      `}>{children}</button>
    );
  };

  /**
   * StatusPill — Live/Paused indicator with animated pulse
   */
  const StatusPill = ({ status }) => {
    const isLive = status === 'LIVE';
    return (
      <div className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase
        ${isLive
          ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          : 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'}
      `}>
        {isLive && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        )}
        {!isLive && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
        {status}
      </div>
    );
  };

  /**
   * Slider — Custom slider with glowing thumb and gradient track
   * INTERACTION: Drag thumb → real-time value update, thumb glows on focus
   */
  const Slider = ({ label, value, onChange, min = 0, max = 100, unit = '%' }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-violet-300/70 uppercase tracking-wider font-medium">{label}</span>
        <span className="text-xs text-violet-200 font-mono tabular-nums">{value}{unit}</span>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-visible group">
        {/* Track fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-100"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        {/* Invisible range input for accessibility */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        {/* Custom thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full
            shadow-[0_0_12px_rgba(168,85,247,0.8),0_2px_4px_rgba(0,0,0,0.3)]
            group-hover:shadow-[0_0_16px_rgba(168,85,247,1),0_2px_8px_rgba(0,0,0,0.4)]
            transition-shadow duration-200 pointer-events-none z-10"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 8px)` }}
        />
      </div>
    </div>
  );

  /**
   * Toggle — Switch with gradient fill when active
   * INTERACTION: Click → toggle state, smooth animation
   */
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
  );

  /**
   * Dropdown — Custom select with neon focus ring
   * INTERACTION: Focus → neon ring appears; Open → dropdown with options
   */
  const Dropdown = ({ value, onChange, options, className = '' }) => (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl
          bg-white/5 border border-violet-500/30
          text-violet-200 text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400/50
          hover:bg-white/8 hover:border-violet-400/40
          cursor-pointer transition-all duration-200"
      >
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt} className="bg-[#1a1a24]">
            {opt.label || opt}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  /**
   * SectionHeader — Section title for control panels
   */
  const SectionHeader = ({ children }) => (
    <h3 className="text-xs font-bold text-violet-400/80 uppercase tracking-wider mb-4">
      {children}
    </h3>
  );

  /**
   * Logo — NEON RV443 brand mark
   */
  const Logo = ({ size = 'md' }) => {
    const sizes = {
      sm: { icon: 'w-6 h-6', text: 'text-lg', logoSize: 'w-7 h-7' },
      md: { icon: 'w-5 h-5', text: 'text-xl', logoSize: 'w-8 h-8' },
      lg: { icon: 'w-7 h-7', text: 'text-2xl', logoSize: 'w-10 h-10' },
    };
    const s = sizes[size];

    return (
      <div className={`flex items-center gap-3 ${s.text}`}>
        <div className="relative">
          <div className={`${s.logoSize} rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center`}>
            <svg className={`${s.icon} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-lg bg-violet-500/50 blur-lg -z-10" />
        </div>
        <span className="font-black tracking-tight text-white">
          NEON <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">RV443</span>
        </span>
      </div>
    );
  };

  /**
   * Toast — Notification popup
   */
  const Toast = ({ message, visible }) => (
    <div className={`
      fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]
      px-6 py-3 rounded-xl
      bg-emerald-500/20 border border-emerald-500/40
      text-emerald-300 text-sm font-medium
      shadow-[0_0_20px_rgba(16,185,129,0.3)]
      transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
    `}>
      <span className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {message}
      </span>
    </div>
  );

  // ============================================================================
  // FRAME NAVIGATION
  // ============================================================================

  const FrameSelector = () => (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-1 p-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10">
        {[
          { id: 'landing', label: 'Landing', dim: '1440×900' },
          { id: 'performance', label: 'Performance', dim: '1440×900' },
          { id: 'settings', label: 'Settings', dim: '1440×900' },
          { id: 'mobile', label: 'Mobile', dim: '390×844' },
        ].map(frame => (
          <button
            key={frame.id}
            onClick={() => setActiveFrame(frame.id)}
            className={`
              px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300
              ${activeFrame === frame.id
                ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : 'text-violet-300/70 hover:text-white hover:bg-white/5'}
            `}
          >
            {frame.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // FRAME 1: LANDING / PERMISSION (1440×900)
  // ============================================================================
  // INTERACTION FLOW:
  //   1. User clicks "Start with Microphone"
  //   2. Permission modal appears
  //   3. User clicks "Allow" → Navigates to Performance frame
  //   4. User clicks "Cancel" → Modal closes, stays on Landing
  //   5. "Upload Audio File" → Opens file picker (placeholder)
  // ============================================================================

  const LandingFrame = () => (
    <div className="relative w-[1440px] h-[900px] bg-[#0a0a0f] overflow-hidden">
      {/* === AURORA BACKGROUND === */}
      <div className="absolute inset-0">
        {/* Primary aurora blobs */}
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-[150px] animate-pulse"
          style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-5%] right-[15%] w-[700px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[130px]" />
        <div className="absolute top-[30%] right-[25%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-[80px]" />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168,85,247,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168,85,247,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px'
          }}
        />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* === MAIN CONTENT === */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <GlassPanel className="w-[480px] text-center" glow padding="lg">
          <div className="space-y-8">
            {/* Logo Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center
                  shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-40 blur-2xl -z-10 animate-pulse"
                  style={{ animationDuration: '3s' }} />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-white">
                NEON <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">RV443</span>
              </h1>
              <p className="text-violet-300/70 text-lg font-light">
                Turn your playing into live neon visuals.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <NeonButton
                variant="primary"
                onClick={handleStartWithMic}
                className="w-full"
                size="lg"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start with Microphone
                </span>
              </NeonButton>

              <NeonButton variant="secondary" className="w-full" size="lg">
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Audio File
                </span>
              </NeonButton>
            </div>

            {/* Privacy Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-violet-400/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              We only process audio locally.
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* === FOOTER === */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-violet-400/30 tracking-wider font-mono">
        v0.1 • Built for live performance
      </div>

      {/* === PERMISSION MODAL === */}
      {showPermissionModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPermissionModal(false)}
          />

          {/* Modal */}
          <GlassPanel className="relative w-[420px] text-center" glow padding="lg">
            <div className="space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/20 flex items-center justify-center
                shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>

              {/* Text */}
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Microphone Access Required</h3>
                <p className="text-sm text-violet-300/60 leading-relaxed">
                  NEON RV443 needs microphone access to visualize your audio in real-time.
                  Your audio is never recorded or sent anywhere.
                </p>
              </div>

              {/* Buttons */}
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
                  onClick={handlePermissionAllow}
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

  // ============================================================================
  // FRAME 2: PERFORMANCE CANVAS (1440×900)
  // ============================================================================
  // LAYOUT: Top bar + Main canvas (with mini HUD) + Right control panel + Bottom transport
  // INTERACTION FLOW:
  //   1. Preset dropdown → Canvas updates visual style
  //   2. Start/Stop → Toggle LIVE/PAUSED state
  //   3. Sliders → Real-time visual parameter changes
  //   4. Record button → Timer starts, "Recording" state
  //   5. Export WebM → Toast notification "Saved"
  // ============================================================================

  const PerformanceFrame = () => (
    <div className="relative w-[1440px] h-[900px] bg-[#0a0a0f] overflow-hidden">
      {/* === TOP BAR (Sticky) === */}
      <div className="absolute top-0 left-0 right-0 h-16 z-30 px-6
        flex items-center justify-between
        bg-black/50 backdrop-blur-xl border-b border-white/5">

        {/* Left: Logo */}
        <Logo size="md" />

        {/* Center: Preset Dropdown */}
        <Dropdown
          value={preset}
          onChange={setPreset}
          options={['Neon Spectrum', 'Aurora Ribbons', 'Cyber Rosette']}
          className="w-48"
        />

        {/* Right: Device & Latency */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-violet-400/60 uppercase tracking-wider">Device</span>
            <Dropdown
              value="MacBook Pro Mic"
              onChange={() => {}}
              options={['MacBook Pro Mic', 'External USB', 'Audio Interface']}
              className="w-44"
            />
          </div>

          {/* Latency Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Low Latency</span>
          </div>
        </div>
      </div>

      {/* === MAIN CANVAS AREA === */}
      <div className="absolute top-16 left-0 right-[320px] bottom-16">
        <div className="relative w-full h-full overflow-hidden">
          {/* Aurora Background */}
          <div className="absolute inset-0">
            <div className="absolute top-[15%] left-[25%] w-[600px] h-[400px] bg-violet-600/30 rounded-full blur-[100px] animate-pulse"
              style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[450px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse"
              style={{ animationDuration: '4s', animationDelay: '1s' }} />
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[350px] h-[350px] bg-blue-500/15 rounded-full blur-[90px]" />
          </div>

          {/* Visualizer Bars (Placeholder) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-end gap-1 h-[320px]">
              {Array.from({ length: 56 }).map((_, i) => {
                const height = Math.sin(i * 0.25) * 60 + Math.random() * 120 + 40;
                const hue = (i / 56) * 60 + 270; // Purple to pink gradient
                return (
                  <div
                    key={i}
                    className="w-3 rounded-t-sm transition-all duration-75"
                    style={{
                      height: `${height}px`,
                      background: `linear-gradient(to top,
                        hsl(${hue}, 80%, 50%),
                        hsl(${hue + 20}, 90%, 60%),
                        hsl(${hue + 40}, 100%, 70%))`,
                      boxShadow: `0 0 15px hsla(${hue}, 80%, 50%, 0.5),
                                  0 0 30px hsla(${hue}, 80%, 50%, 0.3)`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Canvas Mini HUD (Bottom-Left) */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10">
              {/* Input Type */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-xs text-violet-200 font-medium">
                  {inputMode === 'mic' ? 'Mic' : 'File'}
                </span>
              </div>

              <div className="w-px h-4 bg-white/10" />

              {/* BPM */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-violet-400/60">BPM</span>
                <span className="text-xs text-violet-200 font-mono">—</span>
              </div>

              <div className="w-px h-4 bg-white/10" />

              {/* Status */}
              <StatusPill status={isLive ? 'LIVE' : 'PAUSED'} />
            </div>
          </div>
        </div>
      </div>

      {/* === RIGHT CONTROL PANEL === */}
      <div className="absolute top-16 right-0 bottom-16 w-[320px] p-4 overflow-y-auto
        border-l border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="space-y-4">

          {/* Controls Section */}
          <GlassPanel padding="sm">
            <SectionHeader>Controls</SectionHeader>
            <div className="space-y-4">
              {/* Input Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('mic')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${inputMode === 'mic'
                      ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-white/5 border border-white/10 text-violet-300/50 hover:bg-white/8'}`}
                >
                  Mic
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${inputMode === 'file'
                      ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-white/5 border border-white/10 text-violet-300/50 hover:bg-white/8'}`}
                >
                  File
                </button>
              </div>

              {/* Start/Stop */}
              <NeonButton
                variant="primary"
                className="w-full"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? 'Stop' : 'Start'}
              </NeonButton>

              {/* Sliders */}
              <Slider
                label="Sensitivity"
                value={controls.sensitivity}
                onChange={(v) => updateControl('sensitivity', v)}
              />
              <Slider
                label="Smoothing"
                value={controls.smoothing}
                onChange={(v) => updateControl('smoothing', v)}
              />
            </div>
          </GlassPanel>

          {/* Visual Mapping Section */}
          <GlassPanel padding="sm">
            <SectionHeader>Visual Mapping</SectionHeader>
            <div className="space-y-4">
              <Slider
                label="Bloom"
                value={controls.bloom}
                onChange={(v) => updateControl('bloom', v)}
              />
              <Slider
                label="Trail Length"
                value={controls.trailLength}
                onChange={(v) => updateControl('trailLength', v)}
              />
              <Slider
                label="Particle Density"
                value={controls.particleDensity}
                onChange={(v) => updateControl('particleDensity', v)}
              />

              <div className="h-px bg-white/5 my-2" />

              <Toggle
                label="Onset Rings"
                checked={controls.onsetRings}
                onChange={(v) => updateControl('onsetRings', v)}
              />
              <Toggle
                label="Pitch to Color"
                checked={controls.pitchToColor}
                onChange={(v) => updateControl('pitchToColor', v)}
              />
            </div>
          </GlassPanel>

          {/* Quick Actions Section */}
          <GlassPanel padding="sm">
            <SectionHeader>Quick Actions</SectionHeader>
            <div className="flex gap-2">
              <NeonButton variant="secondary" className="flex-1" size="sm">
                Save Preset
              </NeonButton>
              <NeonButton variant="secondary" className="flex-1" size="sm">
                Reset
              </NeonButton>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* === BOTTOM TRANSPORT BAR === */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-30 px-6
        flex items-center justify-center gap-6
        bg-black/50 backdrop-blur-xl border-t border-white/5">

        {/* Record Button */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
            ${isRecording
              ? 'bg-red-500/30 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'}`}
        >
          <div className={`rounded-full bg-red-500 transition-all duration-200
            ${isRecording ? 'w-4 h-4 rounded-sm' : 'w-5 h-5'}`} />
        </button>

        {/* Export Button */}
        <NeonButton variant="secondary" size="sm" onClick={handleExport}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export WebM
          </span>
        </NeonButton>

        {/* Timer */}
        <div className="text-lg font-mono text-violet-300/60 tracking-wider tabular-nums">
          {recordTime}
        </div>
      </div>

      {/* Export Toast */}
      <Toast message="Video exported successfully!" visible={showExportToast} />
    </div>
  );

  // ============================================================================
  // FRAME 3: SETTINGS / CALIBRATION (1440×900)
  // ============================================================================
  // LAYOUT: Left sidebar navigation + Main content area with settings cards
  // INTERACTION FLOW:
  //   1. Sidebar nav → Switch between Performance, Presets, Settings, About
  //   2. Dropdowns → Update audio/visual/export settings
  //   3. Calibration → Play note → Meter shows level → Calibration complete
  // ============================================================================

  const SettingsFrame = () => {
    const [activeNav, setActiveNav] = useState('settings');
    const [calibrationLevel, setCalibrationLevel] = useState(45);

    const navItems = [
      { id: 'performance', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z', label: 'Performance' },
      { id: 'presets', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Presets' },
      { id: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Settings' },
      { id: 'about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'About' },
    ];

    return (
      <div className="relative w-[1440px] h-[900px] bg-[#0a0a0f] overflow-hidden flex">
        {/* === LEFT SIDEBAR === */}
        <div className="w-[280px] h-full p-6 border-r border-white/5 bg-black/20">
          <div className="mb-10">
            <Logo />
          </div>

          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeNav === item.id
                    ? 'bg-violet-500/20 text-violet-200 shadow-[0_0_20px_rgba(168,85,247,0.15)] border border-violet-500/20'
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

          {/* Version info */}
          <div className="absolute bottom-6 left-6 text-xs text-violet-400/30 font-mono">
            v0.1.0
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-sm text-violet-300/50 mb-8">Configure audio, visual, and export options</p>

          <div className="grid grid-cols-2 gap-6 max-w-[960px]">

            {/* Audio Settings Card */}
            <GlassPanel padding="md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Audio</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Sample Rate</label>
                  <Dropdown
                    value="44100 Hz"
                    onChange={() => {}}
                    options={['44100 Hz', '48000 Hz', '96000 Hz']}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">FFT Size</label>
                  <Dropdown
                    value="2048"
                    onChange={() => {}}
                    options={['1024', '2048', '4096', '8192']}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Input Device</label>
                  <Dropdown
                    value="MacBook Pro Microphone"
                    onChange={() => {}}
                    options={['MacBook Pro Microphone', 'External USB Mic', 'Audio Interface']}
                    className="w-full"
                  />
                </div>
              </div>
            </GlassPanel>

            {/* Visual Settings Card */}
            <GlassPanel padding="md">
              <div className="flex items-center gap-3 mb-6">
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
                  <Dropdown
                    value="100% (Native)"
                    onChange={() => {}}
                    options={['100% (Native)', '75%', '50%']}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">FPS Target</label>
                  <Dropdown
                    value="60 FPS"
                    onChange={() => {}}
                    options={['30 FPS', '60 FPS', '120 FPS', 'Unlimited']}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Render Quality</label>
                  <Dropdown
                    value="High"
                    onChange={() => {}}
                    options={['Low', 'Medium', 'High', 'Ultra']}
                    className="w-full"
                  />
                </div>
              </div>
            </GlassPanel>

            {/* Export Settings Card */}
            <GlassPanel padding="md">
              <div className="flex items-center gap-3 mb-6">
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
                  <Dropdown
                    value="1080p (High)"
                    onChange={() => {}}
                    options={['480p (Low)', '720p (Medium)', '1080p (High)', '4K (Ultra)']}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Format</label>
                  <Dropdown
                    value="WebM (VP9)"
                    onChange={() => {}}
                    options={['WebM (VP9)', 'MP4 (H.264)', 'GIF', 'PNG Sequence']}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-violet-300/70 uppercase tracking-wider">Bitrate</label>
                  <Dropdown
                    value="8 Mbps"
                    onChange={() => {}}
                    options={['4 Mbps', '8 Mbps', '16 Mbps', '32 Mbps']}
                    className="w-full"
                  />
                </div>
              </div>
            </GlassPanel>

            {/* Calibration Wizard Card */}
            <GlassPanel padding="md" glow>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Calibration</h3>
              </div>

              <p className="text-sm text-violet-300/60 mb-5 leading-relaxed">
                Play a long, steady note to calibrate input levels for optimal visualization.
              </p>

              {/* Live Level Meter */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-violet-300/50">Input Level</span>
                    <span className="text-violet-200 font-mono">-12 dB</span>
                  </div>
                  <div className="h-8 rounded-lg bg-white/5 overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-lg transition-all duration-100"
                      style={{ width: `${calibrationLevel}%` }}
                    />
                    {/* Peak markers */}
                    <div className="absolute top-0 bottom-0 right-[10%] w-px bg-amber-500/50" />
                    <div className="absolute top-0 bottom-0 right-[5%] w-px bg-red-500/50" />
                  </div>
                </div>

                <NeonButton variant="primary" className="w-full">
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Start Calibration
                  </span>
                </NeonButton>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // FRAME 4: MOBILE VIEWER MODE (390×844)
  // ============================================================================
  // DESIGN: Full-screen canvas with minimal controls for one-handed use
  // KEY FEATURES:
  //   - Large touch targets (48px minimum)
  //   - Bottom-aligned controls for thumb reach
  //   - Swipeable preset picker
  //   - Big status indicator
  // INTERACTION FLOW:
  //   1. Tap preset pill → Switch visual style
  //   2. Tap Start/Stop → Toggle live state
  //   3. Drag Bloom slider → Adjust intensity
  // ============================================================================

  const MobileFrame = () => (
    <div className="relative w-[390px] h-[844px] bg-[#0a0a0f] overflow-hidden rounded-[48px] border-4 border-gray-800 shadow-2xl">
      {/* Device Frame Details */}
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[34px] bg-black rounded-b-3xl z-50">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-700 rounded-full" />
      </div>

      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-12 z-40 flex items-end justify-between px-8 pb-1 text-xs text-white/60 font-medium">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          {/* Signal */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="14" width="3" height="6" rx="1" />
            <rect x="7" y="10" width="3" height="10" rx="1" />
            <rect x="12" y="6" width="3" height="14" rx="1" />
            <rect x="17" y="2" width="3" height="18" rx="1" />
          </svg>
          {/* WiFi */}
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-2.5l1.4 1.4c2-2 5.1-2 7 0l1.4-1.4c-2.7-2.7-7.1-2.7-9.8 0zM2.8 10.2l1.4 1.4c4.4-4.4 11.6-4.4 16 0l1.4-1.4c-5.2-5.2-13.6-5.2-18.8 0z"/>
          </svg>
          {/* Battery */}
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-3 rounded-sm border border-current p-0.5">
              <div className="w-full h-full bg-current rounded-sm" />
            </div>
            <div className="w-0.5 h-1.5 bg-current rounded-r-full" />
          </div>
        </div>
      </div>

      {/* === FULL SCREEN CANVAS === */}
      <div className="absolute inset-0 pt-12">
        {/* Aurora Background */}
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[15%] w-[280px] h-[280px] bg-violet-600/40 rounded-full blur-[70px] animate-pulse"
            style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-[30%] right-[10%] w-[240px] h-[240px] bg-fuchsia-600/30 rounded-full blur-[60px] animate-pulse"
            style={{ animationDuration: '4s', animationDelay: '1.5s' }} />
          <div className="absolute top-[45%] left-[40%] w-[180px] h-[180px] bg-blue-500/25 rounded-full blur-[50px]" />
        </div>

        {/* Circular Visualizer */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-40px' }}>
          <div className="relative w-[260px] h-[260px]">
            {/* Outer glow pulse */}
            <div className="absolute inset-[-20px] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 blur-2xl animate-pulse"
              style={{ animationDuration: '2s' }} />

            {/* Circular bars */}
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = (i / 36) * 360;
                const height = 25 + Math.random() * 55;
                const hue = 280 + (i / 36) * 40;
                return (
                  <div
                    key={i}
                    className="absolute w-2 origin-bottom rounded-full"
                    style={{
                      height: `${height}px`,
                      transform: `rotate(${angle}deg) translateY(-90px)`,
                      background: `linear-gradient(to top, hsl(${hue}, 80%, 50%), hsl(${hue + 20}, 90%, 65%))`,
                      boxShadow: `0 0 8px hsla(${hue}, 80%, 50%, 0.6)`,
                    }}
                  />
                );
              })}
            </div>

            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center
                shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Status Pill - Top Center */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <StatusPill status="LIVE" />
        </div>

        {/* === BOTTOM CONTROLS (One-handed friendly) === */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-10">
          <GlassPanel padding="md" className="space-y-5">
            {/* Preset Picker - Horizontal scroll */}
            <div className="space-y-2">
              <span className="text-xs text-violet-400/60 uppercase tracking-wider">Preset</span>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
                {['Neon Spectrum', 'Aurora Ribbons', 'Cyber Rosette'].map((p, i) => (
                  <button
                    key={p}
                    className={`
                      whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                      min-w-[120px] text-center
                      ${i === 0
                        ? 'bg-violet-500/25 text-violet-200 border border-violet-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-white/5 text-violet-300/50 border border-white/10 active:bg-white/10'}
                    `}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Start/Stop Button - Large touch target */}
            <NeonButton variant="primary" className="w-full" size="lg">
              <span className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Stop
              </span>
            </NeonButton>

            {/* Bloom Slider */}
            <Slider
              label="Bloom Intensity"
              value={controls.bloom}
              onChange={(v) => updateControl('bloom', v)}
            />
          </GlassPanel>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#050508] p-8 pt-20 flex flex-col items-center justify-center">
      {/* Global Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.05); }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Select option styling */
        select option {
          background: #1a1a24;
          color: #ddd6fe;
          padding: 8px;
        }
      `}</style>

      {/* Frame Navigation */}
      <FrameSelector />

      {/* Frame Container */}
      <div className="relative">
        <div className={`rounded-2xl overflow-hidden
          ${activeFrame === 'mobile' ? '' : 'shadow-[0_0_100px_rgba(168,85,247,0.15)]'}`}>
          {activeFrame === 'landing' && <LandingFrame />}
          {activeFrame === 'performance' && <PerformanceFrame />}
          {activeFrame === 'settings' && <SettingsFrame />}
          {activeFrame === 'mobile' && <MobileFrame />}
        </div>

        {/* Frame Label */}
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-center">
          <div className="text-sm text-violet-400/50 font-mono">
            {activeFrame === 'landing' && 'Frame 1: Landing / Permission — 1440×900'}
            {activeFrame === 'performance' && 'Frame 2: Performance Canvas — 1440×900'}
            {activeFrame === 'settings' && 'Frame 3: Settings / Calibration — 1440×900'}
            {activeFrame === 'mobile' && 'Frame 4: Mobile Viewer — 390×844'}
          </div>
          <div className="text-xs text-violet-400/30 mt-1">
            Click tabs above to switch frames
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeonRV443Design;

// ============================================================================
// DESIGN SYSTEM DOCUMENTATION
// ============================================================================
/*

## Color Palette

### Primary (Neon Purple)
- violet-400: #a78bfa - Accent text, icons
- violet-500: #8b5cf6 - Primary buttons, highlights
- violet-600: #7c3aed - Button gradients, active states

### Secondary (Fuchsia/Pink)
- fuchsia-400: #e879f9 - Gradient endpoints
- fuchsia-500: #d946ef - Accent gradients
- fuchsia-600: #c026d3 - Deep accents

### Backgrounds
- #050508 - Page background (near black)
- #0a0a0f - Card/frame background
- rgba(255,255,255,0.03-0.08) - Glass surfaces

### Status Colors
- Emerald #10b981 - LIVE, success
- Amber #f59e0b - PAUSED, warning
- Red #ef4444 - Recording, error

## Spacing (8px Grid)
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

## Border Radius
- sm: 8px - Small elements
- md: 12px - Buttons, inputs
- lg: 16px - Cards
- xl: 24px - Large panels
- full: 9999px - Pills, toggles

## Typography
- Font: System sans-serif (Inter-like)
- Headings: font-black, tracking-tight
- Body: font-regular
- Labels: text-xs, uppercase, tracking-wider
- Mono: For values, timers (tabular-nums)

## Shadows & Glows
- Glow primary: 0 0 20px rgba(168,85,247,0.4)
- Glow intense: 0 0 30px rgba(168,85,247,0.6)
- Card shadow: 0 8px 32px rgba(0,0,0,0.4)
- Bloom effect: blur-xl + opacity layers

## Components

### GlassPanel
- backdrop-blur-xl
- bg-gradient-to-br from-white/8 to-white/2
- border border-white/10
- Optional glow prop for neon border effect

### NeonButton
- Primary: Gradient bg, glow shadow, hover scale
- Secondary: Transparent, border, hover glow

### Slider
- Thin track (h-2)
- Gradient fill (violet to fuchsia)
- Glowing white thumb with shadow

### Toggle
- 48px width for mobile touch
- Gradient fill when active
- Smooth 300ms transition

### Dropdown
- Focus ring: ring-violet-500/50
- Dark options with light text

### StatusPill
- LIVE: Emerald with animated pulse dot
- PAUSED: Amber with static dot

## Interactions (Prototype Notes)

1. Landing → Permission → Performance
   - "Start with Microphone" click → Modal overlay fades in
   - "Allow" click → Navigate to Performance frame
   - "Cancel" click → Modal fades out

2. Performance Controls
   - Preset dropdown → Visual style updates instantly
   - Sliders → Real-time parameter changes
   - Toggles → Feature on/off with visual feedback

3. Recording Flow
   - Record button click → Timer starts, button pulses
   - Export click → Toast "Saved" appears for 3s

4. Mobile Gestures
   - Swipe preset pills horizontally
   - Large touch targets (min 48px)
   - Bottom-aligned for thumb reach

*/
