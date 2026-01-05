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
    <div className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden flex items-center justify-center">
      {/* Aurora Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-[150px] animate-pulse"
          style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-5%] right-[15%] w-[700px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[130px]" />
        <div className="absolute top-[30%] right-[25%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-[480px] rounded-2xl p-8
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        backdrop-blur-xl border border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center
                shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
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
            <button
              onClick={handleStartWithMic}
              className="w-full px-8 py-4 rounded-xl font-semibold text-base
                bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-600 text-white
                shadow-[0_0_20px_rgba(168,85,247,0.4),0_0_40px_rgba(168,85,247,0.2)]
                hover:shadow-[0_0_30px_rgba(168,85,247,0.6),0_0_60px_rgba(168,85,247,0.3)]
                hover:scale-[1.02] transition-all duration-300
                flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start with Microphone
            </button>

            <label className="block w-full px-8 py-4 rounded-xl font-semibold text-base
              bg-transparent text-violet-300 border border-violet-500/40
              hover:bg-violet-500/10 hover:border-violet-400/60 hover:text-violet-200
              hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-pointer
              flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Audio File
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-violet-400/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            We only process audio locally.
          </div>
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
            bg-gradient-to-br from-white/[0.08] to-white/[0.02]
            backdrop-blur-xl border border-white/10
            shadow-[0_0_40px_rgba(168,85,247,0.15),inset_0_0_0_1px_rgba(168,85,247,0.1)]
            text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/20 flex items-center justify-center
                shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Microphone Access Required</h3>
                <p className="text-sm text-violet-300/60 leading-relaxed">
                  NEON RV443 needs microphone access to visualize your audio in real-time.
                  Your audio is never recorded or sent anywhere.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm
                    bg-transparent text-violet-300 border border-violet-500/40
                    hover:bg-violet-500/10 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePermissionAllow}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm
                    bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-600 text-white
                    shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                    transition-all duration-200"
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

