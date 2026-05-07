import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GhostButton,
  IconButton,
  Label,
  LogicBox,
  ModuleLayout,
  Slider,
} from '../shared/atoms'
import { T } from '../shared/tokens'

type SurfaceId = 'bowl' | 'saddle' | 'twoMinima' | 'rosenbrock'

type Surface = {
  id: SurfaceId
  label: string
  f: (x: number, y: number) => number
  grad: (x: number, y: number) => [number, number]
  start: [number, number]
}

const SURFACES: Record<SurfaceId, Surface> = {
  bowl: {
    id: 'bowl',
    label: 'Convex bowl',
    f: (x, y) => 0.4 * x * x + 0.8 * y * y,
    grad: (x, y) => [0.8 * x, 1.6 * y],
    start: [-1.8, 1.6],
  },
  saddle: {
    id: 'saddle',
    label: 'Saddle',
    f: (x, y) => 0.5 * x * x - 0.5 * y * y,
    grad: (x, y) => [x, -y],
    start: [-1.6, 0.05],
  },
  twoMinima: {
    id: 'twoMinima',
    label: 'Two minima',
    f: (x, y) => (x * x - 1) * (x * x - 1) + 0.5 * y * y,
    grad: (x, y) => [4 * x * (x * x - 1), y],
    start: [0.05, 1.6],
  },
  rosenbrock: {
    id: 'rosenbrock',
    label: 'Rosenbrock',
    f: (x, y) => (1 - x) * (1 - x) + 5 * (y - x * x) * (y - x * x),
    grad: (x, y) => [-2 * (1 - x) - 20 * x * (y - x * x), 10 * (y - x * x)],
    start: [-1.5, 1.6],
  },
}

const RANGE = 2.4
const SIZE = 560
const HALF = SIZE / 2
const SCALE = HALF / RANGE
const GRID = 36 // heatmap resolution

const toPx = (x: number, y: number) =>
  [HALF + x * SCALE, HALF - y * SCALE] as const
const toMath = (px: number, py: number) =>
  [(px - HALF) / SCALE, (HALF - py) / SCALE] as const

export function GradientDescentModule() {
  const [surfaceId, setSurfaceId] = useState<SurfaceId>('bowl')
  const surface = SURFACES[surfaceId]
  const [lr, setLr] = useState(0.18)
  const [pos, setPos] = useState<[number, number]>(surface.start)
  const [history, setHistory] = useState<[number, number][]>([surface.start])
  const [playing, setPlaying] = useState(false)
  const [boundSurfaceId, setBoundSurfaceId] = useState(surfaceId)
  const playingRef = useRef(false)

  // Adjust derived state during render when surface changes (instead of via effect).
  if (boundSurfaceId !== surfaceId) {
    setBoundSurfaceId(surfaceId)
    setPos(surface.start)
    setHistory([surface.start])
    setPlaying(false)
  }

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  const step = useCallback(() => {
    setPos((cur) => {
      const [x, y] = cur
      const [gx, gy] = surface.grad(x, y)
      let nx = x - lr * gx
      let ny = y - lr * gy
      nx = Math.max(-RANGE, Math.min(RANGE, nx))
      ny = Math.max(-RANGE, Math.min(RANGE, ny))
      const next: [number, number] = [nx, ny]
      setHistory((h) => (h.length > 800 ? [...h.slice(1), next] : [...h, next]))
      const moved = Math.hypot(nx - x, ny - y)
      if (moved < 1e-4) {
        setPlaying(false)
      }
      return next
    })
  }, [surface, lr])

  // Auto-step loop while playing.
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      if (!playingRef.current) return
      step()
    }, 90)
    return () => window.clearInterval(id)
  }, [playing, step])

  // Heatmap min / max for color scaling
  const { fMin, fMax, cells } = useMemo(() => {
    let lo = Infinity
    let hi = -Infinity
    const arr: { px: number; py: number; w: number; h: number; v: number }[] = []
    const step = SIZE / GRID
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const cx = i * step + step / 2
        const cy = j * step + step / 2
        const [mx, my] = toMath(cx, cy)
        const v = surface.f(mx, my)
        lo = Math.min(lo, v)
        hi = Math.max(hi, v)
        arr.push({ px: i * step, py: j * step, w: step + 0.6, h: step + 0.6, v })
      }
    }
    return { fMin: lo, fMax: hi, cells: arr }
  }, [surface])

  const colorFor = (v: number) => {
    const t = (v - fMin) / Math.max(fMax - fMin, 1e-9)
    // Light → dark grayscale. Lower f = brighter (the "valley").
    const g = 250 - Math.floor(t * 130)
    return `rgb(${g},${g},${g})`
  }

  const [px, py] = toPx(pos[0], pos[1])
  const fNow = surface.f(pos[0], pos[1])
  const [gx, gy] = surface.grad(pos[0], pos[1])
  const gMag = Math.hypot(gx, gy)

  const tracePoints = history
    .map(([x, y]) => {
      const [tx, ty] = toPx(x, y)
      return `${tx},${ty}`
    })
    .join(' ')

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[560px] aspect-square cursor-crosshair"
        onClick={(e) => {
          const svg = e.currentTarget
          const rect = svg.getBoundingClientRect()
          const sx = ((e.clientX - rect.left) / rect.width) * SIZE
          const sy = ((e.clientY - rect.top) / rect.height) * SIZE
          const [mx, my] = toMath(sx, sy)
          setPos([mx, my])
          setHistory([[mx, my]])
          setPlaying(false)
        }}
      >
        {/* Heatmap */}
        {cells.map((c, i) => (
          <rect
            key={i}
            x={c.px}
            y={c.py}
            width={c.w}
            height={c.h}
            fill={colorFor(c.v)}
            shapeRendering="crispEdges"
          />
        ))}
        {/* axes */}
        <line x1={0} y1={HALF} x2={SIZE} y2={HALF} stroke={T.line} strokeWidth={1} />
        <line x1={HALF} y1={0} x2={HALF} y2={SIZE} stroke={T.line} strokeWidth={1} />

        {/* trajectory */}
        {history.length >= 2 && (
          <polyline
            points={tracePoints}
            fill="none"
            stroke={T.red}
            strokeWidth={1.6}
            strokeOpacity={0.9}
          />
        )}

        {/* gradient arrow at current position */}
        {gMag > 1e-3 && (
          <g>
            <line
              x1={px}
              y1={py}
              x2={px - gx * SCALE * 0.35}
              y2={py + gy * SCALE * 0.35}
              stroke={T.red}
              strokeWidth={1.6}
              strokeOpacity={0.7}
              markerEnd="url(#gd-arrow)"
            />
            <defs>
              <marker
                id="gd-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={T.red} />
              </marker>
            </defs>
          </g>
        )}

        {/* current ball */}
        <motion.circle
          animate={{ cx: px, cy: py }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          r={6}
          fill={T.ink}
          stroke="white"
          strokeWidth={2}
          initial={false}
        />
      </svg>

      <div className="mt-2 text-[11.5px] text-[#666] tracking-tight text-center max-w-[640px]">
        Click anywhere on the surface to set a new starting point.
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <IconButton
          onClick={() => setPlaying((p) => !p)}
          label={playing ? 'Pause' : 'Play'}
          primary
        >
          {playing ? <Pause size={13} strokeWidth={2} /> : <Play size={13} strokeWidth={2} />}
        </IconButton>
        <GhostButton onClick={step} className="justify-center">
          <ChevronRight size={13} strokeWidth={1.8} /> Step
        </GhostButton>
        <IconButton
          onClick={() => {
            setPos(surface.start)
            setHistory([surface.start])
            setPlaying(false)
          }}
          label="Reset"
        >
          <RotateCcw size={13} strokeWidth={1.6} />
        </IconButton>
      </div>

      <div>
        <Label>Loss Surface</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(['bowl', 'saddle', 'twoMinima', 'rosenbrock'] as SurfaceId[]).map((s) => (
            <button
              key={s}
              onClick={() => setSurfaceId(s)}
              className={[
                'h-8 text-[11px] tracking-tight rounded-md border transition-all',
                surfaceId === s
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {SURFACES[s].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Learning rate η</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">
            {lr.toFixed(2)}
          </span>
        </div>
        <Slider value={lr} min={0.01} max={0.5} step={0.01} onChange={(v) => setLr(v)} />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E5E5] text-[11px] font-mono tabular-nums text-[#666]">
        <Stat label="x" value={pos[0].toFixed(2)} />
        <Stat label="y" value={pos[1].toFixed(2)} />
        <Stat label="f(x,y)" value={fNow.toFixed(3)} />
        <Stat label="‖∇f‖" value={gMag.toFixed(3)} />
        <Stat label="steps" value={String(history.length - 1)} />
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Gradient Descent"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[13px] text-[#222]">
            x<sub>t+1</sub> = x<sub>t</sub> − η · ∇f(x<sub>t</sub>)
          </div>
          <div className="text-[11.5px] text-[#999] leading-relaxed mt-1">
            The gradient ∇f points in the direction of steepest ascent — so we step in the
            opposite direction. The learning rate η controls step size.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#666]">
            Try cranking η on the Rosenbrock surface — the long curving valley makes the path
            zigzag because the ratio of curvatures along/across the valley is enormous.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.14em] text-[#999]">{label}</span>
      <span className="text-[12px] text-[#222]">{value}</span>
    </div>
  )
}
