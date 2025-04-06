import { useBox, Triplet } from '@react-three/cannon'
import { Outlines, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { memo, useRef, useState } from 'react'
import { Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { FOG_DISTANCE } from '../utils/constants'
import { PulsingLight } from './PulsingLight'

export type Cube = {
  position: Triplet
  x: number
  y: number
  z: number
  revealed: boolean
  isMine: boolean
  uuid: string
  number: number
}
export const Cube = memo(
  (props: {
    cube: Cube
    isHovered?: boolean
    isSelected?: boolean
    isDimmed?: boolean
    isRevealed?: boolean
    isFlagged?: boolean
    onCollide?: (cube: Cube) => void
  }) => {
    const { position, isMine, uuid } = props.cube
    const [isColliding, setIsColliding] = useState(false)
    const [opacity, setOpacity] = useState<string>('0')
    const isHovered = props.isHovered

    const isEmpty = props.isRevealed && props.cube.number === 0 && !isMine
    const size = isEmpty ? 0.175 : 0.5
    const [cubeRef] = useBox(() => ({
      mass: 1,
      args: [size, size, size],
      material: { friction: 1, restitution: 0 },
      position,
      type: 'Static',
      isTrigger: !isEmpty,
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
        setOpacity(
          Math.min(1, Math.max(0, 1 - (distance / FOG_DISTANCE) * 1.2)).toFixed(
            2,
          ),
        )
      }
    })

    const outlineOpacity =
      isHovered || props.isSelected
        ? 1
        : props.isDimmed || isEmpty
        ? +opacity / 2
        : +opacity

    const text =
      !props.isFlagged && props.isRevealed && props.cube.number !== 0
        ? props.cube.number
        : ''

    return (
      <mesh ref={cubeRef} uuid={uuid} castShadow>
        <boxGeometry args={[size, size, size]} />
        <meshLambertMaterial
          opacity={(isMine && props.isRevealed) || isEmpty ? 1 : 0}
          transparent
          depthTest
          color={isMine ? '#ff0000' : '#3aa'}
        />
        {!isColliding && (
          <Outlines
            thickness={props.isSelected ? 6 : 2}
            color={props.isSelected ? '#ff0' : '#fff'}
            transparent
            opacity={outlineOpacity}
          />
        )}
        <Text
          ref={textRef}
          position={[0, 0, 0]}
          fontSize={0.2}
          material={new MeshBasicMaterial({ fog: false })}
          fillOpacity={!props.isRevealed && isHovered ? 1 : +opacity}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
        {props.isFlagged && <PulsingLight />}
      </mesh>
    )
  },
)
