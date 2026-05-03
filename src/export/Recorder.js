/**
 * Recorder — wraps MediaRecorder against the live WebGL canvas + audio graph.
 *
 * Locates the canvas via document.querySelector so this module stays inside
 * Lane D's scope (no Visualizer/Scene edits required). Audio is captured by
 * creating a MediaStreamAudioDestinationNode on the supplied AudioContext and
 * connecting the source to it; the resulting audio + video tracks share a
 * single MediaRecorder so the WebM stays in sync.
 */

const MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

export const MAX_SECONDS = 90

export function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  for (const type of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return null
}

function findCanvas() {
  return document.querySelector('canvas')
}

export class Recorder {
  constructor({
    audioContext,
    audioSource,
    fps = 60,
    bitsPerSecond = 8_000_000,
    maxSeconds = MAX_SECONDS,
    onTick = null,
    onAutoStop = null,
  } = {}) {
    this.audioContext = audioContext || null
    this.audioSource = audioSource || null
    this.fps = fps
    this.bitsPerSecond = bitsPerSecond
    this.maxSeconds = maxSeconds
    this.onTick = onTick
    this.onAutoStop = onAutoStop

    this.mimeType = null
    this.recorder = null
    this.chunks = []
    this.combinedStream = null
    this.destinationNode = null
    this.startedAt = 0
    this.tickInterval = null
    this.lastBlob = null
  }

  start() {
    if (this.recorder && this.recorder.state === 'recording') return

    const canvas = findCanvas()
    if (!canvas) throw new Error('Recorder: no <canvas> found in document')

    const mimeType = pickMimeType()
    if (!mimeType) throw new Error('MediaRecorder: no supported WebM mime type')
    this.mimeType = mimeType

    const videoStream = canvas.captureStream(this.fps)
    const tracks = [...videoStream.getVideoTracks()]

    if (this.audioContext && this.audioSource) {
      this.destinationNode = this.audioContext.createMediaStreamDestination()
      this.audioSource.connect(this.destinationNode)
      tracks.push(...this.destinationNode.stream.getAudioTracks())
    }

    this.combinedStream = new MediaStream(tracks)
    this.chunks = []
    this.lastBlob = null

    this.recorder = new MediaRecorder(this.combinedStream, {
      mimeType,
      videoBitsPerSecond: this.bitsPerSecond,
    })
    this.recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) this.chunks.push(event.data)
    }
    this.recorder.start(1000)
    this.startedAt = performance.now()

    if (this.onTick) {
      this.tickInterval = setInterval(() => {
        const elapsed = (performance.now() - this.startedAt) / 1000
        const remaining = Math.max(0, this.maxSeconds - elapsed)
        try {
          this.onTick({ elapsed, remaining, max: this.maxSeconds })
        } catch (err) {
          console.error('Recorder onTick error:', err)
        }
        if (elapsed >= this.maxSeconds) {
          this.stop().then((blob) => {
            if (this.onAutoStop) this.onAutoStop(blob)
          })
        }
      }, 250)
    }
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (this.tickInterval) {
        clearInterval(this.tickInterval)
        this.tickInterval = null
      }
      const recorder = this.recorder
      const cleanup = () => {
        if (this.destinationNode && this.audioSource) {
          try { this.audioSource.disconnect(this.destinationNode) } catch {}
        }
        this.destinationNode = null
      }
      if (!recorder) {
        cleanup()
        resolve(null)
        return
      }
      if (recorder.state === 'inactive') {
        const blob = new Blob(this.chunks, { type: this.mimeType || 'video/webm' })
        this.lastBlob = blob
        cleanup()
        resolve(blob)
        return
      }
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType || 'video/webm' })
        this.lastBlob = blob
        cleanup()
        resolve(blob)
      }
      recorder.onerror = (event) => {
        cleanup()
        reject(event.error || new Error('MediaRecorder error'))
      }
      recorder.stop()
    })
  }

  isRecording() {
    return !!this.recorder && this.recorder.state === 'recording'
  }

  download(filename = `tideglass-${Date.now()}.webm`, blob = this.lastBlob) {
    if (!blob) throw new Error('Recorder.download: no blob to download')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
