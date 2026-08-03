import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useHeroProgress } from '../store/heroProgress'

/** Procedural hob silhouette — forms from dust as scroll progresses. */
export function ApplianceSilhouette() {
  const groupRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    progressRef.current = useHeroProgress.getState().progress
    return useHeroProgress.subscribe((state) => {
      progressRef.current = state.progress
    })
  }, [])

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return

    const p = progressRef.current
    const form = THREE.MathUtils.smoothstep(p, 0.22, 0.52)
    const material = THREE.MathUtils.smoothstep(p, 0.48, 0.72)
    const reveal = THREE.MathUtils.smoothstep(p, 0.65, 0.9)

    group.visible = form > 0.02
    group.scale.setScalar(0.55 + form * 0.55)
    group.rotation.y = -0.35 + material * 0.85 + Math.sin(clock.elapsedTime * 0.25) * 0.03
    group.rotation.x = 0.35 - material * 0.12
    group.position.y = -0.55 + reveal * 0.15

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.opacity = form * (0.55 + material * 0.45)
        child.material.metalness = 0.55 + material * 0.35
        child.material.roughness = 0.45 - material * 0.25
        child.material.emissiveIntensity =
          0.05 + material * 0.35 + Math.sin(clock.elapsedTime * 2) * 0.04
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[2.4, 0.12, 1.45]} />
        <meshStandardMaterial
          color="#2a2d32"
          metalness={0.75}
          roughness={0.35}
          transparent
          opacity={0}
          emissive="#c45c26"
          emissiveIntensity={0.08}
        />
      </mesh>

      <mesh position={[0, -0.05, 0.78]}>
        <boxGeometry args={[2.4, 0.28, 0.12]} />
        <meshStandardMaterial
          color="#1a1c1f"
          metalness={0.7}
          roughness={0.4}
          transparent
          opacity={0}
          emissive="#b8956c"
          emissiveIntensity={0.05}
        />
      </mesh>

      <Burner position={[-0.7, 0.16, 0.25]} />
      <Burner position={[0.7, 0.16, 0.25]} />
      <Burner position={[-0.7, 0.16, -0.35]} scale={0.85} />
      <Burner position={[0.7, 0.16, -0.35]} scale={0.85} />
      <Burner position={[0, 0.16, -0.05]} scale={1.1} />

      {[-0.9, -0.45, 0, 0.45, 0.9].map((x) => (
        <mesh key={x} position={[x, -0.05, 0.86]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
          <meshStandardMaterial
            color="#c5ccd3"
            metalness={0.9}
            roughness={0.2}
            transparent
            opacity={0}
            emissive="#e8a05c"
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <circleGeometry args={[1.8, 48]} />
        <meshBasicMaterial color="#c45c26" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Burner({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.035, 12, 32]} />
        <meshStandardMaterial
          color="#8a9199"
          metalness={0.85}
          roughness={0.3}
          transparent
          opacity={0}
          emissive="#c45c26"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.08, 24]} />
        <meshStandardMaterial
          color="#141210"
          metalness={0.5}
          roughness={0.5}
          transparent
          opacity={0}
          emissive="#e8a05c"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  )
}
