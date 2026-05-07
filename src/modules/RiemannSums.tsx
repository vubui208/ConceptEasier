import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { T } from '../shared/tokens'

type FuncId = 'parabola' | 'bell' | 'half-sine' | 'cubic'
type Method = 'left' | 'right' | 'mid' | 'trap'

const FUNCS: Record<
  FuncId,
  { label: string; expr: string; f: (x: number) => number; F: (x: number) => number; range: [number, number] }
> = {
  parabola: {
    label: 'x²',
    expr: '∫ x² dx = x³/3',
    f: (x) => x * x,
    F: (x) => (x * x * x) / 3,
    range: [0, 2],
  },
  bell: {
    label: '1/(1+x²)',
    expr: '∫ 1/(1+x²) dx = arctan x',
    f: (x) => 1 / (1 + x * x),
    F: (x) => Math.atan(x),
    range: [-2, 2],
  },
  'half-sine': {
    label: 'sin x',
    expr: '∫ sin x dx = −cos x',
    f: (x) => Math.sin(x),
    F: (x) => -Math.cos(x),
    range: [0, Math.PI],
  },
  cubic: {
    label: 'x − x³/4',
    expr: '∫ (x − x³/4) dx = x²/2 − x⁴/16',
    f: (x) => x - (x * x * x) / 4,
    F: (x) => (x * x) / 2 - (x * x * x * x) / 16,
    range: [0, 2],
  },
}

const SIZE = 560
const PAD_X = 50
const PAD_Y = 50
const PLOT_W = SIZE - PAD_X * 2
const PLOT_H = SIZE - PAD_Y * 2

export function RiemannSumsModule() {
  const [funcId, setFuncId] = useState<FuncId>('parabola')
  const [n, setN] = useState(8)
  const [method, setMethod] = useState<Method>('left')

  const fn = FUNCS[funcId]
  const [a, b] = fn.range

  // Sample y over a generous range to find a y-axis scale that contains the curve.
  let yMin = 0
  let yMax = 0
  for (let i = 0; i <= 200; i++) {
    const x = a + (i / 200) * (b - a)
    const y = fn.f(x)
    if (y < yMin) yMin = y
    if (y > yMax) yMax = y
  }
  // Pad slightly so curves don't touch edges.
  yMax = yMax + Math.abs(yMax) * 0.1 + 0.05
  yMin = yMin - Math.abs(yMin) * 0.1
  const ySpan = yMax - yMin || 1

  const toX = (x: number) => PAD_X + ((x - a) / (b - a)) * PLOT_W
  const toY = (y: number) => PAD_Y + (1 - (y - yMin) / ySpan) * PLOT_H
  const Y0 = toY(0)

  // Curve points
  const curvePts: string[] = []
  for (let i = 0; i <= 240; i++) {
    const x = a + (i / 240) * (b - a)
    const y = fn.f(x)
    curvePts.push(`${toX(x)},${toY(y)}`)
  }

  // Riemann rectangles or trapezoids
  const dx = (b - a) / n
  const rects: { x: number; y: number; w: number; h: number; sign: 1 | -1 }[] = []
  const trapPts: { x: number; y: number }[] = []
  let sum = 0
  if (method === 'trap') {
    for (let i = 0; i <= n; i++) {
      const x = a + i * dx
      const y = fn.f(x)
      trapPts.push({ x, y })
      if (i > 0) {
        const yPrev = fn.f(a + (i - 1) * dx)
        sum += (dx * (yPrev + y)) / 2
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      const xL = a + i * dx
      const xR = xL + dx
      const xS = method === 'left' ? xL : method === 'right' ? xR : xL + dx / 2
      const y = fn.f(xS)
      sum += y * dx
      const top = Math.max(0, y)
      const bottom = Math.min(0, y)
      const px = toX(xL)
      const py = toY(top)
      const pyBottom = toY(bottom)
      rects.push({
        x: px,
        y: py,
        w: toX(xR) - px,
        h: Math.abs(pyBottom - py),
        sign: y >= 0 ? 1 : -1,
      })
    }
  }

  const trueIntegral = fn.F(b) - fn.F(a)
  const err = sum - trueIntegral

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {/* axes */}
        <line x1={PAD_X} y1={Y0} x2={SIZE - PAD_X} y2={Y0} stroke={T.line} strokeWidth={1.4} />
        <line x1={PAD_X} y1={PAD_Y} x2={PAD_X} y2={SIZE - PAD_Y} stroke={T.line} strokeWidth={1.4} />

        {/* rectangles */}
        {method !== 'trap' &&
          rects.map((r, i) => (
            <rect
              key={i}
              x={r.x + 0.5}
              y={r.y}
              width={Math.max(0, r.w - 1)}
              height={r.h}
              fill={r.sign > 0 ? T.ink : T.red}
              fillOpacity={0.18}
              stroke={r.sign > 0 ? T.ink : T.red}
              strokeOpacity={0.45}
              strokeWidth={1}
            />
          ))}

        {/* trapezoids — one polygon per slab */}
        {method === 'trap' &&
          trapPts.slice(0, -1).map((p, i) => {
            const q = trapPts[i + 1]
            const x1 = toX(p.x)
            const x2 = toX(q.x)
            const y1 = toY(p.y)
            const y2 = toY(q.y)
            const positive = (p.y + q.y) / 2 >= 0
            return (
              <polygon
                key={i}
                points={`${x1},${Y0} ${x1},${y1} ${x2},${y2} ${x2},${Y0}`}
                fill={positive ? T.ink : T.red}
                fillOpacity={0.18}
                stroke={positive ? T.ink : T.red}
                strokeOpacity={0.45}
                strokeWidth={1}
              />
            )
          })}

        {/* curve */}
        <polyline
          points={curvePts.join(' ')}
          fill="none"
          stroke={T.ink}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />

        {/* a / b ticks */}
        <text x={toX(a)} y={Y0 + 18} fontSize={11} textAnchor="middle" fill="#999">
          {a === 0 ? '0' : a === Math.PI ? 'π' : a.toFixed(2)}
        </text>
        <text x={toX(b)} y={Y0 + 18} fontSize={11} textAnchor="middle" fill="#999">
          {b === Math.PI ? 'π' : b.toFixed(2)}
        </text>
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
                'h-8 text-[11px] tracking-tight rounded-md border transition-all',
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
        <Label>Method</Label>
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {(['left', 'right', 'mid', 'trap'] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={[
                'h-8 text-[11px] tracking-tight rounded-md border transition-all',
                method === m
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {m === 'mid' ? 'Mid' : m === 'trap' ? 'Trap' : m === 'left' ? 'Left' : 'Right'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Subintervals (n)</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{n}</span>
        </div>
        <Slider value={n} min={2} max={80} step={1} onChange={setN} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#999]">Approximation</span>
        <span className="text-[#222] text-right">{sum.toFixed(4)}</span>
        <span className="text-[#999]">True ∫</span>
        <span className="text-[#222] text-right">{trueIntegral.toFixed(4)}</span>
        <span className="text-[#999]">|error|</span>
        <span
          className={[
            'text-right',
            Math.abs(err) < 0.01
              ? 'text-[#5CB85C]'
              : Math.abs(err) < 0.1
              ? 'text-[#222]'
              : 'text-[#D9534F]',
          ].join(' ')}
        >
          {Math.abs(err).toFixed(4)}
        </span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Riemann Integral"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            ∫<sub>a</sub><sup>b</sup> f(x) dx = lim<sub>n → ∞</sub> Σ f(xᵢ*) · Δx
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            The interval [a, b] is sliced into n equal pieces of width Δx = (b − a)/n. Each slice
            contributes a rectangle of height f(xᵢ*); the choice of xᵢ* (left, right, mid)
            controls bias.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#666] leading-relaxed">
            Midpoint and trapezoidal rules converge faster than left/right — error is O(1/n²) vs
            O(1/n).
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
