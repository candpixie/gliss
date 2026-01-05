import { useEffect, useRef } from 'react'
import { Scene } from '../visuals/Scene'
import { extractFeatures } from '../audio/Features'

const Visualizer = ({ analyser, preset, controls }) => {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !analyser) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const scene = new Scene(canvas, preset, controls)
    sceneRef.current = scene

    const frequencyData = new Float32Array(analyser.frequencyBinCount)
    const timeData = new Float32Array(analyser.fftSize)

    const animate = () => {
      if (!analyser || !sceneRef.current) return

      analyser.getFloatFrequencyData(frequencyData)
      analyser.getFloatTimeDomainData(timeData)

      const features = extractFeatures(frequencyData, timeData)
      sceneRef.current.update(features, controls)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (canvas && sceneRef.current) {
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
        sceneRef.current.resize(rect.width, rect.height)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current) {
        sceneRef.current.dispose()
      }
    }
  }, [analyser, preset])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateControls(controls)
      sceneRef.current.updatePreset(preset)
    }
  }, [controls, preset])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

export default Visualizer

