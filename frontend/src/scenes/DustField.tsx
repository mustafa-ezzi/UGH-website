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

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x))
}

function pulse(p: number, a: number, b: number) {
  if (p <= a || p >= b) return 0
  const t = (p - a) / (b - a)
  return Math.sin(t * Math.PI)
}

function formWeight(p: number, a: number, b: number, holdEnd: number) {
  if (p < a) return 0
  if (p < b) return THREE.MathUtils.smoothstep(p, a, b)
  if (p < holdEnd) return 1
  return 1 - THREE.MathUtils.smoothstep(p, holdEnd, holdEnd + 0.08)
}

/** Cheap 3D hash noise for jumble / turbulence. */
function hashNoise(x: number, y: number, z: number) {
  return (
    Math.sin(x * 1.31 + y * 0.77 + z * 0.43) * 0.5 +
    Math.sin(x * 2.17 - y * 1.61 + z * 0.91) * 0.3 +
    Math.sin(y * 3.07 + z * 2.33 - x * 0.55) * 0.2
  )
}

/**
 * Scroll-driven dust with messy merge → blast → remesh cycles.
 * Touch + mouse both part particles; vertical page scroll stays via touch-action: pan-y.
 */
export function DustField({ count }: DustFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const progressRef = useRef(0)
  const prevProgressRef = useRef(0)
  const cursorRef = useRef({
    x: 0,
    y: 0,
    z: 0,
    active: 0,
    targetActive: 0,
    /** Finger / pointer velocity in world space */
    vx: 0,
    vy: 0,
    vz: 0,
    /** True only for clear full-page vertical scrolls */
    scrolling: false,
    isTouch: false,
  })
  const touchStartRef = useRef({ x: 0, y: 0, t: 0 })
  const lastTouchRef = useRef({ x: 0, y: 0, t: 0, wx: 0, wy: 0, wz: 0 })
  const dispRef = useRef<Float32Array>(new Float32Array(count * 3))
  const velRef = useRef<Float32Array>(new Float32Array(count * 3))
  const interactVelRef = useRef<Float32Array>(new Float32Array(count * 3))
  const { gl, camera } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const hitPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.35),
    [],
  )
  const hitPoint = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  const data = useMemo(() => {
    const cloud = new Float32Array(count * 3)
    const sphere = new Float32Array(count * 3)
    const torus = new Float32Array(count * 3)
    const flame = new Float32Array(count * 3)
    const jewel = new Float32Array(count * 3)
    const helix = new Float32Array(count * 3)
    const scatter = new Float32Array(count * 3)
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

      seeds[i * 4] = rnd()
      seeds[i * 4 + 1] = rnd()
      seeds[i * 4 + 2] = rnd()
      seeds[i * 4 + 3] = rnd()
      phases[i] = rnd() * Math.PI * 2

      const s0 = seeds[i * 4]
      const s1 = seeds[i * 4 + 1]
      const s2 = seeds[i * 4 + 2]
      const s3 = seeds[i * 4 + 3]

      // Dense crowded cloud — bias toward center, fill the hero tightly
      const dens = Math.pow(s0, 0.55)
      const cr = 0.25 + dens * 4.4 + s3 * 1.1
      const cTheta = s1 * Math.PI * 2
      const cPhi = (s2 - 0.5) * Math.PI * 0.95
      cloud[i3] = Math.cos(cTheta) * Math.cos(cPhi) * cr
      cloud[i3 + 1] = Math.sin(cPhi) * cr * 0.88 + (s3 - 0.5) * 0.9
      cloud[i3 + 2] = Math.sin(cTheta) * Math.cos(cPhi) * cr * 0.92

      // Extra scatter layer (used while jumbling) — also denser core
      const sr2 = 0.8 + dens * 3.8 + s1 * 1.2
      const st = s2 * Math.PI * 2
      scatter[i3] = Math.cos(st + s0 * 9) * sr2 * (0.55 + s3 * 0.5)
      scatter[i3 + 1] = (s0 - 0.5) * 4.8
      scatter[i3 + 2] = Math.sin(st * 1.3 - s1 * 5) * sr2 * (0.5 + s2 * 0.45)

      // Warped pebble / broken sphere
      const phi = Math.acos(2 * s0 - 1)
      const theta = s1 * Math.PI * 2
      const warp =
        1 +
        0.38 * Math.sin(phi * 4 + s2 * 7) +
        0.28 * Math.cos(theta * 6 + s3 * 5) +
        0.18 * Math.sin((s0 + s1) * 22)
      const sr = (1.05 + s2 * 0.85) * warp
      sphere[i3] = Math.sin(phi) * Math.cos(theta) * sr + (s3 - 0.5) * 0.55
      sphere[i3 + 1] = Math.cos(phi) * sr * (0.7 + s3 * 0.55)
      sphere[i3 + 2] = Math.sin(phi) * Math.sin(theta) * sr + (s0 - 0.5) * 0.45

      // Torn ring
      const R = 1.6 + s0 * 0.7
      const rTube = 0.25 + s1 * 0.85
      const a = s2 * Math.PI * 2
      const b = s3 * Math.PI * 2
      const wobble = 0.35 * Math.sin(a * 4 + s1 * 9) + (s0 - 0.5) * 0.4
      torus[i3] = (R + rTube * Math.cos(b) + wobble) * Math.cos(a)
      torus[i3 + 1] = rTube * Math.sin(b) * 1.4 + Math.sin(a * 3) * 0.45 + (s2 - 0.5) * 0.5
      torus[i3 + 2] = (R + rTube * Math.cos(b) + wobble) * Math.sin(a)

      // Wild flame plume
      const fy = (s0 - 0.12) * 4.2
      const fSpread = (0.2 + (1 - Math.abs(fy) / 4.2) * 1.45) * (0.35 + s1 * 1.1)
      const fAng = s2 * Math.PI * 2
      const twist = fy * 2.1 + s3 * 6
      flame[i3] = Math.cos(fAng + twist) * fSpread * (0.6 + 0.7 * Math.sin(fy * 2.4))
      flame[i3 + 1] = fy + Math.sin(s1 * 20) * 0.25
      flame[i3 + 2] = Math.sin(fAng + twist) * fSpread * (0.5 + s0 * 0.7)

      // Faceted jewel — messier
      const jAxes = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ]
      const face = jAxes[i % 6]
      const jScale = 1.2 + s1 * 0.75
      jewel[i3] = (face[0] + (s1 - 0.5) * 1.35 + (s0 - 0.5) * 0.7) * jScale
      jewel[i3 + 1] = (face[1] + (s2 - 0.5) * 1.35) * jScale * 1.2
      jewel[i3 + 2] = (face[2] + (s3 - 0.5) * 1.35 - (s0 - 0.5) * 0.5) * jScale

      // Helix / vortex
      const hy = (u - 0.5) * 5 + (s0 - 0.5) * 1.1
      const hR = 0.4 + s1 * 1.5 + Math.sin(hy * 2.2) * 0.55
      const hAng = hy * 3.4 + s2 * Math.PI * 2
      helix[i3] = Math.cos(hAng) * hR + (s3 - 0.5) * 0.4
      helix[i3 + 1] = hy
      helix[i3 + 2] = Math.sin(hAng) * hR + (s0 - 0.5) * 0.4

      const c = palette[i % palette.length].clone()
      c.offsetHSL(0, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.12)
      colors[i3] = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b
    }

    return { cloud, sphere, torus, flame, jewel, helix, scatter, colors, phases, seeds }
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

  // Native touch bridge — physical parting + wake; page scroll only on clear vertical flicks
  useEffect(() => {
    const el = gl.domElement

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      const now = performance.now()
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: now }
      const hit = projectPointer(touch.clientX, touch.clientY)
      if (hit) {
        cursorRef.current.x = hit.x
        cursorRef.current.y = hit.y
        cursorRef.current.z = hit.z
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY, t: now, wx: hit.x, wy: hit.y, wz: hit.z }
      }
      cursorRef.current.scrolling = false
      cursorRef.current.isTouch = true
      cursorRef.current.vx = 0
      cursorRef.current.vy = 0
      cursorRef.current.vz = 0
      cursorRef.current.targetActive = 1
      cursorRef.current.active = Math.max(cursorRef.current.active, 0.85)
    }

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      const now = performance.now()
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // Only yield to page scroll on a decisive vertical flick
      const isPageScroll = absDy > 48 && absDy > absDx * 1.6
      if (isPageScroll) {
        cursorRef.current.scrolling = true
        cursorRef.current.targetActive = 0.2
        return
      }

      cursorRef.current.scrolling = false
      cursorRef.current.targetActive = 1
      cursorRef.current.isTouch = true

      const hit = projectPointer(touch.clientX, touch.clientY)
      if (!hit) return

      const dtMs = Math.max(8, now - lastTouchRef.current.t)
      const inv = 1000 / dtMs
      cursorRef.current.vx = (hit.x - lastTouchRef.current.wx) * inv
      cursorRef.current.vy = (hit.y - lastTouchRef.current.wy) * inv
      cursorRef.current.vz = (hit.z - lastTouchRef.current.wz) * inv
      cursorRef.current.x = hit.x
      cursorRef.current.y = hit.y
      cursorRef.current.z = hit.z
      lastTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        t: now,
        wx: hit.x,
        wy: hit.y,
        wz: hit.z,
      }
    }

    const onTouchEnd = () => {
      // Soft linger — dust settles back after the finger lifts
      cursorRef.current.targetActive = 0
      cursorRef.current.scrolling = false
      cursorRef.current.isTouch = false
      cursorRef.current.vx *= 0.35
      cursorRef.current.vy *= 0.35
      cursorRef.current.vz *= 0.35
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
    const scrollSpeed = Math.min(1, Math.abs(p - prevProgressRef.current) / Math.max(dt, 0.008))
    prevProgressRef.current = p

    const { cloud, sphere, torus, flame, jewel, helix, scatter, phases, seeds } = data

    const wSphere = formWeight(p, 0.05, 0.14, 0.17)
    const wTorus = formWeight(p, 0.32, 0.42, 0.45)
    const wFlame = formWeight(p, 0.54, 0.63, 0.66)
    const wHelix = formWeight(p, 0.7, 0.78, 0.81)
    const wJewel = THREE.MathUtils.smoothstep(p, 0.86, 0.97)

    const blast =
      pulse(p, 0.15, 0.33) * 1.25 +
      pulse(p, 0.43, 0.56) * 1.4 +
      pulse(p, 0.64, 0.76) * 1.15 +
      pulse(p, 0.8, 0.9) * 0.75

    // Continuous mid-scroll disorder — keeps forms from looking too clean
    const jumble = clamp01(Math.sin(p * Math.PI) * 0.92 + scrollSpeed * 0.55)
    const formSum = wSphere + wTorus + wFlame + wHelix + wJewel
    const wScatter = jumble * (0.35 + blast * 0.55) * (1 - wJewel * 0.7)
    const wCloud = Math.max(0, 1 - formSum - wScatter * 0.5) * (1 - blast * 0.25)

    const interactVel = interactVelRef.current

    cursorRef.current.active = lerp(
      cursorRef.current.active,
      cursorRef.current.targetActive,
      1 - Math.exp(-dt * (cursorRef.current.isTouch ? 14 : 8)),
    )
    // Decay finger velocity when not moving
    cursorRef.current.vx *= Math.exp(-dt * 6)
    cursorRef.current.vy *= Math.exp(-dt * 6)
    cursorRef.current.vz *= Math.exp(-dt * 6)

    const cx = cursorRef.current.x
    const cy = cursorRef.current.y
    const cz = cursorRef.current.z
    const influence = cursorRef.current.active
    const touchBoost = cursorRef.current.isTouch ? 1.35 : 1
    const radiusInfluence = (cursorRef.current.isTouch ? 2.85 : 2.15) * touchBoost
    const partStrength = (cursorRef.current.isTouch ? 1.45 : 0.95) * touchBoost
    const wake = Math.min(
      2.4,
      Math.hypot(cursorRef.current.vx, cursorRef.current.vy, cursorRef.current.vz) * 0.12,
    )

    // Laggy follow while jumbling = messier trails
    const follow = 1 - Math.exp(-dt * (2.6 + formSum * 2.2 - jumble * 1.1))
    const blastFollow = 1 - Math.exp(-dt * 2.4)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const phase = phases[i]
      const s0 = seeds[i * 4]
      const s1 = seeds[i * 4 + 1]
      const s2 = seeds[i * 4 + 2]
      const s3 = seeds[i * 4 + 3]

      let tx =
        cloud[i3] * wCloud +
        sphere[i3] * wSphere +
        torus[i3] * wTorus +
        flame[i3] * wFlame +
        helix[i3] * wHelix +
        jewel[i3] * wJewel +
        scatter[i3] * wScatter
      let ty =
        cloud[i3 + 1] * wCloud +
        sphere[i3 + 1] * wSphere +
        torus[i3 + 1] * wTorus +
        flame[i3 + 1] * wFlame +
        helix[i3 + 1] * wHelix +
        jewel[i3 + 1] * wJewel +
        scatter[i3 + 1] * wScatter
      let tz =
        cloud[i3 + 2] * wCloud +
        sphere[i3 + 2] * wSphere +
        torus[i3 + 2] * wTorus +
        flame[i3 + 2] * wFlame +
        helix[i3 + 2] * wHelix +
        jewel[i3 + 2] * wJewel +
        scatter[i3 + 2] * wScatter

      const wNorm = wCloud + formSum + wScatter
      if (wNorm > 1.001) {
        tx /= wNorm
        ty /= wNorm
        tz /= wNorm
      }

      // Turbulence — stronger while scrolling / blasting
      const turbAmp = 0.08 + jumble * 0.55 + blast * 0.85 + scrollSpeed * 0.4
      const n1 = hashNoise(tx * 0.7 + t * 0.55, ty * 0.7 + phase, tz * 0.7)
      const n2 = hashNoise(ty * 0.9 - t * 0.4, tz * 0.9 + s0 * 8, tx * 0.9)
      const n3 = hashNoise(tz * 0.8 + t * 0.35, tx * 0.8 + s1 * 6, ty * 0.8)
      tx += n1 * turbAmp * (0.7 + s2)
      ty += n2 * turbAmp * (0.6 + s3)
      tz += n3 * turbAmp * (0.7 + s0)

      // Living micro-motion
      const life = 0.06 + (1 - clamp01(formSum)) * 0.18 + jumble * 0.12
      tx += Math.cos(t * (0.55 + s0 * 1.4) + phase) * life
      ty += Math.sin(t * (0.42 + s1 * 1.2) + phase) * life
      tz += Math.sin(t * (0.48 + s2 * 1.3) + phase) * life

      if (blast > 0.01) {
        const len = Math.sqrt(tx * tx + ty * ty + tz * tz) + 0.0001
        const outward = 1.8 + s3 * 5.2 + (i % 11) * 0.22 + jumble * 1.4
        const chaos = Math.sin(phase * 4 + t * 3.1 + s0 * 14) * (1.1 + jumble)
        const swirl = t * 2.4 + phase
        const bx =
          (tx / len) * outward +
          Math.cos(swirl) * chaos +
          Math.sin(phase * 2.3) * outward * 0.35
        const by =
          (ty / len) * outward * 0.85 +
          Math.sin(swirl * 0.8) * chaos +
          (s1 - 0.5) * outward * 0.5
        const bz =
          (tz / len) * outward +
          Math.sin(swirl * 1.2) * chaos +
          Math.cos(phase * 1.7) * outward * 0.3
        tx = lerp(tx, bx, Math.min(1, blast * 1.15))
        ty = lerp(ty, by, Math.min(1, blast * 1.15))
        tz = lerp(tz, bz, Math.min(1, blast * 1.15))

        vel[i3] += (bx - arr[i3]) * blast * dt * 11
        vel[i3 + 1] += (by - arr[i3 + 1]) * blast * dt * 11
        vel[i3 + 2] += (bz - arr[i3 + 2]) * blast * dt * 11
      } else {
        vel[i3] *= Math.exp(-dt * 5)
        vel[i3 + 1] *= Math.exp(-dt * 5)
        vel[i3 + 2] *= Math.exp(-dt * 5)
      }

      // Cursor / finger parting — soft fluid repulsion + swipe wake
      let dx = 0
      let dy = 0
      let dz = 0
      if (influence > 0.01) {
        const ox = arr[i3] - cx
        const oy = arr[i3 + 1] - cy
        const oz = arr[i3 + 2] - cz
        const dist = Math.sqrt(ox * ox + oy * oy + oz * oz) + 0.001
        if (dist < radiusInfluence) {
          const fall = 1 - dist / radiusInfluence
          const soft = fall * fall * (0.35 + fall * 0.65)
          const push = soft * partStrength * influence
          const nx = ox / dist
          const ny = oy / dist
          const nz = oz / dist
          dx = nx * push
          dy = ny * push
          dz = nz * push

          // Swipe wake: drag nearby dust along finger motion
          if (wake > 0.02) {
            const wakePush = soft * wake * influence * 0.55
            dx += cursorRef.current.vx * wakePush * 0.08
            dy += cursorRef.current.vy * wakePush * 0.08
            dz += cursorRef.current.vz * wakePush * 0.08
          }

          // Impulse into interaction velocity for springy feel
          interactVel[i3] += (dx - disp[i3]) * dt * (cursorRef.current.isTouch ? 28 : 18)
          interactVel[i3 + 1] += (dy - disp[i3 + 1]) * dt * (cursorRef.current.isTouch ? 28 : 18)
          interactVel[i3 + 2] += (dz - disp[i3 + 2]) * dt * (cursorRef.current.isTouch ? 28 : 18)
        }
      }

      // Critically damped return — quick part, soft settle
      interactVel[i3] *= Math.exp(-dt * 7.5)
      interactVel[i3 + 1] *= Math.exp(-dt * 7.5)
      interactVel[i3 + 2] *= Math.exp(-dt * 7.5)

      const smooth = 1 - Math.exp(-dt * (cursorRef.current.isTouch ? 16 : 11))
      disp[i3] = lerp(disp[i3], dx, smooth) + interactVel[i3] * dt
      disp[i3 + 1] = lerp(disp[i3 + 1], dy, smooth) + interactVel[i3 + 1] * dt
      disp[i3 + 2] = lerp(disp[i3 + 2], dz, smooth) + interactVel[i3 + 2] * dt

      const blend = blast > 0.18 ? blastFollow : follow
      arr[i3] = lerp(arr[i3], tx + disp[i3] + vel[i3] * 0.12, blend)
      arr[i3 + 1] = lerp(arr[i3 + 1], ty + disp[i3 + 1] + vel[i3 + 1] * 0.12, blend)
      arr[i3 + 2] = lerp(arr[i3 + 2], tz + disp[i3 + 2] + vel[i3 + 2] * 0.12, blend)
    }

    pos.needsUpdate = true

    const mat = points.material as THREE.PointsMaterial
    mat.size = 0.014 + blast * 0.018 + jumble * 0.008 + formSum * 0.004 + influence * 0.004
    mat.opacity = 0.78 + formSum * 0.12 + blast * 0.1 + jumble * 0.05

    points.rotation.y = t * 0.08 + p * 0.75 + blast * 0.55 + jumble * 0.2
    points.rotation.x = Math.sin(t * 0.18 + p * 2) * 0.08 + blast * 0.14
    points.rotation.z = Math.sin(t * 0.11 + jumble) * 0.05
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
          // Touch handled by native bridge; mouse/pen still via R3F
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
        <planeGeometry args={[16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.cloud, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.016}
          vertexColors
          transparent
          opacity={0.88}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
