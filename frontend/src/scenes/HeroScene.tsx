import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DustField } from './DustField'
import { useHeroProgress } from '../store/heroProgress'
import { particleBudget } from '../lib/motion'

function CameraRig() {
  const { camera } = useThree()
  const progressRef = useRef(0)

  useEffect(() => {
    progressRef.current = useHeroProgress.getState().progress
    return useHeroProgress.subscribe((state) => {
      progressRef.current = state.progress
    })
  }, [])

  useFrame(() => {
    const p = progressRef.current
    const drift = THREE.MathUtils.smoothstep(p, 0.15, 0.85)

    const radius = THREE.MathUtils.lerp(5.4, 4.6, drift)
    const angle = -0.25 + drift * 0.55
    const height = THREE.MathUtils.lerp(1.45, 1.15, drift)

    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius)
    camera.lookAt(0, 0, 0)
  })

  return null
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.28} color="#c5ccd3" />
      <directionalLight position={[-2.5, 4, 3]} intensity={1.05} color="#fff4ea" />
      <pointLight position={[0, 1.2, 1.5]} intensity={1.1} color="#c45c26" distance={8} />
      <pointLight position={[1.5, -0.5, -1]} intensity={0.5} color="#8a9199" distance={6} />
    </>
  )
}

type HeroSceneProps = {
  className?: string
}

export function HeroScene({ className }: HeroSceneProps) {
  const count = particleBudget()
  if (count === 0) return null

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.45, 5.4], fov: 42, near: 0.1, far: 40 }}
        style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
        onCreated={({ raycaster }) => {
          raycaster.params.Points = { threshold: 0.3 }
        }}
      >
        <color attach="background" args={['#0a0908']} />
        <fog attach="fog" args={['#0a0908', 6, 16]} />
        <Suspense fallback={null}>
          <CameraRig />
          <SceneLights />
          <DustField count={count} />
        </Suspense>
      </Canvas>
    </div>
  )
}
