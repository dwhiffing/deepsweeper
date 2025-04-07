import { useBox, Triplet } from '@react-three/cannon'
import { Outlines, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { memo, useMemo, useRef, useState } from 'react'
import {
  BoxGeometry,
  EdgesGeometry,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
} from 'three'
import { useSpring } from '@react-spring/three'
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
    hasWon?: boolean
    isRevealed?: boolean
    isFlagged?: boolean
    onCollide?: (cube: Cube) => void
  }) => {
    const { position, isMine, uuid } = props.cube
    const [isColliding, setIsColliding] = useState(false)
    const [opacity, setOpacity] = useState<string>('1')
    const isHovered = props.isHovered

    const isEmpty = props.isRevealed && props.cube.number === 0 && !isMine
    const size = isEmpty ? 0.175 : 0.5
    const [cubeRef] = useBox(() => ({
      mass: 1,
      args: [size, size, size],
      material: { friction: 1, restitution: 0 },
      position,
      type: 'Static',
      // isTrigger: !props.isRevealed || props.cube.number !== 0,
      isTrigger: false,
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
      if (!props.isRevealed || props.cube.number === 0) return
      if (textRef.current) {
        textRef.current.lookAt(camera.position)
      }
      // if (cubeRef.current) {
      //   const cubePosition = new Vector3(...position)
      //   const distance = cubePosition.distanceTo(camera.position)
      //   setOpacity(clamp(1 - (distance / FOG_DISTANCE) * 0.8, 0, 1).toFixed(2))
      // }
    })

    const outlineOpacity =
      isHovered || props.isSelected
        ? +opacity * 20
        : props.isDimmed || isEmpty
        ? clamp(+opacity, 0.05, 0.08)
        : props.isRevealed
        ? clamp(+opacity, 0, 0.6)
        : clamp(+opacity, 0, 0.2)

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
          <AnimatedOutlines
            thickness={props.isSelected ? 6 : 2}
            color={props.isSelected ? '#ff0' : '#fff'}
            opacity={outlineOpacity}
          />
        )}
        <Text
          ref={textRef}
          position={[0, 0, 0]}
          fontSize={0.2}
          material={new MeshBasicMaterial({ fog: false })}
          fillOpacity={props.isRevealed && isHovered ? +opacity * 20 : +opacity}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
        {props.isFlagged && (
          <PulsingLight color={props.hasWon ? '#0a0' : '#a00'} />
        )}
      </mesh>
    )
  },
)

const clamp = (number: number, min: number, max: number) =>
  Math.max(min, Math.min(number, max))

function AnimatedOutlines(props: {
  color: string
  thickness: number
  opacity: number
}) {
  const [_opacity, setOpacity] = useState('0')
  const springProps = useSpring({
    opacity: props.opacity,
    config: { tension: 310, friction: 50 },
  })

  useFrame(() => {
    setOpacity(clamp(springProps.opacity.get(), 0, 1).toFixed(1))
  })

  return (
    <Outlines
      transparent
      thickness={props.thickness}
      color={props.color}
      opacity={+_opacity}
    />
  )
}

