import { useBox, Triplet } from '@react-three/cannon'
import { Outlines, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { memo, useRef, useState } from 'react'
import { Mesh, Vector3 } from 'three'

export type Cube = {
  position: Triplet
  isMine: boolean
  uuid: string
  number: number
}
export const Cube = memo(
  (props: {
    cube: Cube
    isHovered?: boolean
    onCollide?: (cube: Cube) => void
  }) => {
    const { position, isMine, uuid } = props.cube
    const isSolid = isMine
    const [isColliding, setIsColliding] = useState(false)
    const [opacity, setOpacity] = useState<string>('0')
    const isHovered = props.isHovered && +opacity > 0.05

    const [cubeRef] = useBox(() => ({
      mass: 1,
      args: [0.5, 0.5, 0.5],
      material: { friction: 1, restitution: 0 },
      position,
      type: 'Static',
      isTrigger: !isSolid,
      onCollide: () => {
        setIsColliding(true)
        props.onCollide?.(props.cube)
      },
      onCollideEnd: () => {
        setIsColliding(false)
      },
    }))

    const textRef = useRef<Mesh>(null)
    useFrame(({ camera }) => {
      if (textRef.current) {
        textRef.current.lookAt(camera.position)
      }
      if (cubeRef.current) {
        const cubePosition = new Vector3(...position)
        const distance = cubePosition.distanceTo(camera.position)
        setOpacity(Math.min(1, Math.max(0, 1 - distance / 7)).toFixed(2))
      }
    })

    return (
      <mesh ref={cubeRef} uuid={uuid} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshLambertMaterial
          opacity={isSolid ? +opacity : 0}
          transparent
          depthTest
          color={isMine ? '#ff0000' : '#0077ff'}
        />
        {!isColliding && (
          <Outlines
            thickness={isHovered ? 5 : isSolid ? 0 : 2}
            color={'#fff'}
            transparent
            opacity={isHovered ? +opacity * 4 : +opacity}
          />
        )}
        {!isSolid && (
          <Text
            ref={textRef}
            position={[0, 0, 0]}
            fontSize={0.2}
            fillOpacity={+opacity}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {props.cube.number}
          </Text>
        )}
      </mesh>
    )
  },
)
