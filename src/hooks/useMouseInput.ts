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
    const handleTouchDown = (e: TouchEvent) => {
      onMouseDown?.(-1, e.touches[0].clientX, e.touches[0].clientY)
    }
    const handleTouchUp = () => {
      onMouseUp?.(-1, 0, 0)
    }
    const handleTouchMove = (e: TouchEvent) => {
      onMouseMove?.(e.touches[0].clientX, e.touches[0].clientY)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    document.addEventListener('touchstart', handleTouchDown)
    document.addEventListener('touchend', handleTouchUp)
    document.addEventListener('touchmove', handleTouchMove)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)

      document.removeEventListener('touchstart', handleTouchDown)
      document.removeEventListener('touchend', handleTouchUp)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [onMouseDown, onMouseUp, onMouseMove])

  return keysPressed
}
