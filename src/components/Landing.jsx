const Landing = ({ onStart }) => {
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) onStart('file', file)
  }

  return (
    <div className="relative w-full h-screen bg-bg-deep overflow-hidden flex items-center justify-center">
      {/* Sheet-music staff lines, faint, full width */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex flex-col gap-5 pointer-events-none">
        <div className="h-px bg-white/[0.05]" />
        <div className="h-px bg-white/[0.05]" />
        <div className="h-px bg-white/[0.05]" />
        <div className="h-px bg-white/[0.05]" />
        <div className="h-px bg-white/[0.05]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-[8rem] font-light tracking-tight text-text-primary leading-none lowercase">
          gliss<span className="text-accent-glacier">.</span>
        </h1>

        <p className="mt-8 text-text-muted text-base font-light italic">
          an audio visualizer for woodwind, brass, strings, and voice.
        </p>

        <div className="mt-14 flex items-center justify-center gap-6 text-sm">
          <button
            onClick={() => onStart('mic')}
            className="text-text-primary hover:text-accent-glacier transition-colors duration-200 underline underline-offset-8 decoration-accent-glacier/40 hover:decoration-accent-glacier decoration-1"
          >
            use microphone
          </button>
          <span className="text-text-dim text-xs">/</span>
          <label className="cursor-pointer text-text-primary hover:text-accent-glacier transition-colors duration-200 underline underline-offset-8 decoration-accent-glacier/40 hover:decoration-accent-glacier decoration-1">
            upload a file
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <p className="mt-20 text-xs text-text-dim font-light tracking-wide">
          best with monophonic instruments: recorder, flute, violin, voice.
        </p>
      </div>
    </div>
  )
}

export default Landing
