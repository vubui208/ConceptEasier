import { useMemo, useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { T } from '../shared/tokens'

type FuncId = 'removable' | 'sinc' | 'cont' | 'one-cos'

type FuncDef = {
  id: FuncId
  label: string
  expr: string
  // f, but with x = a treated as a removable point — return L at a, or null if undefined.
  f: (x: number) => number | null
  a: number
  L: number
  // hole? If the function is undefined exactly at a, draw an open circle.
  hole: boolean
  xRange: [number, number]
  yRange: [number, number]
}

const FUNCS: Record<FuncId, FuncDef> = {
  removable: {
    id: 'removable',
    label: '(x² − 1)/(x − 1)',
    expr: 'lim x→1  (x² − 1)/(x − 1) = 2   (removable hole at x = 1)',
    f: (x) => {
      if (Math.abs(x - 1) < 1e-9) return null
      return (x * x - 1) / (x - 1)
    },
    a: 1,
    L: 2,
    hole: true,
    xRange: [-1.5, 3.5],
    yRange: [-1, 5],
  },
  sinc: {
    id: 'sinc',
    label: 'sin x / x',
    expr: 'lim x→0  sin x / x = 1',
    f: (x) => {
      if (Math.abs(x) < 1e-9) return null
      return Math.sin(x) / x
    },
    a: 0,
    L: 1,
    hole: true,
    xRange: [-2.5, 2.5],
    yRange: [-0.4, 1.3],
  },
  cont: {
    id: 'cont',
    label: 'x²',
    expr: 'lim x→2  x² = 4   (continuous)',
    f: (x) => x * x,
    a: 2,
    L: 4,
    hole: false,
    xRange: [0, 3.5],
    yRange: [-0.5, 12],
  },
  'one-cos': {
    id: 'one-cos',
    label: '(1 − cos x)/x²',
    expr: 'lim x→0  (1 − cos x)/x² = ½',
    f: (x) => {
      if (Math.abs(x) < 1e-9) return null
      return (1 - Math.cos(x)) / (x * x)
    },
    a: 0,
    L: 0.5,
    hole: true,
    xRange: [-2.5, 2.5],
    yRange: [-0.05, 0.7],
  },
}

const SIZE = 560
const PAD = 50

export function LimitConvergenceModule() {
  const [funcId, setFuncId] = useState<FuncId>('removable')
  const [eps, setEps] = useState(0.5)
  const fn = FUNCS[funcId]
  const [xLo, xHi] = fn.xRange
  const [yLo, yHi] = fn.yRange

  const xSpan = xHi - xLo
  const ySpan = yHi - yLo
  const toX = (x: number) => PAD + ((x - xLo) / xSpan) * (SIZE - 2 * PAD)
  const toY = (y: number) => PAD + (1 - (y - yLo) / ySpan) * (SIZE - 2 * PAD)

  const curvePts = useMemo(() => {
    const arr: string[] = []
    let started = false
    let cur: string[] = []
    const segments: string[][] = []
    const N = 320
    for (let i = 0; i <= N; i++) {
      const x = xLo + (i / N) * xSpan
      const y = fn.f(x)
      if (y === null || y < yLo - 1 || y > yHi + 1) {
        if (started) {
          segments.push(cur)
          cur = []
          started = false
        }
        continue
      }
      cur.push(`${toX(x)},${toY(y)}`)
      started = true
    }
    if (started) segments.push(cur)
    void arr
    return segments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcId])

  // Find largest δ such that for x in (a − δ, a + δ) \ {a}, |f(x) − L| < ε.
  // Scan outward symmetrically from a in fine steps; δ = closest violation.
  const delta = useMemo(() => {
    const STEP = (xHi - xLo) / 1500
    let dx = STEP
    while (a_plus(fn, dx) && a_minus(fn, dx) && dx < (xHi - xLo) * 0.4) {
      const within =
        violates(fn, fn.a + dx, eps) === false && violates(fn, fn.a - dx, eps) === false
      if (!within) break
      dx += STEP
    }
    return dx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcId, eps])

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {/* axes */}
        <line
          x1={PAD}
          y1={toY(0)}
          x2={SIZE - PAD}
          y2={toY(0)}
          stroke={T.line}
          strokeWidth={1.2}
        />
        <line
          x1={toX(0)}
          y1={PAD}
          x2={toX(0)}
          y2={SIZE - PAD}
          stroke={T.line}
          strokeWidth={1.2}
        />

        {/* ε horizontal band */}
        <rect
          x={PAD}
          y={toY(fn.L + eps)}
          width={SIZE - 2 * PAD}
          height={Math.max(0, toY(fn.L - eps) - toY(fn.L + eps))}
          fill={T.green}
          fillOpacity={0.12}
        />
        <line
          x1={PAD}
          y1={toY(fn.L + eps)}
          x2={SIZE - PAD}
          y2={toY(fn.L + eps)}
          stroke={T.green}
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />
        <line
          x1={PAD}
          y1={toY(fn.L - eps)}
          x2={SIZE - PAD}
          y2={toY(fn.L - eps)}
          stroke={T.green}
          strokeWidth={1.2}
          strokeDasharray="4 4"
        />

        {/* δ vertical band */}
        <rect
          x={toX(fn.a - delta)}
          y={PAD}
          width={Math.max(0, toX(fn.a + delta) - toX(fn.a - delta))}
          height={SIZE - 2 * PAD}
          fill={T.red}
          fillOpacity={0.08}
        />
        <line
          x1={toX(fn.a - delta)}
          y1={PAD}
          x2={toX(fn.a - delta)}
          y2={SIZE - PAD}
          stroke={T.red}
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity={0.8}
        />
        <line
          x1={toX(fn.a + delta)}
          y1={PAD}
          x2={toX(fn.a + delta)}
          y2={SIZE - PAD}
          stroke={T.red}
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity={0.8}
        />

        {/* the L-line and a-line */}
        <line
          x1={PAD}
          y1={toY(fn.L)}
          x2={SIZE - PAD}
          y2={toY(fn.L)}
          stroke={T.ink}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
        <line
          x1={toX(fn.a)}
          y1={PAD}
          x2={toX(fn.a)}
          y2={SIZE - PAD}
          stroke={T.ink}
          strokeOpacity={0.35}
          strokeWidth={1}
        />

        {/* curve */}
        {curvePts.map((seg, i) => (
          <polyline
            key={i}
            points={seg.join(' ')}
            fill="none"
            stroke={T.ink}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

        {/* limit dot — open if hole, filled otherwise */}
        {fn.hole ? (
          <circle
            cx={toX(fn.a)}
            cy={toY(fn.L)}
            r={5}
            fill="white"
            stroke={T.ink}
            strokeWidth={1.5}
          />
        ) : (
          <circle cx={toX(fn.a)} cy={toY(fn.L)} r={4.5} fill={T.ink} />
        )}

        {/* axis labels */}
        <text x={toX(fn.a)} y={toY(0) + 16} fontSize={11} textAnchor="middle" fill="#999">
          a = {fn.a}
        </text>
        <text x={toX(0) - 8} y={toY(fn.L) + 4} fontSize={11} textAnchor="end" fill="#999">
          L = {fn.L}
        </text>
      </svg>

      <div className="mt-2 text-[12px] text-[#666] tracking-tight text-center max-w-[640px]">
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
        <div className="flex items-center justify-between">
          <Label>Tolerance ε</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">
            {eps.toFixed(3)}
          </span>
        </div>
        <Slider value={eps} min={0.005} max={1} step={0.005} onChange={setEps} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#999]">a</span>
        <span className="text-[#222] text-right">{fn.a}</span>
        <span className="text-[#999]">L</span>
        <span className="text-[#222] text-right">{fn.L}</span>
        <span className="text-[#999]">ε (chosen)</span>
        <span className="text-[#222] text-right">{eps.toFixed(3)}</span>
        <span className="text-[#999]">δ (largest)</span>
        <span className="text-[#5CB85C] text-right">{delta.toFixed(3)}</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Limit · ε–δ Definition"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222] leading-snug">
            ∀ ε &gt; 0 ∃ δ &gt; 0 :
            <br />
            0 &lt; |x − a| &lt; δ ⟹ |f(x) − L| &lt; ε
          </div>
          <div className="text-[11.5px] text-[#999] mt-2 leading-relaxed">
            Pick any vertical tolerance ε around L (green band). Then there exists a horizontal
            window of width 2δ around a (red band) such that every point of f inside that
            window stays inside the green band. Shrink ε — δ shrinks too.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}

function violates(fn: FuncDef, x: number, eps: number): boolean {
  const y = fn.f(x)
  if (y === null) return false
  return Math.abs(y - fn.L) >= eps
}

// Helpers for symmetric scan — kept simple/explicit for readability.
function a_plus(fn: FuncDef, dx: number) {
  return fn.a + dx <= fn.xRange[1]
}
function a_minus(fn: FuncDef, dx: number) {
  return fn.a - dx >= fn.xRange[0]
}
