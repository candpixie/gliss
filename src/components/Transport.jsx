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
      bg-black/50 backdrop-blur-xl border-t border-white/[0.06]">
      {/* Record Button */}
      <button
        onClick={handleRecord}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
          ${isRecording
            ? 'bg-rose-400/25 border-2 border-rose-300/70'
            : 'bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/25'}`}
      >
        <div className={`bg-rose-300 transition-all duration-200
          ${isRecording ? 'w-3.5 h-3.5 rounded-sm' : 'w-4 h-4 rounded-full'}`} />
      </button>

      {/* Export Button */}
      <button
        onClick={onExport}
        className="px-4 py-2 rounded-xl font-medium text-sm
          bg-transparent text-text-muted border border-white/10
          hover:bg-bg-surfaceHover hover:border-white/20 hover:text-text-primary
          transition-all duration-200
          flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export WebM
      </button>

      {/* Timer */}
      <div className="text-base font-mono text-text-muted tracking-wider tabular-nums">
        {formatTime(recordTime)}
      </div>
    </div>
  )
}

export default Transport
