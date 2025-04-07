import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export const useRefreshRate = () => {
  const lastTimeRef = useRef(0)
  const refreshRateRef = useRef(0)

  useFrame(({ clock }) => {
    const currentTime = clock.getElapsedTime()
    const delta = currentTime - lastTimeRef.current
    lastTimeRef.current = currentTime

    refreshRateRef.current = 1 / delta
  })

  return refreshRateRef.current
}
