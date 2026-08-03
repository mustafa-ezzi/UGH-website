import { useMemo, useRef, useEffect } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useHeroProgress } from '../store/heroProgress'

type DustFieldProps = {
  count: number
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/**
 * Taheri-style precision dust:
 * — soft coalesce, no spring bounce
 * — hover/touch gently parts particles (magnetic displacement), never explodes
 */
export function DustField({ count }: DustFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const progressRef = useRef(0)
  const cursorRef = useRef({ x: 0, y: 0, z: 0, active: 0, targetActive: 0 })
  const dispRef = useRef<Float32Array>(new Float32Array(count * 3))

  const { positions, colors, phases, radii } = useMemo(() => {
    const positionsArr = new Float32Array(count * 3)
    const colorsArr = new Float32Array(count * 3)
    const phasesArr = new Float32Array(count)
    const radiiArr = new Float32Array(count)

    // Gold / ember / steel — closer to jewellery dust than neon sparks
    const gold = new THREE.Color('#d4a84b')
    const paleGold = new THREE.Color('#f0d59a')
    const ember = new THREE.Color('#c45c26')
    const steel = new THREE.Color('#9aa3ab')
    const brass = new THREE.Color('#b8956c')
    const palette = [gold, paleGold, ember, brass, steel, gold]

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const r = 0.8 + Math.random() * 6.8
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 7.2

      positionsArr[i3] = Math.cos(theta) * r
      positionsArr[i3 + 1] = y
      positionsArr[i3 + 2] = Math.sin(theta) * r

      const c = palette[i % palette.length].clone()
      c.offsetHSL(0, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.08)
      colorsArr[i3] = c.r
      colorsArr[i3 + 1] = c.g
      colorsArr[i3 + 2] = c.b

      phasesArr[i] = Math.random() * Math.PI * 2
      radiiArr[i] = r
    }

    return {
      positions: positionsArr,
      colors: colorsArr,
      phases: phasesArr,
      radii: radiiArr,
    }
  }, [count])

  useEffect(() => {
    progressRef.current = useHeroProgress.getState().progress
    return useHeroProgress.subscribe((state) => {
      progressRef.current = state.progress
    })
  }, [])

  useFrame(({ clock }, delta) => {
    const points = pointsRef.current
    if (!points) return

    const pos = points.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const disp = dispRef.current
    const t = clock.elapsedTime
    const p = progressRef.current
    const dt = Math.min(delta, 0.033)

    {/* Keep coalescence soft — no appliance mesh */}
      const coalesce = THREE.MathUtils.smoothstep(p, 0.08, 0.48)
      const orbit = THREE.MathUtils.smoothstep(p, 0.45, 0.72)
      const settle = THREE.MathUtils.smoothstep(p, 0.68, 0.95)

    // Precision: ease cursor influence in/out — no snap
    cursorRef.current.active = lerp(
      cursorRef.current.active,
      cursorRef.current.targetActive,
      1 - Math.exp(-dt * 7),
    )

    const cx = cursorRef.current.x
    const cy = cursorRef.current.y
    const cz = cursorRef.current.z
    const influence = cursorRef.current.active

    const radiusInfluence = 1.65
    const partStrength = 0.55 // gentle part — not shatter

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const phase = phases[i]
      const baseR = radii[i]

      // Quiet ambient drift (Taheri: almost still, slight life)
      const targetR = lerp(baseR, 0.32 + (i % 48) * 0.01, coalesce)
      const swirl = t * (0.035 + (i % 9) * 0.003) + phase
      const orbitBoost = 1 + orbit * 0.22
      const r = targetR * orbitBoost * (1 - settle * 0.12)

      const breathe = Math.sin(t * 0.28 + phase) * (0.035 + (1 - coalesce) * 0.09)
      const ySpread = lerp((i % 50) / 50 - 0.5, ((i % 17) / 17 - 0.5) * 0.32, coalesce)

      const baseX = Math.cos(swirl) * r + Math.cos(t * 0.11 + phase) * breathe
      const baseY = ySpread * lerp(6.2, 1.35, coalesce) + Math.sin(t * 0.19 + phase) * 0.035
      const baseZ = Math.sin(swirl) * r + Math.sin(t * 0.1 + phase) * breathe

      // Soft radial part around cursor (falloff², critically damped return)
      let dx = 0
      let dy = 0
      let dz = 0
      if (influence > 0.01) {
        const ox = baseX + disp[i3] - cx
        const oy = baseY + disp[i3 + 1] - cy
        const oz = baseZ + disp[i3 + 2] - cz
        const dist = Math.sqrt(ox * ox + oy * oy + oz * oz) + 0.001
        if (dist < radiusInfluence) {
          const fall = 1 - dist / radiusInfluence
          const push = fall * fall * partStrength * influence
          dx = (ox / dist) * push
          dy = (oy / dist) * push
          dz = (oz / dist) * push
        }
      }

      // Critically damped displacement toward target offset (no bounce)
      const smooth = 1 - Math.exp(-dt * 9)
      disp[i3] = lerp(disp[i3], dx, smooth)
      disp[i3 + 1] = lerp(disp[i3 + 1], dy, smooth)
      disp[i3 + 2] = lerp(disp[i3 + 2], dz, smooth)

      // Direct position blend — no velocity spring
      const follow = 1 - Math.exp(-dt * 5.5)
      arr[i3] = lerp(arr[i3], baseX + disp[i3], follow)
      arr[i3 + 1] = lerp(arr[i3 + 1], baseY + disp[i3 + 1], follow)
      arr[i3 + 2] = lerp(arr[i3 + 2], baseZ + disp[i3 + 2], follow)
    }

    pos.needsUpdate = true
    points.rotation.y = t * 0.008 + p * 0.22
  })

  function setCursor(event: ThreeEvent<PointerEvent>, active: number) {
    cursorRef.current.x = event.point.x
    cursorRef.current.y = event.point.y
    cursorRef.current.z = event.point.z
    cursorRef.current.targetActive = active
  }

  return (
    <group>
      <mesh
        position={[0, 0, 0.35]}
        onPointerMove={(e) => {
          e.stopPropagation()
          setCursor(e, 1)
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          setCursor(e, 1)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          cursorRef.current.targetActive = 0.35
        }}
        onPointerLeave={() => {
          cursorRef.current.targetActive = 0
        }}
      >
        <planeGeometry args={[14, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          vertexColors
          transparent
          opacity={0.82}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
