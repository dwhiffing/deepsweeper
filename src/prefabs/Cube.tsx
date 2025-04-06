import { useBox, Triplet } from '@react-three/cannon'
import { Outlines } from '@react-three/drei'

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

  return (
    <mesh ref={cubeRef} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshLambertMaterial
        opacity={isSolid ? 1 : 0}
        transparent={!isSolid}
        depthTest
        color={props.isMine ? '#ff0000' : '#0077ff'}
      />
      {!isSolid && (
        <Outlines thickness={2} color="#fff" transparent opacity={0.3} />
      )}
    </mesh>
  )
}
