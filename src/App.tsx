import { Canvas } from '@react-three/fiber'
import { Crosshair } from './components/Crosshair'
import { UI } from './components/UI'
import { DefaultScene } from './scene/DefaultScene'
import './index.css'

export default function App() {
  return (
    <>
      <UI>
        <Crosshair />
      </UI>
      <Canvas style={{ backgroundColor: '#111' }}>
        <DefaultScene />
      </Canvas>
    </>
  )
}
