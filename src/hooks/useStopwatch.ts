import { createStore } from 'zustand'

let animationFrame: number | null = null
export const stopWatch = createStore<{
  running: boolean
  setRunning: (t: boolean) => void
  time: number
  setTime: (t: number) => void
  startTime: number
  setStartTime: (t: number) => void
  start: () => void
  stop: () => void
  reset: () => void
}>((set, get) => {
  const update = (time: number) => {
    if (get().startTime) {
      set({ time: time - get().startTime })
    }

    animationFrame = requestAnimationFrame(update)
  }

  const start = () => {
    if (!get().running) {
      set({ startTime: performance.now() - get().time })

      animationFrame = requestAnimationFrame(update)
      set({ running: true })
    }
  }

  const stop = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    set({ running: false })
  }

  const reset = () => {
    stop()
    set({ time: 0, startTime: 0 })
  }

  return {
    running: false,
    time: 0,
    startTime: 0,
    setTime: (time: number) => set({ time }),
    setStartTime: (startTime: number) => set({ startTime }),
    setRunning: (running: boolean) => set({ running }),
    start,
    stop,
    reset,
  }
})
