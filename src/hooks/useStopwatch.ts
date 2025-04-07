import { useEffect, useRef, useState } from 'react'

export function useStopwatch(startOnMount = true) {
  const [elapsed, setElapsed] = useState(0)
  const startTime = useRef<number | null>(null)
  const animationFrame = useRef<number | null>(null)
  const running = useRef(false)

  const update = (time: number) => {
    if (startTime.current !== null) {
      setElapsed(time - startTime.current)
    }
    animationFrame.current = requestAnimationFrame(update)
  }

  const start = () => {
    if (!running.current) {
      startTime.current = performance.now() - elapsed
      animationFrame.current = requestAnimationFrame(update)
      running.current = true
    }
  }

  const stop = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
      animationFrame.current = null
    }
    running.current = false
  }

  const reset = () => {
    stop()
    setElapsed(0)
    startTime.current = null
  }

  useEffect(() => {
    if (startOnMount) start()
    return stop
  }, [startOnMount])

  return { elapsed, start, stop, reset, running: running.current }
}
