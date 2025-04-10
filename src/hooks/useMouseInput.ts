import { useEffect, useState } from 'react'

export const useMouseInput = (
  onMouseDown?: (b: number, x: number, y: number) => void,
  onMouseUp?: (b: number, x: number, y: number) => void,
  onMouseMove?: (x: number, y: number) => void,
) => {
  const [keysPressed, setPressedKeys] = useState({ left: false, right: false })

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      onMouseDown?.(e.button, e.clientX, e.clientY)
      if (e.button === 1) {
        setPressedKeys((current) => ({ ...current, right: true }))
      } else if (e.button === 0) {
        setPressedKeys((current) => ({ ...current, left: true }))
      }
    }
    const handleMouseUp = (e: MouseEvent) => {
      onMouseUp?.(e.button, e.clientX, e.clientY)
      if (e.button === 1) {
        setPressedKeys((current) => ({ ...current, right: false }))
      } else if (e.button === 0) {
        setPressedKeys((current) => ({ ...current, left: false }))
      }
    }
    const handleMouseMove = (e: MouseEvent) => {
      onMouseMove?.(e.clientX, e.clientY)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [onMouseDown, onMouseUp, onMouseMove])

  return keysPressed
}
