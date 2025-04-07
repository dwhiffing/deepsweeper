import { useBox, Triplet } from '@react-three/cannon'
import { Outlines } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { memo, useMemo, useRef, useState } from 'react'
import { CanvasTexture, Mesh, MeshBasicMaterial } from 'three'
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
    const isHovered = props.isHovered

    const isEmpty = props.isRevealed && props.cube.number === 0 && !isMine
    const size = isEmpty ? 0.175 : 0.5
    const [cubeRef] = useBox(() => ({
      mass: 1,
      args: [size, size, size],
      material: { friction: 1, restitution: 0 },
      position,
      type: 'Static',
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
    })

    const outlineOpacity = isHovered || props.isSelected ? 1 : 0.3
    const materials = useMemo(() => {
      const map = createTextTexture(
        `${props.cube.number}`,
        !!props.isRevealed,
        !!props.isFlagged,
        isMine,
      )

      return new Array(6).fill('').map(() => new MeshBasicMaterial({ map }))
    }, [props.cube.number, props.isFlagged, props.isRevealed, isMine])

    return (
      <mesh ref={cubeRef} uuid={uuid} castShadow>
        <boxGeometry args={[size, size, size]} />

        {/* @ts-expect-error materials */}
        <meshBasicMaterial attach="material" args={materials} fog={true} />
        {!isColliding && (
          <AnimatedOutlines
            thickness={props.isSelected || props.isHovered ? 6 : 2}
            color={props.isSelected ? '#ff0' : '#fff'}
            opacity={outlineOpacity}
          />
        )}
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

function createTextTexture(
  text: string,
  isRevealed: boolean,
  isFlagged: boolean,
  isMine: boolean,
) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = isFlagged
    ? '#100'
    : isRevealed
    ? isMine
      ? '#f00'
      : COLORS[text as keyof typeof COLORS] ?? '#000'
    : '#000011'
  ctx.fillRect(0, 0, size, size)

  if (text !== '0' && isRevealed) {
    ctx.font = 'bold 28px sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, size / 2, size / 2)
  }

  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// 26 is max possible
const COLORS = {
  '0': '#001100',
  '1': '#000044',
  '2': '#004400',
  '3': '#444400',
  '4': '#440044',
  '5': '#440000',
  '6': '#004444',
}
