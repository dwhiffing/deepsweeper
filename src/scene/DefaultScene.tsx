import { useCallback, useEffect, useRef, useState } from 'react'
import { Physics } from '@react-three/cannon'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { Plane } from '../prefabs/Plane'
import { Player } from '../prefabs/Player'
import { Cube } from '../prefabs/Cube'
import { Group, Raycaster, Vector2 } from 'three'
import { useMouseInput } from '../hooks/useMouseInput'
import { getAdjacent, getBoxes } from '../utils'
import { DEBUG, FOG_DISTANCE } from '../utils/constants'
import {
  clickSound,
  clickSound2,
  explosionSound,
  flagSound,
  playSound,
} from '../utils/audio'

extend({ PointerLockControls })

export const DefaultScene = (props: {
  onGameOver: (state: string) => void
  gridSize: number
  mineCount: number
  spacing: number
}) => {
  const { camera, gl } = useThree()
  const controls = useRef<PointerLockControls>(null)
  const ref = useRef(getBoxes(props.gridSize, props.mineCount, props.spacing))
  const boxes = ref.current.boxes
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [activeBoxes, setActiveBoxes] = useState<string[]>([])
  const [hasWon, setHasWon] = useState(false)
  const groupRef = useRef<Group>(null)

  // pointer lock
  useEffect(() => {
    const handleFocus = () => controls.current?.lock()
    if (!DEBUG) controls.current?.lock()
    document.addEventListener('click', handleFocus)
    return () => {
      document.removeEventListener('click', handleFocus)
    }
  }, [])

  // on click
  useMouseInput((button: number) => {
    const uuid = activeBoxes[0]
    const cube = boxes.find((b) => b.uuid == uuid)

    if (!uuid) {
      playSound(clickSound2, 0.7, 1.2)
      return
    }

    // if right click, flag cube
    if (button === 2) {
      // if cube is already revealed, we cant flag it
      if (revealed.has(uuid)) return

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

    // if you reveal a mine, you lose
    if (cube?.isMine) {
      playSound(explosionSound)
      setTimeout(() => {
        props.onGameOver('lose')
      }, 500)
      setRevealed((r) => {
        r.add(uuid)
        return new Set(r)
      })
      return
    }

    // if you try to reveal a flagged cube, bail
    if (flagged.has(uuid)) return

    // if you reveal a revealed cube that is marked 0, reveal all adjacent
    if (revealed.has(uuid) && cube && cube.number === 0) {
      playSound(clickSound, 0.7, 1.2)
      const neighbors = getAdjacent(cube, ref.current.cubeMap)
      setRevealed((r) => {
        neighbors.forEach((n) => {
          if (!flagged.has(n.uuid)) r.add(n.uuid)
        })
        return new Set(r)
      })
    } else if (!revealed.has(uuid)) {
      playSound(clickSound, 0.7, 1.2)
      // else just reveal that cube
      setRevealed((r) => {
        r.add(uuid)
        return new Set(r)
      })
    } else {
      playSound(clickSound2, 0.7, 1.2)
    }
  })

  // on frame
  useFrame(({ camera }) => {
    if (!groupRef.current) return
    const raycaster = new Raycaster()
    raycaster.setFromCamera(new Vector2(0, 0), camera) // center of screen
    const intersects = raycaster.intersectObjects(groupRef.current.children)
    // highlights all cubes adjacent to the hovered cube
    const uuid = intersects[0]?.object.uuid ?? ''
    const cube = boxes.find((b) => b.uuid == uuid)
    const adjacent = cube ? getAdjacent(cube, ref.current.cubeMap) : []
    const ids = [uuid, ...adjacent.map((c) => c.uuid)]
    if (activeBoxes.join(':') !== ids.join(':')) {
      setActiveBoxes(ids.filter(Boolean))
    }
  })

  // check win condition
  useEffect(() => {
    if (
      boxes.every((b) =>
        b.isMine
          ? flagged.has(b.uuid)
          : revealed.has(b.uuid) && !flagged.has(b.uuid),
      )
    ) {
      setHasWon(true)
      setTimeout(() => {
        props.onGameOver('win')
      }, 1000)
    }
  }, [flagged, revealed, boxes, props])

  const onGameOver = props.onGameOver
  const onCollide = useCallback(
    (cube: Cube) => {
      if (cube.isMine) {
        playSound(explosionSound)
        onGameOver('lose')
      }
    },
    [onGameOver],
  )

  return (
    <>
      {/* <Skybox /> */}
      <fog attach="fog" args={['#001', 1, FOG_DISTANCE]} />
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
        gravity={[0, -1.5, 0]}
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
              isDimmed={
                activeBoxes.length > 0 && !activeBoxes.includes(cube.uuid)
              }
              isSelected={activeBoxes[0] === cube.uuid}
              onCollide={onCollide}
            />
          ))}
        </group>
      </Physics>
    </>
  )
}
