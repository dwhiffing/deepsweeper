import { useCallback, useEffect, useRef, useState } from 'react'
import { Physics } from '@react-three/cannon'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { Plane } from '../prefabs/Plane'
import { Player } from '../prefabs/Player'
import { Cube } from '../prefabs/Cube'
import { Group, Raycaster, Vector2 } from 'three'
import { useMouseInput } from '../hooks/useMouseInput'
import {
  assignMines,
  chunk,
  getAdjacent,
  getBoxes,
  mineStatsStore,
} from '../utils'
import { DEBUG, FOG_DISTANCE } from '../utils/constants'
import {
  clickSound,
  clickSound2,
  explosionSound,
  flagSound,
  playSound,
  spearSound,
  winSound,
} from '../utils/audio'
import { useRefreshRate } from '../hooks/useRefreshRate'

extend({ PointerLockControls })

export const DefaultScene = (props: {
  onGameOver: (state: string) => void
  gridSize: number
  mineCount: number
  spacing: number
}) => {
  const { camera, gl } = useThree()
  const controls = useRef<PointerLockControls>(null)
  const ref = useRef(getBoxes(props.gridSize, props.spacing))
  const boxes = ref.current.boxes
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [activeBoxes, setActiveBoxes] = useState<string[]>([])
  const [hasWon, setHasWon] = useState(false)
  const groupRef = useRef<Group>(null)
  const refreshRate = useRefreshRate()

  const onGameOver = props.onGameOver
  const onLose = useCallback(() => {
    playSound(explosionSound)
    setTimeout(() => {
      onGameOver('lose')
    }, 500)
  }, [onGameOver])

  // reset stats: spears
  useEffect(() => {
    mineStatsStore.setState({ spears: 1 })
  }, [])

  // reset stats: mine count
  useEffect(() => {
    mineStatsStore.setState({ mines: props.mineCount - flagged.size })
  }, [flagged, props.mineCount])

  // reset stats: cell count
  useEffect(() => {
    mineStatsStore.setState({
      cells:
        props.gridSize * props.gridSize * props.gridSize -
        revealed.size -
        flagged.size,
    })
  }, [revealed, props.gridSize, flagged])

  // pointer lock
  useEffect(() => {
    const handleFocus = () => controls.current?.lock()
    if (!DEBUG) controls.current?.lock()
    document.addEventListener('click', handleFocus)
    return () => {
      document.removeEventListener('click', handleFocus)
    }
  }, [])

  // on use spear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q') {
        if (mineStatsStore.getState().spears === 0) return

        if (revealed.size === 0) {
          assignMines(
            props.gridSize,
            props.mineCount,
            ref.current.cubeMap,
            activeBoxes[0],
          )
        }

        const uuid = activeBoxes[0]
        const cube = boxes.find((b) => b.uuid == uuid)

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
          mineStatsStore.setState({ spears: 0 })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [flagged, revealed, activeBoxes, boxes, props.mineCount, props.gridSize])

  // on click
  useMouseInput((button: number) => {
    const uuid = activeBoxes[0]
    const cube = boxes.find((b) => b.uuid == uuid)

    if (!uuid || !cube) {
      playSound(clickSound2, 0.9, 1.1, 0.4)
      return
    }

    if (revealed.size === 0) {
      assignMines(
        props.gridSize,
        props.mineCount,
        ref.current.cubeMap,
        activeBoxes[0],
      )
    }

    // if right click, flag cube
    if (button === 2) {
      // if cube is already revealed, we cant flag it
      if (revealed.has(uuid)) {
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

      setFlagged((f) => {
        // toggle flag
        if (f.has(uuid)) {
          playSound(clickSound2)
          f.delete(uuid)
        } else {
          playSound(flagSound)
          f.add(uuid)
        }

        // if all mines are flagged, you win

        return new Set(f)
      })

      return
    }

    // if you try to reveal a flagged cube, bail
    if (flagged.has(uuid)) return

    // if you reveal a mine, you lose
    if (cube?.isMine) {
      onLose()
      setRevealed((r) => {
        r.add(uuid)
        return new Set(r)
      })
      return
    }

    // if you reveal a revealed cube that is marked 0, reveal all adjacent
    if (cube && !revealed.has(uuid)) {
      playSound(clickSound, 0.9, 1.1, 0.35)

      setRevealed((r) => {
        r.add(uuid)
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
      playSound(clickSound2, 0.9, 1.1, 0.4)
    }
  })

  const lastUuid = useRef('')
  const stillFrames = useRef(0)

  useFrame(({ camera }) => {
    if (!groupRef.current) return

    const raycaster = new Raycaster()
    raycaster.setFromCamera(new Vector2(0, 0), camera)
    const intersects = raycaster.intersectObjects(groupRef.current.children)
    const uuid = intersects[0]?.object.uuid ?? ''

    // highlights all cubes adjacent to the hovered cube as long as we've hovered it for about 1 second
    // otherwise just the hovered cube
    if (uuid && uuid === lastUuid.current) {
      stillFrames.current++
    } else {
      stillFrames.current = 0
      lastUuid.current = uuid
    }

    const highlightUuids =
      stillFrames.current >= refreshRate / 3
        ? (() => {
            const cube = boxes.find((b) => b.uuid === uuid)
            const adjacent = cube ? getAdjacent(cube, ref.current.cubeMap) : []
            return [uuid, ...adjacent.map((c) => c.uuid)]
          })()
        : [uuid]

    if (activeBoxes.join(':') !== highlightUuids.join(':')) {
      setActiveBoxes(highlightUuids.filter(Boolean))
    }
  })

  // check win condition
  useEffect(() => {
    if (
      !hasWon &&
      boxes.every((b) =>
        b.isMine
          ? flagged.has(b.uuid)
          : revealed.has(b.uuid) && !flagged.has(b.uuid),
      )
    ) {
      setTimeout(() => {
        setHasWon(true)
        playSound(winSound)

        setTimeout(() => {
          props.onGameOver('win')
        }, 1000)
      }, 1000)
    }
  }, [flagged, revealed, boxes, hasWon, props])

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
      {/* @ts-expect-error pointer lock */}
      <pointerLockControls ref={controls} args={[camera, gl.domElement]} />
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
        <Player gridSize={props.gridSize} />
        <Plane />
        <group ref={groupRef}>
          {boxes.map((cube, i) => (
            <Cube
              key={i}
              cube={cube}
              hasWon={hasWon}
              isRevealed={revealed.has(cube.uuid)}
              isFlagged={flagged.has(cube.uuid)}
              isHovered={activeBoxes.includes(cube.uuid)}
              isDimmed={false}
              // isDimmed={
              //   activeBoxes.length > 0 && !activeBoxes.includes(cube.uuid)
              // }
              isSelected={activeBoxes[0] === cube.uuid}
              onCollide={onCollide}
            />
          ))}
        </group>
      </Physics>
    </>
  )
}
