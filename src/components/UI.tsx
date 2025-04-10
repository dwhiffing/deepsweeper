import { ReactNode } from 'react'

export const UI = ({ children }: { children: ReactNode }) => {
  return (
    <div
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        zIndex: '100',
      }}
    >
      {children}
    </div>
  )
}
