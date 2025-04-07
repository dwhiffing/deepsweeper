import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export const useRefreshRate = () => {
  const lastTimeRef = useRef(0)
  const refreshRateRef = useRef(0)

  useFrame(({ clock }) => {
    const currentTime = clock.getElapsedTime()
    const delta = currentTime - lastTimeRef.current
    lastTimeRef.current = currentTime

    const fps = 1 / delta
    refreshRateRef.current = refreshRateRef.current * 0.9 + fps * 0.1
  })

  return refreshRateRef.current
}
