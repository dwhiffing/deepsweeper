import { useEffect, useRef, useState } from 'react'
import { Physics } from '@react-three/cannon'
import { extend, useThree } from '@react-three/fiber'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { Plane } from '../prefabs/Plane'
import { Player } from '../prefabs/Player'
import { Cube } from '../prefabs/Cube'

extend({ PointerLockControls })

const gridSize = 5
const sp = 2
const getBoxes = () => {
  const boxes = []

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        boxes.push({
          x: x * sp - gridSize / 2 + 0.5,
          y: y * sp - gridSize / 2 + 0.5 + 4,
          z: z * sp - gridSize / 2 + 0.5,
          revealed: false,
          isMine: Math.random() <= 0.1,
        })
      }
    }
  }
  return boxes
}

export const DefaultScene = () => {
  const { camera, gl } = useThree()
  const controls = useRef<PointerLockControls>(null)
  const [boxes] = useState(getBoxes())

  // useEffect(() => {
  // camera.layers.enable(0)
  // camera.layers.enable(1)
  // }, [camera])

  useEffect(() => {
    const handleFocus = () => {
      controls.current?.lock()
    }
    document.addEventListener('click', handleFocus)

    return () => {
      document.removeEventListener('click', handleFocus)
    }
  }, [gl])

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
        {boxes.map((cube, i) => (
          <Cube
            key={i}
            position={[cube.x, cube.y, cube.z]}
            isMine={cube.isMine}
            isSolid={cube.isMine}
            onCollide={() => {
              console.log(cube.isMine)
            }}
          />
        ))}
      </Physics>
    </>
  )
}
