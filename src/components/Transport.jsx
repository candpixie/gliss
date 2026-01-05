import { useState, useRef } from 'react'

const Transport = ({ onExport }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const timerRef = useRef(null)

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    } else {
      setIsRecording(true)
      setRecordTime(0)
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1)
      }, 1000)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full px-6 flex items-center justify-center gap-6
      bg-black/50 backdrop-blur-xl border-t border-white/5">
      {/* Record Button */}
      <button
        onClick={handleRecord}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
          ${isRecording
            ? 'bg-red-500/30 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
            : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'}`}
      >
        <div className={`rounded-full bg-red-500 transition-all duration-200
          ${isRecording ? 'w-4 h-4 rounded-sm' : 'w-5 h-5'}`} />
      </button>

      {/* Export Button */}
      <button
        onClick={onExport}
        className="px-4 py-2 rounded-xl font-semibold text-sm
          bg-transparent text-violet-300 border border-violet-500/40
          hover:bg-violet-500/10 hover:border-violet-400/60 hover:text-violet-200
          hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-200
          flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export WebM
      </button>

      {/* Timer */}
      <div className="text-lg font-mono text-violet-300/60 tracking-wider tabular-nums">
        {formatTime(recordTime)}
      </div>
    </div>
  )
}

export default Transport

