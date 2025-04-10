import { usePlane } from '@react-three/cannon'
import { PlaneGeometry } from 'three'
import { extend } from '@react-three/fiber'
import { mineSize, mineSpacing } from '../utils/constants'

extend({ PlaneGeometry })
export const Plane = (props: { gridSize: number }) => {
  const y = ((props.gridSize * mineSize + mineSpacing) / 2 + mineSize) * -1
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, y, 0],
    material: { friction: 0.1 },
  }))

  return (
    <mesh ref={ref} receiveShadow={true} scale={[100, 100, 100]}>
      <planeGeometry />
      <meshBasicMaterial color="#00001c" />
    </mesh>
  )
}
