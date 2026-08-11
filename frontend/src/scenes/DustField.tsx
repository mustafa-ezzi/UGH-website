import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useHeroProgress } from '../store/heroProgress'

type DustFieldProps = {
  count: number
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Smooth 0→1→0 pulse between [a, b] — used for explode peaks. */
function explodePulse(p: number, a: number, b: number) {
  if (p <= a || p >= b) return 0
  const t = (p - a) / (b - a)
  return Math.sin(t * Math.PI)
}

/**
 * Steady dust field:
 * — particles rest still (no bounce / ambient wiggle)
 * — scroll cycles: crowd → explode → crowd → explode…
 * — hover / touch gently parts a small local area, then settles back
 */
export function DustField({ count }: DustFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const progressRef = useRef(0)
  const cursorRef = useRef({
    x: 0,
    y: 0,
    z: 0,
    active: 0,
    targetActive: 0,
    isTouch: false,
  })
  const touchStartRef = useRef({ x: 0, y: 0 })
  const dispRef = useRef<Float32Array>(new Float32Array(count * 3))
  const { gl, camera } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const hitPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.35),
    [],
  )
  const hitPoint = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  const data = useMemo(() => {
    const crowded = new Float32Array(count * 3)
    const exploded = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const gold = new THREE.Color('#d4a84b')
    const paleGold = new THREE.Color('#f0d59a')
    const ember = new THREE.Color('#c45c26')
    const steel = new THREE.Color('#9aa3ab')
    const brass = new THREE.Color('#b8956c')
    const flameTip = new THREE.Color('#e8a05c')
    const palette = [gold, paleGold, ember, brass, steel, flameTip, gold]

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const s0 = Math.random()
      const s1 = Math.random()
      const s2 = Math.random()
      const s3 = Math.random()

      // Tight crowded cluster — denser so “crowd again” reads clearly
      const dens = Math.pow(s0, 0.75)
      const r0 = 0.12 + dens * 1.35
      const th0 = s1 * Math.PI * 2
      const ph0 = (s2 - 0.5) * Math.PI * 0.75
      crowded[i3] = Math.cos(th0) * Math.cos(ph0) * r0
      crowded[i3 + 1] = Math.sin(ph0) * r0 * 0.75 + (s3 - 0.5) * 0.18
      crowded[i3 + 2] = Math.sin(th0) * Math.cos(ph0) * r0 * 0.82

      // Exploded / wide scatter
      const r1 = 2.8 + dens * 8.5 + s3 * 3.6
      const th1 = th0 + (s3 - 0.5) * 0.7
      const ph1 = ph0 + (s0 - 0.5) * 0.55
      exploded[i3] = Math.cos(th1) * Math.cos(ph1) * r1
      exploded[i3 + 1] = Math.sin(ph1) * r1 * 1.1 + (s1 - 0.5) * 2.2
      exploded[i3 + 2] = Math.sin(th1) * Math.cos(ph1) * r1

      const c = palette[i % palette.length].clone()
      c.offsetHSL(0, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.1)
      colors[i3] = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b
    }

    return { crowded, exploded, colors }
  }, [count])

  function projectPointer(clientX: number, clientY: number) {
    const rect = gl.domElement.getBoundingClientRect()
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(ndc, camera)
    if (raycaster.ray.intersectPlane(hitPlane, hitPoint)) {
      return { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z }
    }
    return null
  }

  useEffect(() => {
    const el = gl.domElement

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      const hit = projectPointer(touch.clientX, touch.clientY)
      if (hit) {
        cursorRef.current.x = hit.x
        cursorRef.current.y = hit.y
        cursorRef.current.z = hit.z
      }
      cursorRef.current.isTouch = true
      cursorRef.current.targetActive = 1
    }

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y
      // Yield to page scroll on a clear vertical flick
      if (Math.abs(dy) > 48 && Math.abs(dy) > Math.abs(dx) * 1.6) {
        cursorRef.current.targetActive = 0
        return
      }
      const hit = projectPointer(touch.clientX, touch.clientY)
      if (!hit) return
      cursorRef.current.x = hit.x
      cursorRef.current.y = hit.y
      cursorRef.current.z = hit.z
      cursorRef.current.targetActive = 1
      cursorRef.current.isTouch = true
    }

    const onTouchEnd = () => {
      cursorRef.current.targetActive = 0
      cursorRef.current.isTouch = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [gl, camera, raycaster, hitPlane, hitPoint, ndc])

  useEffect(() => {
    progressRef.current = useHeroProgress.getState().progress
    return useHeroProgress.subscribe((state) => {
      progressRef.current = state.progress
    })
  }, [])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return

    const pos = points.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const disp = dispRef.current
    const dt = Math.min(delta, 0.033)
    const p = progressRef.current
    const { crowded, exploded } = data

    // Crowd → explode → crowd → explode → crowd (held crowded between short bursts)
    const explodeT = Math.min(
      1,
      explodePulse(p, 0.1, 0.26) +
        explodePulse(p, 0.4, 0.56) +
        explodePulse(p, 0.7, 0.86),
    )

    cursorRef.current.active = lerp(
      cursorRef.current.active,
      cursorRef.current.targetActive,
      1 - Math.exp(-dt * 10),
    )

    const cx = cursorRef.current.x
    const cy = cursorRef.current.y
    const cz = cursorRef.current.z
    const influence = cursorRef.current.active
    // Small local interaction only (unchanged feel)
    const radius = cursorRef.current.isTouch ? 1.05 : 0.85
    const pushMax = cursorRef.current.isTouch ? 0.28 : 0.22
    const settle = 1 - Math.exp(-dt * 12)
    const place = 1 - Math.exp(-dt * 14)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      const baseX = lerp(crowded[i3], exploded[i3], explodeT)
      const baseY = lerp(crowded[i3 + 1], exploded[i3 + 1], explodeT)
      const baseZ = lerp(crowded[i3 + 2], exploded[i3 + 2], explodeT)

      let dx = 0
      let dy = 0
      let dz = 0
      if (influence > 0.01) {
        const ox = baseX + disp[i3] - cx
        const oy = baseY + disp[i3 + 1] - cy
        const oz = baseZ + disp[i3 + 2] - cz
        const dist = Math.sqrt(ox * ox + oy * oy + oz * oz) + 0.001
        if (dist < radius) {
          const fall = 1 - dist / radius
          const push = fall * fall * pushMax * influence
          dx = (ox / dist) * push
          dy = (oy / dist) * push
          dz = (oz / dist) * push
        }
      }

      // Smooth ease to target offset — no spring / bounce
      disp[i3] = lerp(disp[i3], dx, settle)
      disp[i3 + 1] = lerp(disp[i3 + 1], dy, settle)
      disp[i3 + 2] = lerp(disp[i3 + 2], dz, settle)

      arr[i3] = lerp(arr[i3], baseX + disp[i3], place)
      arr[i3 + 1] = lerp(arr[i3 + 1], baseY + disp[i3 + 1], place)
      arr[i3 + 2] = lerp(arr[i3 + 2], baseZ + disp[i3 + 2], place)
    }

    pos.needsUpdate = true
    points.rotation.set(0, 0, 0)
  })

  function setCursor(event: ThreeEvent<PointerEvent>, active: number) {
    cursorRef.current.x = event.point.x
    cursorRef.current.y = event.point.y
    cursorRef.current.z = event.point.z
    cursorRef.current.targetActive = active
    cursorRef.current.isTouch = false
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
          cursorRef.current.targetActive = 0
        }}
        onPointerLeave={() => {
          cursorRef.current.targetActive = 0
        }}
      >
        <planeGeometry args={[16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.crowded, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.018}
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
