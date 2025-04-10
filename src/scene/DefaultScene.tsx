import { useCallback, useEffect, useRef, useState } from 'react'
import { Physics } from '@react-three/cannon'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { Plane } from '../prefabs/Plane'
import { Player } from '../prefabs/Player'
import { Cube } from '../prefabs/Cube'
import { Group, Raycaster, Vector2, Vector3 } from 'three'
import { useMouseInput } from '../hooks/useMouseInput'
import {
  assignMines,
  chunk,
  getAdjacent,
  getBoxes,
  mineStatsStore,
} from '../utils'
import { DEBUG, FOG_DISTANCE, mineSize, mineSpacing } from '../utils/constants'
import {
  clickSound,
  clickErrorSound,
  explosionSound,
  flagSound,
  playSound,
  spearSound,
  winSound,
} from '../utils/audio'
import { useRefreshRate } from '../hooks/useRefreshRate'
import { OrbitControls } from '@react-three/drei'

extend({ PointerLockControls })

export const DefaultScene = (props: {
  onGameOver: (state: string) => void
  gridSize: number
  orbitMode: boolean
  mineCount: number
  spacing: number
}) => {
  const { onGameOver, gridSize, orbitMode, mineCount, spacing } = props

  const { camera, gl } = useThree()
  const refreshRate = useRefreshRate()

  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [activeBoxes, setActiveBoxes] = useState<string[]>([])
  const [hasWon, setHasWon] = useState(false)

  const controls = useRef<PointerLockControls>(null)
  const lastUuid = useRef('')
  const winCheckTriggered = useRef(false)
  const pointerDownPos = useRef({ x: 0, y: 0 })
  const lastPointerPos = useRef({ x: 0, y: 0 })
  const frameCount = useRef(0)
  const ref = useRef(getBoxes(gridSize, spacing))
  const groupRef = useRef<Group>(null)

  const minDistance = gridSize * (mineSize + mineSpacing)

  const onLose = useCallback(() => {
    playSound(explosionSound)
    setTimeout(() => {
      onGameOver('lose')
    }, 500)
  }, [onGameOver])

  const getCenterCube = useCallback(() => {
    if (!groupRef.current) return

    const raycaster = new Raycaster()
    raycaster.setFromCamera(new Vector2(0, 0), camera)
    const intersects = raycaster.intersectObjects(groupRef.current.children)
    const uuid = intersects[0]?.object.uuid ?? ''

    return ref.current.boxes.find((b) => b.uuid === uuid)
  }, [camera])

  const getCubeAt = useCallback(
    (_x: number, _y: number) => {
      if (!groupRef.current) return

      const rect = gl.domElement.getBoundingClientRect()
      const x = ((_x - rect.left) / rect.width) * 2 - 1
      const y = -((_y - rect.top) / rect.height) * 2 + 1
      const raycaster = new Raycaster()
      raycaster.setFromCamera(new Vector2(x, y), camera)
      const intersects = raycaster.intersectObjects(groupRef.current.children)
      const uuid = intersects[0]?.object.uuid ?? ''

      const cube = ref.current.boxes.find((b) => b.uuid === uuid)
      return cube
    },
    [camera, gl.domElement],
  )

  const onSelectCube = useCallback((cube: Cube, highlightAdjacent = true) => {
    const adjacent = highlightAdjacent
      ? getAdjacent(cube, ref.current.cubeMap)
      : []
    const highlightUuids = [cube.uuid, ...adjacent.map((c) => c.uuid)]
    setActiveBoxes(highlightUuids.filter(Boolean))
  }, [])

  const onRevealCube = useCallback(
    (cube: Cube) => {
      if (winCheckTriggered.current) return

      if (revealed.size === 0) {
        assignMines(gridSize, mineCount, ref.current.cubeMap, activeBoxes[0])
      }

      // if you try to reveal a flagged cube, bail
      if (flagged.has(cube.uuid)) return

      // if you reveal a mine, you lose
      if (cube?.isMine) {
        onLose()
        setRevealed((r) => {
          r.add(cube.uuid)
          return new Set(r)
        })
        return
      }

      // if you reveal a revealed cube that is marked 0, reveal all adjacent
      if (cube && !revealed.has(cube.uuid)) {
        playSound(clickSound, 0.9, 1.1, 0.35)

        setRevealed((r) => {
          r.add(cube.uuid)
          return new Set(r)
        })

        // reveal neighbours recursively
        if (cube.number === 0) {
          const neighbors = getAdjacent(cube, ref.current.cubeMap, true)
          // reveal 7 at a time every 30ms for slightly better performance
          chunk(neighbors, 7).forEach((chunk, i) => {
            setTimeout(() => {
              chunk.forEach((n) => {
                setRevealed((r) => {
                  r.add(n.uuid)
                  return new Set(r)
                })
              })
            }, 30 * i)
          })
        }
      } else {
        playSound(clickErrorSound, 0.9, 1.1, 0.4)
      }
    },
    [activeBoxes, flagged, gridSize, mineCount, onLose, revealed],
  )

  const onFlagCube = useCallback(
    (cube: Cube) => {
      if (winCheckTriggered.current) return

      // if cube is already revealed, we cant flag it
      if (revealed.has(cube.uuid)) {
        // check if mine has an equal number of flagged members to its number, if so, reveal all unrevealed and unflagged neighbours
        const neighbors = getAdjacent(cube, ref.current.cubeMap)
        const flaggedNeighborCount = neighbors.filter((n) =>
          flagged.has(n.uuid),
        ).length
        if (flaggedNeighborCount === cube.number) {
          const unrevealedNeighbors = neighbors.filter(
            (n) => !revealed.has(n.uuid) && !flagged.has(n.uuid),
          )
          if (unrevealedNeighbors.some((n) => n.isMine)) {
            onLose()
          }

          setRevealed((r) => {
            unrevealedNeighbors.forEach((n) => r.add(n.uuid))
            return new Set(r)
          })
        }
        return
      }

      // toggle flag
      setFlagged((f) => {
        if (f.has(cube.uuid)) {
          playSound(clickErrorSound)
          f.delete(cube.uuid)
        } else {
          playSound(flagSound)
          f.add(cube.uuid)
        }
        return new Set(f)
      })
    },
    [flagged, onLose, revealed],
  )

  const onSpearCube = useCallback(() => {
    if (winCheckTriggered.current || mineStatsStore.getState().spears === 0)
      return

    if (revealed.size === 0) {
      assignMines(gridSize, mineCount, ref.current.cubeMap, activeBoxes[0])
    }

    const uuid = activeBoxes[0]
    const cube =
      ref.current.boxes.find((b) => b.uuid == uuid) ||
      getCubeAt(lastPointerPos.current.x, lastPointerPos.current.y)

    if (uuid && cube && !flagged.has(uuid) && !revealed.has(uuid)) {
      if (cube.isMine) {
        setFlagged((f) => {
          f.add(uuid)
          return new Set(f)
        })
      } else {
        setRevealed((r) => {
          r.add(uuid)
          return new Set(r)
        })
      }
      playSound(spearSound, 0.9, 1.1, 0.7)
      mineStatsStore.setState({
        spears: mineStatsStore.getState().spears - 1,
      })
    }
  }, [activeBoxes, flagged, gridSize, mineCount, revealed, getCubeAt])

  // reset stats: spears
  useEffect(() => {
    mineStatsStore.setState({ spears: spearCounts[gridSize] })
    camera.position.set(
      gridSize * 0.4 + 2,
      gridSize * 0.4 + 2,
      gridSize * 0.4 + 2,
    )
  }, [gridSize, camera])

  // reset stats: mine count
  useEffect(() => {
    mineStatsStore.setState({ mines: mineCount - flagged.size })
  }, [flagged, mineCount])

  // reset stats: cell count
  useEffect(() => {
    mineStatsStore.setState({
      cells: gridSize * gridSize * gridSize - revealed.size - flagged.size,
    })
  }, [revealed, gridSize, flagged])

  // pointer lock
  useEffect(() => {
    if (orbitMode) return
    const handleFocus = () => controls.current?.lock()
    if (!DEBUG) controls.current?.lock()
    document.addEventListener('click', handleFocus)
    return () => {
      document.removeEventListener('click', handleFocus)
    }
  }, [orbitMode])

  // on use spear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q') onSpearCube()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onSpearCube])

  useMouseInput(
    // on down
    (button: number, x, y) => {
      if (orbitMode) {
        // keeps track of the amount of frames we've kept the pointer down
        // and the position we put it down at
        frameCount.current = 0
        pointerDownPos.current = { x, y }
        return
      }

      const cube = ref.current.boxes.find((b) => b.uuid == activeBoxes[0])
      if (!cube) return playSound(clickErrorSound, 0.9, 1.1, 0.4)

      if (button === 2) {
        onFlagCube(cube)
      } else {
        onRevealCube(cube)
      }
    },
    // on up
    (button, x, y) => {
      // if not orbit mode, mouse up does nothing
      // if frameCount is -1, we've handled a long press action already
      // and should ignore the mouse up
      if (!orbitMode || frameCount.current === -1) return

      frameCount.current = -1

      // ignore if the pointer has moved from its start position
      // to avoid performing actions when you just meant to orbit
      if (getDist(pointerDownPos.current, { x, y }) > 5) return

      const newCube = getCubeAt(x, y)

      if (!newCube) return setActiveBoxes([])

      // if we tap a selected cube, reveal it
      const oldCube = ref.current.boxes.find((b) => b.uuid == activeBoxes[0])

      if (button === 2) {
        onFlagCube(newCube)
      } else {
        if (!oldCube || newCube.uuid !== oldCube.uuid) {
          onSelectCube(newCube)
          return
        }
        onRevealCube(oldCube)
        setActiveBoxes([])
      }
    },
    // on move
    (x, y) => {
      lastPointerPos.current = { x, y }
    },
  )

  useFrame(() => {
    // if not orbit mode, we just select cubes the camera is pointing at,
    // highlighting all adjacent if you stare at them for long enough
    if (!orbitMode) {
      const cube = getCenterCube()
      // counts the number of frames we've kept the same cube in the center of the screen
      if (cube?.uuid === lastUuid.current) {
        frameCount.current++
      } else {
        frameCount.current = 0
        lastUuid.current = cube?.uuid ?? ''
      }
      const highlightAdjacent = frameCount.current >= refreshRate / 3
      if (cube) {
        onSelectCube(cube, highlightAdjacent)
      } else {
        setActiveBoxes([])
      }

      return
    }

    if (frameCount.current === -1) return

    const dist = getDist(lastPointerPos.current, pointerDownPos.current)
    if (dist > 5) {
      frameCount.current = -1
      return
    }

    frameCount.current++

    const { x, y } = lastPointerPos.current
    const newCube = getCubeAt(x, y)

    if (!newCube) return

    const oldCube = ref.current.boxes.find((b) => b.uuid == activeBoxes[0])

    const short = refreshRate / 5
    const long = refreshRate / 2

    if (
      frameCount.current > short &&
      frameCount.current < long &&
      newCube?.uuid !== oldCube?.uuid
    ) {
      // if we are holding down on a cube, select it
      onSelectCube(newCube)
    } else if (frameCount.current >= long) {
      frameCount.current = -1

      onFlagCube(newCube)
      setActiveBoxes([])
    }
  })

  // check win condition
  useEffect(() => {
    if (
      !winCheckTriggered.current &&
      ref.current.boxes.every((b) =>
        b.isMine
          ? flagged.has(b.uuid)
          : revealed.has(b.uuid) && !flagged.has(b.uuid),
      )
    ) {
      winCheckTriggered.current = true
      setTimeout(() => {
        setHasWon(true)
        playSound(winSound)

        setTimeout(() => {
          onGameOver('win')
        }, 1000)
      }, 1000)
    }
  }, [flagged, revealed, onGameOver, hasWon, props])

  const onCollide = useCallback(
    (cube: Cube) => {
      if (cube.isMine) {
        onLose()
      }
    },
    [onLose],
  )

  return (
    <>
      {/* <Skybox /> */}
      <fog attach="fog" args={['#00001c', 1, FOG_DISTANCE]} />
      <directionalLight
        color="#ffffff"
        position={[0, 10, 10]}
        intensity={1.5}
        castShadow
      />
      <directionalLight
        color="#ffffff"
        position={[10, 10, 0]}
        intensity={1}
        castShadow
      />
      <ambientLight color="#404040" intensity={2.5} />
      <Physics
        gravity={[0, -1.7, 0]}
        tolerance={0}
        iterations={50}
        broadphase={'SAP'}
      >
        {!orbitMode && (
          <>
            <Player gridSize={gridSize} />
            <Plane gridSize={gridSize} />
          </>
        )}
        <group ref={groupRef}>
          {ref.current.boxes.map((cube, i) => (
            <Cube
              key={i}
              cube={cube}
              hasWon={hasWon}
              isRevealed={revealed.has(cube.uuid)}
              isFlagged={flagged.has(cube.uuid)}
              isHovered={activeBoxes.includes(cube.uuid)}
              isDimmed={false}
              isSelected={activeBoxes[0] === cube.uuid}
              onCollide={onCollide}
            />
          ))}
        </group>
      </Physics>
      {orbitMode ? (
        <OrbitControls
          enabled
          camera={camera}
          target={new Vector3(0, 0, 0)}
          minDistance={minDistance}
          maxDistance={minDistance + 10}
        />
      ) : (
        // @ts-expect-error pointer lock
        <pointerLockControls ref={controls} args={[camera, gl.domElement]} />
      )}
    </>
  )
}

const spearCounts: Record<number, number> = {
  3: 1,
  4: 2,
  5: 3,
  7: 4,
}

const getDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
  Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)
