import { Canvas } from '@react-three/fiber'
import { Crosshair } from './components/Crosshair'
import { UI } from './components/UI'
import { DefaultScene } from './scene/DefaultScene'
import './index.css'
import { useEffect, useState } from 'react'
import { DEBUG, DUR, mineSpacing } from './utils/constants'
import { clickSound, music, playSound, toggleMute } from './utils/audio'
import { stopWatch } from './hooks/useStopwatch'
import { formatTime } from './utils'
import { StopWatch } from './components/StopWatch'
import { MineStats } from './components/MineStats'

export default function App() {
  const [gameStarted, setGameStarted] = useState(DEBUG)
  const [gameFade, setGameFade] = useState(false)
  const [gameState, setGameState] = useState('')
  const [menuFade, setMenuFade] = useState(false)
  const [gridSize, setGridSize] = useState(3)
  const [lastTime, setLastTime] = useState(0)
  const [mineCount, setMineCount] = useState(1)
  const [showButtons, setShowButtons] = useState(false)
  useEffect(() => {
    setTimeout(() => setGameFade(gameStarted), DUR)
  }, [gameStarted])

  useEffect(() => {
    const onClick = () => {
      music.play()
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase()
      if (lowerKey === 'm') {
        e.preventDefault()
        toggleMute()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const onStart = (size: number, mines: number) => {
    setMineCount(mines)
    setGridSize(size)
    setMenuFade(true)
    playSound(clickSound, 0.9, 1.1, 0.35)
    setTimeout(() => setGameStarted(true), DUR)
  }

  useEffect(() => {
    if (!gameStarted) {
      setShowButtons(false)
    }
  }, [gameStarted])

  return gameStarted ? (
    <>
      <UI>
        <MineStats />
        <StopWatch gameStarted={gameStarted} />
        <div
          className="transition-all inset-0 fixed z-20"
          style={{
            backgroundColor: gameFade ? 'transparent' : '#00001c',
            transitionDuration: `${gameFade ? DUR : DUR / 2}ms`,
          }}
        />
        <Crosshair />
      </UI>
      <Canvas style={{ backgroundColor: '#00001c' }}>
        <DefaultScene
          gridSize={gridSize}
          spacing={mineSpacing}
          mineCount={mineCount}
          onGameOver={(state: string) => {
            setGameFade(false)
            setGameState(state)
            const { time, reset } = stopWatch.getState()
            setLastTime(time)
            reset()

            setTimeout(() => {
              setGameStarted(false)
              setTimeout(() => setMenuFade(false), DUR / 2)
            }, DUR)
          }}
        />
      </Canvas>
    </>
  ) : (
    <div className="flex justify-center items-center h-screen text-white">
      <div
        className="transition-all inset-0 fixed z-20"
        style={{
          transitionDuration: `${DUR}ms`,
          backgroundColor: menuFade ? '#00001c' : 'transparent',
          pointerEvents: menuFade ? 'auto' : 'none',
        }}
      />
      {showButtons ? (
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => onStart(3, 1)}>Easy</button>
          <button onClick={() => onStart(4, 6)}>Medium</button>
          <button onClick={() => onStart(5, 12)}>Hard</button>
          <button onClick={() => onStart(7, 24)}>Expert</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-3xl font-bold">Deepsweeper</h3>
          <p>
            {gameState === 'lose'
              ? 'You lose!'
              : gameState === 'win'
              ? 'You win!'
              : "Sweep the mines and don't die"}
          </p>
          {gameState === 'win' && <p>Time: {formatTime(lastTime)}</p>}
          <div>
            <button
              onClick={() => {
                playSound(clickSound, 0.9, 1.1, 0.35)
                setShowButtons(true)
              }}
            >
              Start Game
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
