import { usePlane } from '@react-three/cannon'
import { PlaneGeometry } from 'three'
import { extend } from '@react-three/fiber'

extend({ PlaneGeometry })
export const Plane = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.25, 0],
    material: { friction: 0.1 },
  }))

  return (
    <mesh ref={ref} receiveShadow={true} scale={[100, 100, 100]}>
      <planeGeometry />
      <meshPhongMaterial color={'#666'} />
    </mesh>
  )
}
