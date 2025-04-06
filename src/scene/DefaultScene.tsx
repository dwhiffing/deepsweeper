import { useCallback, useEffect, useRef, useState } from 'react'
import { Physics, Triplet } from '@react-three/cannon'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { Plane } from '../prefabs/Plane'
import { Player } from '../prefabs/Player'
import { Cube } from '../prefabs/Cube'
import { Group, Raycaster, Vector2 } from 'three'
import { v4 as uuidv4 } from 'uuid'
import { useMouseInput } from '../hooks/useMouseInput'

extend({ PointerLockControls })

const gridSize = 5
const sp = 2
const getBoxes = () => {
  const boxes = []

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        boxes.push({
          uuid: uuidv4(),
          position: [
            x * sp - gridSize / 2 + 0.5,
            y * sp - gridSize / 2 + 0.5 + 4,
            z * sp - gridSize / 2 + 0.5,
          ] as Triplet,
          number: 4,
          revealed: false,
          isMine: Math.random() <= 0.1,
        })
      }
    }
  }
  return boxes as Cube[]
}

export const DefaultScene = (props: { onGameOver: () => void }) => {
  const { camera, gl } = useThree()
  const controls = useRef<PointerLockControls>(null)
  const [boxes, setBoxes] = useState(getBoxes())
  const [activeBox, setActiveBox] = useState<string | null>(null)
  const groupRef = useRef<Group>(null)

  useEffect(() => {
    controls.current?.lock()
  }, [])

  useMouseInput(() => {
    setBoxes((b) =>
      b.map((_b) =>
        _b.uuid === activeBox ? { ..._b, number: _b.number - 1 } : _b,
      ),
    )
  })

  useFrame(({ camera }) => {
    if (groupRef.current) {
      const raycaster = new Raycaster()
      raycaster.setFromCamera(new Vector2(0, 0), camera) // center of screen
      const intersects = raycaster.intersectObjects(groupRef.current.children)
      setActiveBox(intersects[0]?.object.uuid ?? '')
    }
  })

  const onGameOver = props.onGameOver
  const onCollide = useCallback(
    (cube: Cube) => {
      if (cube.isMine) onGameOver()
    },
    [onGameOver],
  )

  return (
    <>
      {/* <Skybox /> */}
      {/* @ts-expect-error pointer lock */}
      <pointerLockControls ref={controls} args={[camera, gl.domElement]} />
      <directionalLight
        color="#ffffff"
        position={[10, 10, 10]}
        intensity={0.5}
        castShadow
      />
      <ambientLight color="#404040" intensity={0.6} />
      <Physics
        gravity={[0, -1.5, 0]}
        tolerance={0}
        iterations={50}
        broadphase={'SAP'}
      >
        <Player />
        <Plane />
        <group ref={groupRef}>
          {boxes.map((cube, i) => (
            <Cube
              key={i}
              cube={cube}
              isHovered={cube.uuid === activeBox}
              onCollide={onCollide}
            />
          ))}
        </group>
      </Physics>
    </>
  )
}
