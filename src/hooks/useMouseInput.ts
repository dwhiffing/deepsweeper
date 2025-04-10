import { useEffect } from 'react'

export const useMouseInput = (
  onMouseDown?: (b: number, x: number, y: number) => void,
  onMouseUp?: (b: number, x: number, y: number) => void,
  onMouseMove?: (x: number, y: number) => void,
) => {
  useEffect(() => {
    const handleTouchDown = (e: PointerEvent) => {
      onMouseDown?.(e.button, e.clientX, e.clientY)
    }
    const handleTouchUp = (e: PointerEvent) => {
      onMouseUp?.(e.button, e.clientX, e.clientY)
    }
    const handleTouchMove = (e: PointerEvent) => {
      onMouseMove?.(e.clientX, e.clientY)
    }

    document.addEventListener('pointerdown', handleTouchDown)
    document.addEventListener('pointerup', handleTouchUp)
    document.addEventListener('pointermove', handleTouchMove)

    return () => {
      document.removeEventListener('pointerdown', handleTouchDown)
      document.removeEventListener('pointerup', handleTouchUp)
      document.removeEventListener('pointermove', handleTouchMove)
    }
  }, [onMouseDown, onMouseUp, onMouseMove])
}
