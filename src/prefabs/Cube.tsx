import * as THREE from 'three'
import { useBox } from '@react-three/cannon'
import { LineSegments } from 'three'
import { useEffect, useRef } from 'react'
import { Triplet } from '@react-three/cannon'

export const Cube = (props: {
  position: Triplet
  isSolid?: boolean
  isMine: boolean
  onCollide: () => void
}) => {
  const { position, isSolid = true } = props
  const [cubeRef] = useBox(() => ({
    mass: 1,
    args: [0.5, 0.5, 0.5],
    material: { friction: 1, restitution: 0 },
    position,
    type: 'Static',
    isTrigger: !isSolid,
    onCollide: props.onCollide,
  }))

  const dashedRef = useRef<LineSegments>(null!)

  useEffect(() => {
    if (dashedRef.current) {
      dashedRef.current.computeLineDistances()
    }
  }, [])

  if (!isSolid) {
    return (
      <lineSegments ref={dashedRef} position={position}>
        <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.5, 0.5)]} />
        <lineDashedMaterial color="white" dashSize={0.1} gapSize={0.1} />
      </lineSegments>
    )
  }

  return (
    <mesh ref={cubeRef} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshLambertMaterial color={props.isMine ? '#ff0000' : '#0077ff'} />
    </mesh>
  )
}
