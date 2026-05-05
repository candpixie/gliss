/**
 * PracticePanel — practice-feedback overlay for Lane Practice.
 *
 * Replaces the small InstrumentHint corner with:
 *   • Pitch ladder: 5s f0 trace plotted against an anchor-relative cents axis,
 *     with ghost ticks at 2f/3f/4f harmonic positions.
 *   • Vibrato readout: rate dot on a 0–10 Hz scale with a 5–7 Hz target band
 *     plus extent in cents.
 *   • Hold-time counter: grows while f0 stays within ±20¢ of the anchor;
 *     resets when pitch drifts outside the band.
 *
 * Telemetry is shaped by Visualizer.jsx and arrives at ~10 Hz.
 */

const TRACE_WINDOW_MS = 5000
const HOLD_TOLERANCE_CENTS = 20
const HOLD_VISIBLE_AFTER_MS = 1000

// SVG geometry for the pitch ladder.
const LADDER_W = 248
const LADDER_H = 168
const LADDER_PAD_L = 32
const LADDER_PAD_R = 8
const LADDER_PAD_T = 8
const LADDER_PAD_B = 8
const PLOT_W = LADDER_W - LADDER_PAD_L - LADDER_PAD_R
const PLOT_H = LADDER_H - LADDER_PAD_T - LADDER_PAD_B

// Cents range: octave below anchor → two octaves above (covers 2f/3f/4f ticks).
const CENTS_MIN = -1200
const CENTS_MAX = 2500
const CENTS_RANGE = CENTS_MAX - CENTS_MIN

const HARMONIC_TICKS = [
  { cents: 1200, label: '2f' },
  { cents: 1902, label: '3f' },
  { cents: 2400, label: '4f' },
]

function centsToY(cents) {
  const clamped = Math.max(CENTS_MIN, Math.min(CENTS_MAX, cents))
  // Higher cents → smaller Y (top of SVG).
  return LADDER_PAD_T + PLOT_H * (1 - (clamped - CENTS_MIN) / CENTS_RANGE)
}

function ageToX(ageMs) {
  // 0 ms (now) → right edge; TRACE_WINDOW_MS → left edge.
  const t = Math.max(0, Math.min(TRACE_WINDOW_MS, ageMs))
  return LADDER_PAD_L + PLOT_W * (1 - t / TRACE_WINDOW_MS)
}

const PracticePanel = ({ telemetry }) => {
  const visible = !!telemetry

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none absolute bottom-[88px] left-6 z-30
        w-[280px] select-none
        transition-opacity duration-500
        ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="rounded-2xl p-4
        bg-gradient-to-br from-white/[0.06] to-white/[0.02]
        backdrop-blur-xl border border-white/[0.08]
        shadow-frost
        font-mono text-[11px] text-text-muted">
        <Header telemetry={telemetry} />
        <PitchLadder telemetry={telemetry} />
        <VibratoReadout vibrato={telemetry?.vibrato} />
        <HoldCounter holdMs={telemetry?.holdMs ?? 0} />
      </div>
    </div>
  )
}

const Header = ({ telemetry }) => {
  const anchor = telemetry?.anchor
  const f0 = telemetry?.f0
  const cents = telemetry?.cents
  return (
    <div className="flex items-baseline justify-between mb-3">
      <div className="flex items-baseline gap-2">
        <span aria-hidden="true" className="text-accent-glacier">♪</span>
        <span className="text-text-primary text-sm tracking-wide">
          {anchor ? anchor.name : '—'}
        </span>
        <span className="text-text-dim">
          {anchor ? `${Math.round(anchor.hz)} Hz` : ''}
        </span>
      </div>
      <span className={`tabular-nums ${centsClass(cents)}`}>
        {f0 != null && cents != null
          ? `${cents >= 0 ? '+' : ''}${Math.round(cents)}¢`
          : ''}
      </span>
    </div>
  )
}

function centsClass(cents) {
  if (cents == null) return 'text-text-dim'
  const abs = Math.abs(cents)
  if (abs <= HOLD_TOLERANCE_CENTS) return 'text-accent-aurora'
  if (abs <= 50) return 'text-accent-glacier'
  return 'text-text-muted'
}

const PitchLadder = ({ telemetry }) => {
  const trace = telemetry?.trace ?? []
  const cents = telemetry?.cents

  // Anchor line position.
  const anchorY = centsToY(0)
  const bandTop = centsToY(HOLD_TOLERANCE_CENTS)
  const bandBot = centsToY(-HOLD_TOLERANCE_CENTS)

  return (
    <svg
      width={LADDER_W}
      height={LADDER_H}
      viewBox={`0 0 ${LADDER_W} ${LADDER_H}`}
      className="block mb-3"
      role="img"
      aria-label="Pitch ladder showing f0 trace and harmonic markers"
    >
      {/* Plot frame */}
      <rect
        x={LADDER_PAD_L}
        y={LADDER_PAD_T}
        width={PLOT_W}
        height={PLOT_H}
        fill="rgba(255,255,255,0.015)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />

      {/* ±20 ¢ tolerance band around anchor */}
      <rect
        x={LADDER_PAD_L}
        y={bandTop}
        width={PLOT_W}
        height={bandBot - bandTop}
        fill="rgba(200,217,180,0.10)"
      />

      {/* Anchor line */}
      <line
        x1={LADDER_PAD_L}
        x2={LADDER_PAD_L + PLOT_W}
        y1={anchorY}
        y2={anchorY}
        stroke="rgba(200,217,180,0.55)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <text
        x={LADDER_PAD_L - 4}
        y={anchorY + 3}
        textAnchor="end"
        fill="rgba(200,217,180,0.7)"
        fontSize="9"
      >
        f
      </text>

      {/* Harmonic ghost ticks */}
      {HARMONIC_TICKS.map(({ cents: c, label }) => {
        const y = centsToY(c)
        return (
          <g key={label}>
            <line
              x1={LADDER_PAD_L}
              x2={LADDER_PAD_L + PLOT_W}
              y1={y}
              y2={y}
              stroke="rgba(142,184,201,0.22)"
              strokeWidth="1"
              strokeDasharray="1 4"
            />
            <text
              x={LADDER_PAD_L - 4}
              y={y + 3}
              textAnchor="end"
              fill="rgba(142,184,201,0.55)"
              fontSize="9"
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* f0 trace dots, alpha by recency */}
      {trace.map((p, i) => {
        const recency = 1 - p.ageMs / TRACE_WINDOW_MS
        const alpha = Math.max(0.05, recency * 0.85)
        const r = 1.2 + recency * 1.2
        return (
          <circle
            key={i}
            cx={ageToX(p.ageMs)}
            cy={centsToY(p.cents)}
            r={r}
            fill={`rgba(232,238,245,${alpha.toFixed(3)})`}
          />
        )
      })}

      {/* Current pitch indicator on right edge */}
      {cents != null && (
        <circle
          cx={LADDER_PAD_L + PLOT_W - 2}
          cy={centsToY(cents)}
          r="3"
          fill="rgba(232,238,245,1)"
          stroke="rgba(142,184,201,0.6)"
          strokeWidth="1"
        />
      )}
    </svg>
  )
}

const VIB_BAR_W = 248
const VIB_BAR_H = 8
const VIB_RATE_MAX = 10
const VIB_TARGET_LOW = 5
const VIB_TARGET_HIGH = 7

const VibratoReadout = ({ vibrato }) => {
  const active = !!vibrato
  const rate = vibrato?.rateHz ?? 0
  const extent = vibrato?.extentCents ?? 0
  const inTarget = active && rate >= VIB_TARGET_LOW && rate <= VIB_TARGET_HIGH

  const targetX = (VIB_TARGET_LOW / VIB_RATE_MAX) * VIB_BAR_W
  const targetW = ((VIB_TARGET_HIGH - VIB_TARGET_LOW) / VIB_RATE_MAX) * VIB_BAR_W
  const dotX = Math.max(0, Math.min(VIB_BAR_W, (rate / VIB_RATE_MAX) * VIB_BAR_W))

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1">
        <span className="uppercase tracking-[0.14em] text-[10px] text-text-dim">
          Vibrato
        </span>
        <span className={`tabular-nums ${inTarget ? 'text-accent-aurora' : 'text-text-muted'}`}>
          {active
            ? `${rate.toFixed(1)} Hz · ±${Math.round(extent)}¢`
            : '—'}
        </span>
      </div>
      <svg
        width={VIB_BAR_W}
        height={VIB_BAR_H + 6}
        viewBox={`0 0 ${VIB_BAR_W} ${VIB_BAR_H + 6}`}
        role="img"
        aria-label="Vibrato rate with 5–7 Hz target zone"
      >
        <rect
          x="0"
          y="3"
          width={VIB_BAR_W}
          height={VIB_BAR_H}
          rx="2"
          fill="rgba(255,255,255,0.04)"
        />
        {/* Target zone 5-7 Hz */}
        <rect
          x={targetX}
          y="3"
          width={targetW}
          height={VIB_BAR_H}
          rx="2"
          fill="rgba(200,217,180,0.28)"
        />
        {/* Tick marks at integer Hz */}
        {[0, 2, 4, 6, 8, 10].map((hz) => (
          <line
            key={hz}
            x1={(hz / VIB_RATE_MAX) * VIB_BAR_W}
            x2={(hz / VIB_RATE_MAX) * VIB_BAR_W}
            y1="3"
            y2={3 + VIB_BAR_H}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {/* Current rate indicator */}
        {active && (
          <circle
            cx={dotX}
            cy={3 + VIB_BAR_H / 2}
            r="3.5"
            fill={inTarget ? 'rgba(200,217,180,0.95)' : 'rgba(232,238,245,0.85)'}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="0.5"
          />
        )}
      </svg>
    </div>
  )
}

const HoldCounter = ({ holdMs }) => {
  const visible = holdMs >= HOLD_VISIBLE_AFTER_MS
  const seconds = (holdMs / 1000).toFixed(1)
  // Progress: full bar at 10s of sustained hold.
  const progress = Math.min(1, holdMs / 10000)

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="uppercase tracking-[0.14em] text-[10px] text-text-dim">
          Hold
        </span>
        <span className={`tabular-nums ${visible ? 'text-accent-aurora' : 'text-text-dim'}`}>
          {visible ? `${seconds}s` : '—'}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent-aurora/70 rounded-full
            transition-[width] duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}

export default PracticePanel
