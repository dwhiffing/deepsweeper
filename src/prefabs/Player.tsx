import { useSphere } from '@react-three/cannon'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useKeyboardInput } from '../hooks/useKeyboardInput'
import { useVariable } from '../hooks/useVariable'

/** Player movement constants */
const speed = 20
const jumpSpeed = 2

export const Player = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_sphereRef, api] = useSphere(() => ({
    mass: 100,
    fixedRotation: true,
    position: [10, 0, 10],
    args: [0.2],
    material: { friction: 0 },
  }))

  const pressed = useKeyboardInput(['w', 'a', 's', 'd', ' '])
  const input = useVariable(pressed)

  const { camera } = useThree()

  const state = useRef({
    vel: [0, 0, 0],
    pos: [0, 0, 0],
  })

  useEffect(() => {
    api.velocity.subscribe((v) => (state.current.vel = v))
    api.position.subscribe((v) => (state.current.pos = v))
    camera.lookAt(new Vector3(-10, 10, -10))
  }, [api, camera])

  useFrame((_, delta) => {
    const { w, s, a, d } = input.current
    const space = input.current[' ']

    const velocity = new Vector3(0, 0, 0)
    const cameraDirection = new Vector3()
    camera.getWorldDirection(cameraDirection)

    const forward = new Vector3()
    forward.setFromMatrixColumn(camera.matrix, 0)
    forward.crossVectors(camera.up, forward)

    const right = new Vector3()
    right.setFromMatrixColumn(camera.matrix, 0)

    let [horizontal, vertical] = [0, 0]

    if (w) {
      vertical += 1
    }
    if (s) {
      vertical -= 1
    }
    if (d) {
      horizontal += 1
    }
    if (a) {
      horizontal -= 1
    }

    if (horizontal !== 0 && vertical !== 0) {
      velocity
        .add(forward.clone().multiplyScalar(speed * vertical))
        .add(right.clone().multiplyScalar(speed * horizontal))
      velocity.clampLength(-speed, speed)
    } else if (horizontal !== 0) {
      velocity.add(right.clone().multiplyScalar(speed * horizontal))
    } else if (vertical !== 0) {
      velocity.add(forward.clone().multiplyScalar(speed * vertical))
    }

    api.velocity.set(
      Math.min(speed, (state.current.vel[0] + velocity.x * delta) * 0.94),
      state.current.vel[1],
      Math.min(speed, (state.current.vel[2] + velocity.z * delta) * 0.94),
    )

    camera.position.set(
      state.current.pos[0],
      state.current.pos[1],
      state.current.pos[2],
    )

    if (space) {
      api.velocity.set(state.current.vel[0], jumpSpeed, state.current.vel[2])
    }
  })

  return <></>
}
