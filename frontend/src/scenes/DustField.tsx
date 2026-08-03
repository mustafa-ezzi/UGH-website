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

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x))
}

/** Smooth pulse that peaks in the middle of [a, b]. */
function pulse(p: number, a: number, b: number) {
  if (p <= a || p >= b) return 0
  const t = (p - a) / (b - a)
  return Math.sin(t * Math.PI)
}

/** Ease into a form between [a, b], hold until holdEnd, then release. */
function formWeight(p: number, a: number, b: number, holdEnd: number) {
  if (p < a) return 0
  if (p < b) return THREE.MathUtils.smoothstep(p, a, b)
  if (p < holdEnd) return 1
  return 1 - THREE.MathUtils.smoothstep(p, holdEnd, holdEnd + 0.06)
}

/**
 * Scroll-driven dust:
 * cloud → merge into irregular forms → blast apart → remesh → blast → settle.
 * Shapes stay organic (noise + warped surfaces), not perfect primitives.
 */
export function DustField({ count }: DustFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const progressRef = useRef(0)
  const cursorRef = useRef({ x: 0, y: 0, z: 0, active: 0, targetActive: 0 })
  const dispRef = useRef<Float32Array>(new Float32Array(count * 3))
  const velRef = useRef<Float32Array>(new Float32Array(count * 3))

  const data = useMemo(() => {
    const cloud = new Float32Array(count * 3)
    const sphere = new Float32Array(count * 3)
    const torus = new Float32Array(count * 3)
    const flame = new Float32Array(count * 3)
    const jewel = new Float32Array(count * 3)
    const helix = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const seeds = new Float32Array(count * 4)

    const gold = new THREE.Color('#d4a84b')
    const paleGold = new THREE.Color('#f0d59a')
    const ember = new THREE.Color('#c45c26')
    const steel = new THREE.Color('#9aa3ab')
    const brass = new THREE.Color('#b8956c')
    const flameTip = new THREE.Color('#e8a05c')
    const palette = [gold, paleGold, ember, brass, steel, flameTip, gold]

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const u = i / count
      const rnd = () => Math.random()

      // Per-particle personality
      seeds[i * 4] = rnd()
      seeds[i * 4 + 1] = rnd()
      seeds[i * 4 + 2] = rnd()
      seeds[i * 4 + 3] = rnd()
      phases[i] = rnd() * Math.PI * 2

      const s0 = seeds[i * 4]
      const s1 = seeds[i * 4 + 1]
      const s2 = seeds[i * 4 + 2]
      const s3 = seeds[i * 4 + 3]

      // --- Cloud (scattered ambient) ---
      const cr = 1.2 + s0 * 7.4
      const cTheta = s1 * Math.PI * 2
      const cY = (s2 - 0.5) * 7.8
      cloud[i3] = Math.cos(cTheta) * cr * (0.7 + s3 * 0.6)
      cloud[i3 + 1] = cY
      cloud[i3 + 2] = Math.sin(cTheta) * cr * (0.55 + s0 * 0.7)

      // --- Warped sphere / pebble cluster ---
      const phi = Math.acos(2 * s0 - 1)
      const theta = s1 * Math.PI * 2
      const warp =
        1 +
        0.22 * Math.sin(phi * 3 + s2 * 6) +
        0.14 * Math.cos(theta * 5 + s3 * 4) +
        0.08 * Math.sin((s0 + s1) * 18)
      const sr = (1.15 + s2 * 0.55) * warp
      sphere[i3] = Math.sin(phi) * Math.cos(theta) * sr
      sphere[i3 + 1] = Math.cos(phi) * sr * (0.85 + s3 * 0.35)
      sphere[i3 + 2] = Math.sin(phi) * Math.sin(theta) * sr

      // --- Irregular torus / ring of sparks ---
      const R = 1.85 + s0 * 0.35
      const rTube = 0.35 + s1 * 0.55
      const a = s2 * Math.PI * 2
      const b = s3 * Math.PI * 2
      const wobble = 0.18 * Math.sin(a * 3 + s1 * 8)
      torus[i3] = (R + rTube * Math.cos(b) + wobble) * Math.cos(a)
      torus[i3 + 1] = rTube * Math.sin(b) * 1.15 + Math.sin(a * 2) * 0.25
      torus[i3 + 2] = (R + rTube * Math.cos(b) + wobble) * Math.sin(a)

      // --- Flame / spindle plume ---
      const fy = (s0 - 0.08) * 3.6
      const fSpread = (0.15 + (1 - Math.abs(fy) / 3.6) * 1.1) * (0.4 + s1)
      const fAng = s2 * Math.PI * 2
      const twist = fy * 1.4 + s3 * 4
      flame[i3] = Math.cos(fAng + twist) * fSpread * (0.7 + 0.4 * Math.sin(fy * 2))
      flame[i3 + 1] = fy
      flame[i3 + 2] = Math.sin(fAng + twist) * fSpread * (0.55 + s0 * 0.5)

      // --- Faceted jewel / octahedron-ish ---
      const jAxes = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ]
      const face = jAxes[i % 6]
      const jNoise = (s0 - 0.5) * 0.45
      const jScale = 1.35 + s1 * 0.5
      jewel[i3] = (face[0] + (s1 - 0.5) * 0.9 + jNoise) * jScale
      jewel[i3 + 1] = (face[1] + (s2 - 0.5) * 0.9) * jScale * 1.15
      jewel[i3 + 2] = (face[2] + (s3 - 0.5) * 0.9 - jNoise * 0.5) * jScale

      // --- Rising helix / vortex ---
      const hy = (u - 0.5) * 4.2 + (s0 - 0.5) * 0.6
      const hR = 0.55 + s1 * 1.1 + Math.sin(hy * 1.8) * 0.35
      const hAng = hy * 2.8 + s2 * Math.PI * 2
      helix[i3] = Math.cos(hAng) * hR
      helix[i3 + 1] = hy
      helix[i3 + 2] = Math.sin(hAng) * hR

      const c = palette[i % palette.length].clone()
      c.offsetHSL(0, (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.1)
      colors[i3] = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b
    }

    return { cloud, sphere, torus, flame, jewel, helix, colors, phases, seeds }
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
    const vel = velRef.current
    const t = clock.elapsedTime
    const p = progressRef.current
    const dt = Math.min(delta, 0.033)

    const { cloud, sphere, torus, flame, jewel, helix, phases, seeds } = data

    // Form weights across the hero scroll
    const wSphere = formWeight(p, 0.06, 0.16, 0.2)
    const wTorus = formWeight(p, 0.34, 0.44, 0.48)
    const wFlame = formWeight(p, 0.56, 0.66, 0.7)
    const wHelix = formWeight(p, 0.72, 0.8, 0.84)
    const wJewel = THREE.MathUtils.smoothstep(p, 0.86, 0.96)

    // Blast peaks between forms — particles explode outward then return
    const blast =
      pulse(p, 0.18, 0.34) * 1 +
      pulse(p, 0.46, 0.58) * 1.15 +
      pulse(p, 0.68, 0.78) * 0.9 +
      pulse(p, 0.82, 0.9) * 0.55

    const formSum = wSphere + wTorus + wFlame + wHelix + wJewel
    const wCloud = Math.max(0, 1 - formSum) * (1 - blast * 0.35)

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
    const partStrength = 0.55

    const follow = 1 - Math.exp(-dt * (4.2 + formSum * 2.5))
    const blastFollow = 1 - Math.exp(-dt * 3.2)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const phase = phases[i]
      const s0 = seeds[i * 4]
      const s1 = seeds[i * 4 + 1]
      const s2 = seeds[i * 4 + 2]
      const s3 = seeds[i * 4 + 3]

      // Blend shape targets
      let tx =
        cloud[i3] * wCloud +
        sphere[i3] * wSphere +
        torus[i3] * wTorus +
        flame[i3] * wFlame +
        helix[i3] * wHelix +
        jewel[i3] * wJewel
      let ty =
        cloud[i3 + 1] * wCloud +
        sphere[i3 + 1] * wSphere +
        torus[i3 + 1] * wTorus +
        flame[i3 + 1] * wFlame +
        helix[i3 + 1] * wHelix +
        jewel[i3 + 1] * wJewel
      let tz =
        cloud[i3 + 2] * wCloud +
        sphere[i3 + 2] * wSphere +
        torus[i3 + 2] * wTorus +
        flame[i3 + 2] * wFlame +
        helix[i3 + 2] * wHelix +
        jewel[i3 + 2] * wJewel

      // Normalize if weights sum > 1 from overlapping forms
      const wNorm = wCloud + formSum
      if (wNorm > 1.001) {
        tx /= wNorm
        ty /= wNorm
        tz /= wNorm
      }

      // Living micro-motion (stronger in cloud, quieter when formed)
      const life = 0.04 + (1 - clamp01(formSum)) * 0.12
      tx += Math.cos(t * (0.35 + s0) + phase) * life
      ty += Math.sin(t * (0.28 + s1) + phase) * life * 0.85
      tz += Math.sin(t * (0.31 + s2) + phase) * life

      // Blast: push radially from center with per-particle variance
      if (blast > 0.01) {
        const len = Math.sqrt(tx * tx + ty * ty + tz * tz) + 0.0001
        const outward = 1.2 + s3 * 3.8 + (i % 7) * 0.15
        const chaos = Math.sin(phase * 3 + t * 2.2 + s0 * 10) * 0.55
        const bx = (tx / len) * outward + Math.cos(phase + t) * chaos
        const by = (ty / len) * outward * 0.75 + Math.sin(phase * 1.7) * chaos
        const bz = (tz / len) * outward + Math.sin(phase + t * 1.3) * chaos
        tx = lerp(tx, bx, blast)
        ty = lerp(ty, by, blast)
        tz = lerp(tz, bz, blast)

        // Impulse velocity for snappier shatter feel
        vel[i3] += (bx - arr[i3]) * blast * dt * 8
        vel[i3 + 1] += (by - arr[i3 + 1]) * blast * dt * 8
        vel[i3 + 2] += (bz - arr[i3 + 2]) * blast * dt * 8
      } else {
        // Dampen residual shatter velocity when reforming
        vel[i3] *= Math.exp(-dt * 6)
        vel[i3 + 1] *= Math.exp(-dt * 6)
        vel[i3 + 2] *= Math.exp(-dt * 6)
      }

      // Soft cursor parting (desktop)
      let dx = 0
      let dy = 0
      let dz = 0
      if (influence > 0.01) {
        const ox = tx + disp[i3] - cx
        const oy = ty + disp[i3 + 1] - cy
        const oz = tz + disp[i3 + 2] - cz
        const dist = Math.sqrt(ox * ox + oy * oy + oz * oz) + 0.001
        if (dist < radiusInfluence) {
          const fall = 1 - dist / radiusInfluence
          const push = fall * fall * partStrength * influence
          dx = (ox / dist) * push
          dy = (oy / dist) * push
          dz = (oz / dist) * push
        }
      }

      const smooth = 1 - Math.exp(-dt * 9)
      disp[i3] = lerp(disp[i3], dx, smooth)
      disp[i3 + 1] = lerp(disp[i3 + 1], dy, smooth)
      disp[i3 + 2] = lerp(disp[i3 + 2], dz, smooth)

      const blend = blast > 0.2 ? blastFollow : follow
      arr[i3] = lerp(arr[i3], tx + disp[i3] + vel[i3] * 0.08, blend)
      arr[i3 + 1] = lerp(arr[i3 + 1], ty + disp[i3 + 1] + vel[i3 + 1] * 0.08, blend)
      arr[i3 + 2] = lerp(arr[i3 + 2], tz + disp[i3 + 2] + vel[i3 + 2] * 0.08, blend)
    }

    pos.needsUpdate = true

    // Slow tumble + blast spin kick
    const mat = points.material as THREE.PointsMaterial
    mat.size = 0.018 + blast * 0.012 + formSum * 0.006
    mat.opacity = 0.72 + formSum * 0.14 + blast * 0.08

    points.rotation.y = t * 0.06 + p * 0.55 + blast * 0.35
    points.rotation.x = Math.sin(t * 0.12) * 0.04 + blast * 0.08
  })

  function setCursor(event: ThreeEvent<PointerEvent>, active: number) {
    if (event.pointerType === 'touch') return
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
          if (e.pointerType === 'touch') return
          e.stopPropagation()
          setCursor(e, 1)
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') return
          e.stopPropagation()
          setCursor(e, 1)
        }}
        onPointerUp={(e) => {
          if (e.pointerType === 'touch') return
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
          <bufferAttribute attach="attributes-position" args={[data.cloud, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
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
