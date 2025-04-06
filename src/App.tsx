import { Canvas } from '@react-three/fiber'
import { Crosshair } from './components/Crosshair'
import { UI } from './components/UI'
import { DefaultScene } from './scene/DefaultScene'
import './index.css'
import { useState } from 'react'

const DEBUG = false

export default function App() {
  const [gameStarted, setGameStarted] = useState(DEBUG)

  return gameStarted ? (
    <>
      <UI>
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
