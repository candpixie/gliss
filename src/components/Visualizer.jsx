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
    
    // Wait for next frame to ensure canvas is properly sized
    const initScene = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight
      
      // Set canvas dimensions explicitly
      canvas.width = width
      canvas.height = height

      try {
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
      } catch (error) {
        console.error('Error initializing scene:', error)
      }
    }

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initScene)

    // Handle resize
    const handleResize = () => {
      if (canvas && sceneRef.current) {
        const rect = canvas.getBoundingClientRect()
        const width = rect.width || window.innerWidth
        const height = rect.height || window.innerHeight
        canvas.width = width
        canvas.height = height
        sceneRef.current.resize(width, height)
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

