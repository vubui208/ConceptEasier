import { motion } from 'framer-motion'
import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

type FuncId = 'parabola' | 'cubic' | 'sine' | 'exp'

type FuncDef = {
  id: FuncId
  label: string
  expr: string
  f: (x: number) => number
  df: (x: number) => number
  yRange: [number, number]
}

const FUNCS: Record<FuncId, FuncDef> = {
  parabola: {
    id: 'parabola',
    label: 'x²/3',
    expr: 'f(x) = x²/3   ·   f′(x) = 2x/3',
    f: (x) => (x * x) / 3,
    df: (x) => (2 * x) / 3,
    yRange: [-3, 3.5],
  },
  cubic: {
    id: 'cubic',
    label: 'x³/6 − x',
    expr: 'f(x) = x³/6 − x   ·   f′(x) = x²/2 − 1',
    f: (x) => (x * x * x) / 6 - x,
    df: (x) => (x * x) / 2 - 1,
    yRange: [-3, 3],
  },
  sine: {
    id: 'sine',
    label: 'sin x',
    expr: 'f(x) = sin x   ·   f′(x) = cos x',
    f: (x) => Math.sin(x),
    df: (x) => Math.cos(x),
    yRange: [-1.6, 1.6],
  },
  exp: {
    id: 'exp',
    label: 'eˣ/4',
    expr: 'f(x) = eˣ/4   ·   f′(x) = eˣ/4',
    f: (x) => Math.exp(x) / 4,
    df: (x) => Math.exp(x) / 4,
    yRange: [-0.2, 4],
  },
}

const SIZE = 560
const HALF = SIZE / 2
const RANGE_X = 4
const SCALE_X = SIZE / (2 * RANGE_X)
const RANGE_Y = 3.6
const SCALE_Y = SIZE / (2 * RANGE_Y)

const toPx = (x: number, y: number) =>
  [HALF + x * SCALE_X, HALF - y * SCALE_Y] as const

export function DerivativeModule() {
  const [funcId, setFuncId] = useState<FuncId>('cubic')
  const [x0, setX0] = useState(1)
  const [h, setH] = useState(1)
  const fn = FUNCS[funcId]

  const samples: string[] = []
  const N = 200
  for (let i = 0; i <= N; i++) {
    const x = -RANGE_X + (i / N) * (2 * RANGE_X)
    const y = fn.f(x)
    if (Math.abs(y) > RANGE_Y * 1.4) continue
    const [px, py] = toPx(x, y)
    samples.push(`${px},${py}`)
  }

  const y0 = fn.f(x0)
  const slope = fn.df(x0)
  const fxh = fn.f(x0 + h)
  const secantSlope = h === 0 ? slope : (fxh - y0) / h
  const err = Math.abs(secantSlope - slope)

  const [px0, py0] = toPx(x0, y0)
  const [pxh, pyh] = toPx(x0 + h, fxh)

  // Tangent line: extend across visible window.
  const tEdgeX1 = -RANGE_X
  const tEdgeX2 = RANGE_X
  const tY1 = y0 + slope * (tEdgeX1 - x0)
  const tY2 = y0 + slope * (tEdgeX2 - x0)
  const [tax1, tay1] = toPx(tEdgeX1, tY1)
  const [tax2, tay2] = toPx(tEdgeX2, tY2)

  // Secant extended for clarity (clipped softly via stroke).
  const sY1 = y0 + secantSlope * (tEdgeX1 - x0)
  const sY2 = y0 + secantSlope * (tEdgeX2 - x0)
  const [sax1, say1] = toPx(tEdgeX1, sY1)
  const [sax2, say2] = toPx(tEdgeX2, sY2)

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[560px] aspect-square"
      >
        <Grid />

        {/* function curve */}
        <polyline
          points={samples.join(' ')}
          fill="none"
          stroke={T.ink}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />

        {/* secant line — fades as h shrinks */}
        <motion.line
          animate={{ x1: sax1, y1: say1, x2: sax2, y2: say2 }}
          transition={SOFT_SPRING}
          stroke={T.green}
          strokeOpacity={Math.min(0.85, 0.25 + Math.abs(h) * 0.4)}
          strokeWidth={1.6}
          strokeDasharray="6 5"
          initial={false}
        />

        {/* tangent line */}
        <motion.line
          animate={{ x1: tax1, y1: tay1, x2: tax2, y2: tay2 }}
          transition={SOFT_SPRING}
          stroke={T.red}
          strokeWidth={2}
          strokeOpacity={0.95}
          initial={false}
        />

        {/* point at x0 */}
        <motion.circle
          animate={{ cx: px0, cy: py0 }}
          transition={SOFT_SPRING}
          r={5}
          fill={T.ink}
          stroke="white"
          strokeWidth={2}
          initial={false}
        />
        {/* point at x0 + h */}
        <motion.circle
          animate={{ cx: pxh, cy: pyh }}
          transition={SOFT_SPRING}
          r={4}
          fill={T.green}
          initial={false}
        />

        {/* dashed drop lines */}
        <motion.line
          animate={{ x1: px0, x2: px0, y1: py0, y2: HALF }}
          transition={SOFT_SPRING}
          stroke={T.line}
          strokeDasharray="3 4"
          initial={false}
        />
      </svg>
      <div className="mt-2 text-[12px] text-[#666] tracking-tight text-center">
        {fn.expr}
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <Label>Function</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(Object.keys(FUNCS) as FuncId[]).map((id) => (
            <button
              key={id}
              onClick={() => setFuncId(id)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                funcId === id
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {FUNCS[id].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Point x₀</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">
            {x0.toFixed(2)}
          </span>
        </div>
        <Slider value={x0} min={-RANGE_X + 0.5} max={RANGE_X - 0.5} step={0.05} onChange={setX0} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Step h (secant)</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">
            {h.toFixed(3)}
          </span>
        </div>
        <Slider value={h} min={0.001} max={2} step={0.001} onChange={setH} />
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="The Derivative"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            f′(x₀) = lim<sub>h → 0</sub> ( f(x₀ + h) − f(x₀) ) / h
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            The green dashed secant connects two points on the curve. As h → 0, it rotates onto
            the red tangent — whose slope is the instantaneous rate of change.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums">
            <span className="text-[#999]">f(x₀)</span>
            <span className="text-[#222] text-right">{y0.toFixed(3)}</span>
            <span className="text-[#999]">f′(x₀)</span>
            <span className="text-[#222] text-right">{slope.toFixed(3)}</span>
            <span className="text-[#999]">secant slope</span>
            <span className="text-[#222] text-right">{secantSlope.toFixed(3)}</span>
            <span className="text-[#999]">|error|</span>
            <span
              className={[
                'text-right',
                err < 0.05 ? 'text-[#5CB85C]' : err < 0.5 ? 'text-[#222]' : 'text-[#D9534F]',
              ].join(' ')}
            >
              {err.toFixed(3)}
            </span>
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}

function Grid() {
  const lines: { x1: number; y1: number; x2: number; y2: number; major?: boolean }[] = []
  for (let i = -RANGE_X; i <= RANGE_X; i++) {
    const x = HALF + i * SCALE_X
    lines.push({ x1: x, y1: 0, x2: x, y2: SIZE, major: i === 0 })
  }
  for (let j = -Math.floor(RANGE_Y); j <= Math.floor(RANGE_Y); j++) {
    const y = HALF - j * SCALE_Y
    lines.push({ x1: 0, y1: y, x2: SIZE, y2: y, major: j === 0 })
  }
  return (
    <>
      {lines.map((ln, idx) => (
        <line
          key={idx}
          x1={ln.x1}
          y1={ln.y1}
          x2={ln.x2}
          y2={ln.y2}
          stroke={ln.major ? T.line : T.lineSoft}
          strokeWidth={ln.major ? 1.4 : 1}
          opacity={ln.major ? 1 : 0.7}
        />
      ))}
    </>
  )
}
