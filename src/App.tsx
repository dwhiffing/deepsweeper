import { Canvas } from '@react-three/fiber'
import { Crosshair } from './components/Crosshair'
import { UI } from './components/UI'
import { DefaultScene } from './scene/DefaultScene'
import './index.css'
import { useEffect, useState } from 'react'

const DEBUG = false

export default function App() {
  const [gameStarted, setGameStarted] = useState(DEBUG)
  const [fade, setFade] = useState(false)
  useEffect(() => {
    if (gameStarted) setTimeout(() => setFade(true), 1000)
  }, [gameStarted])

  return gameStarted ? (
    <>
      <UI>
        <div
          className="transition-all inset-0 fixed z-20 duration-1000"
          style={{ backgroundColor: fade ? 'transparent' : '#001' }}
        />
        <Crosshair />
      </UI>
      <Canvas style={{ backgroundColor: '#001' }}>
        <DefaultScene onGameOver={() => setGameStarted(false)} />
      </Canvas>
    </>
  ) : (
    <div className="flex justify-center items-center h-screen">
      <button
        className="bg-white border rounded-md px-4 py-2 cursor-pointer"
        onClick={() => setGameStarted(true)}
      >
        Start Game
      </button>
    </div>
  )
}
