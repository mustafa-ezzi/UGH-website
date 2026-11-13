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

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** 0 at the edges, then a full burst held through the middle of the window. */
function burstHold(p: number, start: number, end: number) {
  if (p <= start || p >= end) return 0
  const t = (p - start) / (end - start)
  if (t < 0.14) return smoothstep(0, 0.14, t)
  if (t > 0.8) return 1 - smoothstep(0.8, 1, t)
  return 1
}

type GlyphPoint = { x: number; y: number }

/** Sample a word into normalized glyph points. `gap` is the space between letters. */
function sampleGlyph(text: string, maxPoints: number, gap: number, fontSize: number): GlyphPoint[] {
  if (typeof document === 'undefined') return []
  const w = 1800
  const h = 520
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`

  const chars = text.split('')
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, chars.length - 1)
  let cursor = (w - total) / 2
  chars.forEach((ch, index) => {
    ctx.fillText(ch, cursor, h / 2 + 8)
    cursor += widths[index] + gap
  })

  const { data } = ctx.getImageData(0, 0, w, h)
  const raw: GlyphPoint[] = []
  const step = 4
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 48) raw.push({ x: x / w, y: y / h })
    }
  }
  if (!raw.length) return []
  const stride = Math.max(1, Math.ceil(raw.length / maxPoints))
  const pts: GlyphPoint[] = []
  for (let i = 0; i < raw.length; i += stride) pts.push(raw[i])
  return pts
}

function writeGlyph(
  target: Float32Array,
  glyph: GlyphPoint[],
  count: number,
  spanX: number,
  spanY: number,
  jitter: (i: number) => { x: number; y: number; z: number },
) {
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const j = jitter(i)
    if (!glyph.length) {
      target[i3] = j.x
      target[i3 + 1] = j.y
      target[i3 + 2] = j.z
      continue
    }
    const g = glyph[i % glyph.length]
    target[i3] = (g.x - 0.5) * spanX + j.x
    target[i3 + 1] = (0.5 - g.y) * spanY + j.y
    target[i3 + 2] = j.z
  }
}
/**
 * Gold dust spells MACSONS on load, then gathers into UGH.
 * After that, scroll bursts the letters and they gather back into UGH.
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
    const macsons = new Float32Array(count * 3)
    const ugh = new Float32Array(count * 3)
    const exploded = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const gold = new THREE.Color('#d4a84b')
    const paleGold = new THREE.Color('#f0d59a')
    const ember = new THREE.Color('#c45c26')
    const steel = new THREE.Color('#9aa3ab')
    const brass = new THREE.Color('#b8956c')
    const flameTip = new THREE.Color('#e8a05c')
    const palette = [gold, paleGold, ember, brass, steel, flameTip, gold]

    const brand = sampleGlyph('MACSONS', Math.min(count, 2800), 42, 250)
    const mark = sampleGlyph('UGH', Math.min(count, 2200), 150, 340)
    const jitter = new Array<{ x: number; y: number; z: number }>(count)

    for (let i = 0; i < count; i++) {
      const s0 = Math.random()
      const s2 = Math.random()
      const s3 = Math.random()
      jitter[i] = {
        x: (s2 - 0.5) * 0.02,
        y: (s3 - 0.5) * 0.02,
        z: (s0 - 0.5) * 0.06,
      }
    }

    writeGlyph(macsons, brand, count, 6.4, 1.35, (i) => jitter[i])
    writeGlyph(ugh, mark, count, 7.2, 2.15, (i) => jitter[i])

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const s0 = Math.random()
      const s1 = Math.random()
      const s2 = Math.random()
      const s3 = Math.random()

      const th1 = s1 * Math.PI * 2
      const fly = 6.5 + s0 * 9
      exploded[i3] = ugh[i3] + Math.cos(th1) * fly
      exploded[i3 + 1] = ugh[i3 + 1] + Math.sin(th1) * fly * 0.85 + (s3 - 0.5) * 3
      exploded[i3 + 2] = ugh[i3 + 2] + (s2 - 0.5) * 8

      const c = palette[i % palette.length].clone()
      c.offsetHSL(0, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.1)
      colors[i3] = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b
    }

    return { macsons, ugh, exploded, colors }
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
    const { macsons, ugh, exploded } = data
    const elapsed = ((points.userData.elapsed as number | undefined) ?? 0) + dt
    points.userData.elapsed = elapsed

    // MACSONS holds for 3s, then spends 3s gathering into UGH.
    const toUgh = smoothstep(3, 6, elapsed)
    let scrollBase = points.userData.scrollBase as number | undefined
    if (toUgh >= 1 && scrollBase == null) {
      scrollBase = p
      points.userData.scrollBase = p
    }
    // Bursts are measured from the scroll that happens after UGH has formed.
    // The particle timeline lags behind the page so a fast flick still
    // passes through the formed UGH instead of skipping it.
    const targetLocal =
      scrollBase == null ? 0 : Math.min(1, Math.max(0, (p - scrollBase) / 1))
    const prevLocal = (points.userData.local as number | undefined) ?? targetLocal
    const local = prevLocal + (targetLocal - prevLocal) * (1 - Math.exp(-dt * 0.55))
    points.userData.local = local
    const explodeT = Math.min(
      1,
      burstHold(local, 0.06, 0.16) +
        burstHold(local, 0.4, 0.5) +
        burstHold(local, 0.74, 0.84),
    )

    cursorRef.current.active = lerp(
      cursorRef.current.active,
      cursorRef.current.targetActive,
      1 - Math.exp(-dt * 10),
    )

    const cam = camera as THREE.PerspectiveCamera
    const dist = Math.max(0.1, cam.position.length())
    const visibleH = 2 * Math.tan((cam.fov * Math.PI) / 360) * dist
    const visibleW = visibleH * Math.max(0.2, cam.aspect)
    // Authored widths: MACSONS 6.4, UGH 7.2. Shrink so the whole word fits.
    const fitMac = Math.min(1, (visibleW * 0.86) / 6.4)
    const fitUgh = Math.min(1, (visibleW * 0.9) / 7.2)
    const fit = lerp(fitMac, fitUgh, toUgh)
    const lift = cam.aspect < 0.9 ? visibleH * 0.04 : 0
    const mat = points.material as THREE.PointsMaterial
    if (mat) mat.size = 0.02 * Math.min(1, Math.max(fit * 1.35, 0.42))
    const cx = cursorRef.current.x
    const cy = cursorRef.current.y
    const cz = cursorRef.current.z
    const influence = cursorRef.current.active
    // Small local interaction only (unchanged feel)
    const radius = cursorRef.current.isTouch ? 1.05 : 0.85
    const pushMax = cursorRef.current.isTouch ? 0.28 : 0.22
    const settle = 1 - Math.exp(-dt * 12)
    const place = 1 - Math.exp(-dt * (explodeT > 0.2 ? 16 : 5))

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      const wordX = lerp(macsons[i3], ugh[i3], toUgh) * fit
      const wordY = lerp(macsons[i3 + 1], ugh[i3 + 1], toUgh) * fit + lift
      const wordZ = lerp(macsons[i3 + 2], ugh[i3 + 2], toUgh)
      const baseX = lerp(wordX, exploded[i3], explodeT)
      const baseY = lerp(wordY, exploded[i3 + 1], explodeT)
      const baseZ = lerp(wordZ, exploded[i3 + 2], explodeT)

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
          <bufferAttribute attach="attributes-position" args={[data.macsons.slice(), 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
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
