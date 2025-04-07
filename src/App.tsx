import { Canvas } from '@react-three/fiber'
import { Crosshair } from './components/Crosshair'
import { UI } from './components/UI'
import { DefaultScene } from './scene/DefaultScene'
import './index.css'
import { useEffect, useState } from 'react'
import { DEBUG, DUR, mineSpacing } from './utils/constants'
import { clickSound } from './utils/audio'
import { useStopwatch } from './hooks/useStopwatch'
import { formatTime } from './utils'

export default function App() {
  const [gameStarted, setGameStarted] = useState(DEBUG)
  const [gameFade, setGameFade] = useState(false)
  const [gameState, setGameState] = useState('')
  const [menuFade, setMenuFade] = useState(false)
  const [gridSize, setGridSize] = useState(3)
  const [lastTime, setLastTime] = useState(0)
  const [mineCount, setMineCount] = useState(3)
  const [showButtons, setShowButtons] = useState(false)
  useEffect(() => {
    setTimeout(() => setGameFade(gameStarted), DUR)
  }, [gameStarted])

  const onStart = (size: number, mines: number) => {
    setMineCount(mines)
    setGridSize(size)
    setMenuFade(true)
    clickSound.play()
    setTimeout(() => setGameStarted(true), DUR)
  }

  const stopWatch = useStopwatch()
  useEffect(() => {
    if (gameStarted) {
      stopWatch.start()
    } else {
      setShowButtons(false)
      stopWatch.stop()
    }
    // eslint-disable-next-line
  }, [gameStarted])

  return gameStarted ? (
    <>
      <UI>
        <p className="text-white z-20 absolute top-2 right-2">
          {formatTime(stopWatch.elapsed)}
        </p>
        <div
          className="transition-all inset-0 fixed z-20"
          style={{
            backgroundColor: gameFade ? 'transparent' : '#001',
            transitionDuration: `${gameFade ? DUR : DUR / 2}ms`,
          }}
        />
        <Crosshair />
      </UI>
      <Canvas style={{ backgroundColor: '#001' }}>
        <DefaultScene
          gridSize={gridSize}
          spacing={mineSpacing}
          mineCount={mineCount}
          onGameOver={(state: string) => {
            setGameFade(false)
            setGameState(state)
            setLastTime(stopWatch.elapsed)
            stopWatch.reset()

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
          backgroundColor: menuFade ? '#001' : 'transparent',
          pointerEvents: menuFade ? 'auto' : 'none',
        }}
      />
      {showButtons ? (
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => onStart(3, 1)}>Easy</button>
          <button onClick={() => onStart(5, 5)}>Medium</button>
          <button onClick={() => onStart(7, 10)}>Hard</button>
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
            <button onClick={() => setShowButtons(true)}>Start Game</button>
          </div>
        </div>
      )}
    </div>
  )
}
