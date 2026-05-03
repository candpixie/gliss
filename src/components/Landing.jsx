import { useState } from 'react'

const Landing = ({ onStart }) => {
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  const handleStartWithMic = () => {
    setShowPermissionModal(true)
  }

  const handlePermissionAllow = async () => {
    setShowPermissionModal(false)
    await onStart('mic')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      onStart('file', file)
    }
  }

  return (
    <div className="relative w-full h-screen bg-bg-deep overflow-hidden flex items-center justify-center">
      {/* Cold ambient glow — moonlit, not blacklight */}
      <div className="absolute inset-0">
        <div
          className="absolute top-[-15%] left-[15%] w-[820px] h-[620px] rounded-full blur-[160px] animate-pulse"
          style={{ background: 'rgba(93,181,185,0.10)', animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[-10%] right-[10%] w-[720px] h-[520px] rounded-full blur-[140px]"
          style={{ background: 'rgba(142,184,201,0.08)' }}
        />
        <div
          className="absolute top-[35%] right-[28%] w-[420px] h-[420px] rounded-full blur-[110px] animate-pulse"
          style={{ background: 'rgba(200,217,180,0.05)', animationDuration: '11s', animationDelay: '3s' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-[480px] rounded-2xl p-10
        bg-gradient-to-br from-white/[0.06] to-white/[0.015]
        backdrop-blur-xl border border-white/[0.07]
        shadow-frost text-center">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center
              bg-gradient-to-br from-accent-glacier/30 to-accent-tide/20
              border border-white/10
              shadow-frost-glow">
              <svg className="w-11 h-11 text-accent-glacier" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 3l3 5h-2v6h-2V8H9l3-5zm-7 12l3.5 6h11L23 15M5 15l-2 6h18" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-5xl font-light tracking-tight text-text-primary">
              Gliss
            </h1>
            <p className="text-text-muted text-base font-light">
              An audio visualizer that listens like a musician.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStartWithMic}
              className="w-full px-8 py-4 rounded-xl font-medium text-base
                bg-accent-glacier/15 text-text-primary
                border border-accent-glacier/40
                hover:bg-accent-glacier/25 hover:border-accent-glacier/60
                transition-all duration-200
                flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5 text-accent-glacier" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Use microphone
            </button>

            <label className="block w-full px-8 py-4 rounded-xl font-medium text-base
              bg-transparent text-text-primary border border-white/10
              hover:bg-bg-surfaceHover hover:border-white/20
              transition-all duration-200 cursor-pointer
              flex items-center justify-center gap-3">
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload a file
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Note */}
          <p className="text-xs text-text-dim leading-relaxed">
            Best with monophonic instruments — recorder, flute, violin, voice.
          </p>
        </div>
      </div>

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPermissionModal(false)}
          />
          <div className="relative z-10 w-[420px] rounded-2xl p-8
            bg-gradient-to-br from-white/[0.06] to-white/[0.015]
            backdrop-blur-xl border border-white/[0.07]
            shadow-frost text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-glacier/15 border border-white/10
                flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-glacier" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium text-text-primary mb-2">Microphone access</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Gliss listens locally to track pitch, vibrato, and harmonics.
                  Audio never leaves your device.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-sm
                    bg-transparent text-text-muted border border-white/10
                    hover:bg-bg-surfaceHover transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePermissionAllow}
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-sm
                    bg-accent-glacier/20 text-text-primary border border-accent-glacier/50
                    hover:bg-accent-glacier/30 transition-all duration-200"
                >
                  Allow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Landing
