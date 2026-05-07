import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { T } from '../shared/tokens'

type FuncId = 'exp' | 'sin' | 'cos' | 'log1p' | 'geom'

type FuncDef = {
  id: FuncId
  label: string
  expr: string
  f: (x: number) => number
  // k-th Taylor coefficient evaluated at center a, multiplying (x − a)^k
  coeff: (a: number, k: number) => number
  yRange: [number, number]
  // optional domain restriction (for log1p, geom)
  defined: (x: number) => boolean
}

function factorial(k: number) {
  let r = 1
  for (let i = 2; i <= k; i++) r *= i
  return r
}

const FUNCS: Record<FuncId, FuncDef> = {
  exp: {
    id: 'exp',
    label: 'eˣ',
    expr: 'eˣ = Σ xᵏ / k!',
    f: (x) => Math.exp(x),
    coeff: (a, k) => Math.exp(a) / factorial(k),
    yRange: [-1, 8],
    defined: () => true,
  },
  sin: {
    id: 'sin',
    label: 'sin x',
    expr: 'sin x = x − x³/3! + x⁵/5! − ⋯',
    f: (x) => Math.sin(x),
    // k-th derivative of sin at a is sin(a + kπ/2)
    coeff: (a, k) => Math.sin(a + (k * Math.PI) / 2) / factorial(k),
    yRange: [-2, 2],
    defined: () => true,
  },
  cos: {
    id: 'cos',
    label: 'cos x',
    expr: 'cos x = 1 − x²/2! + x⁴/4! − ⋯',
    f: (x) => Math.cos(x),
    coeff: (a, k) => Math.cos(a + (k * Math.PI) / 2) / factorial(k),
    yRange: [-2, 2],
    defined: () => true,
  },
  log1p: {
    id: 'log1p',
    label: 'ln(1 + x)',
    expr: 'ln(1 + x) = x − x²/2 + x³/3 − ⋯  (|x| < 1 around 0)',
    f: (x) => Math.log(1 + x),
    // k-th derivative of ln(1+x) at a is (-1)^(k-1) (k-1)! / (1+a)^k for k ≥ 1
    coeff: (a, k) => {
      if (k === 0) return Math.log(1 + a)
      const sign = k % 2 === 1 ? 1 : -1
      return (sign * factorial(k - 1)) / Math.pow(1 + a, k) / factorial(k)
    },
    yRange: [-3, 2.5],
    defined: (x) => x > -0.999,
  },
  geom: {
    id: 'geom',
    label: '1/(1 − x)',
    expr: '1/(1 − x) = 1 + x + x² + ⋯  (|x| < 1)',
    f: (x) => 1 / (1 - x),
    // k-th derivative is k! / (1 − a)^(k+1)
    coeff: (a, k) => 1 / Math.pow(1 - a, k + 1),
    yRange: [-3, 6],
    defined: (x) => Math.abs(1 - x) > 0.02,
  },
}

const SIZE = 560
const HALF = SIZE / 2
const RANGE_X = 4
const SCALE_X = SIZE / (2 * RANGE_X)

export function TaylorSeriesModule() {
  const [funcId, setFuncId] = useState<FuncId>('exp')
  const [a, setA] = useState(0)
  const [N, setN] = useState(3)
  const fn = FUNCS[funcId]

  const [yLo, yHi] = fn.yRange
  const ySpan = yHi - yLo
  const SCALE_Y = SIZE / ySpan
  const Y0_PX = (yHi / ySpan) * SIZE // pixel-y for y = 0

  const toPx = (x: number, y: number) =>
    [HALF + x * SCALE_X, Y0_PX - y * SCALE_Y] as const

  const truePts: string[] = []
  const taylorPts: string[] = []
  const STEPS = 280
  for (let i = 0; i <= STEPS; i++) {
    const x = -RANGE_X + (i / STEPS) * (2 * RANGE_X)
    if (fn.defined(x)) {
      const y = fn.f(x)
      if (y >= yLo - 1 && y <= yHi + 1) {
        const [px, py] = toPx(x, y)
        truePts.push(`${px},${py}`)
      }
    }
    // Taylor partial sum
    let T_x = 0
    let pow = 1
    for (let k = 0; k <= N; k++) {
      T_x += fn.coeff(a, k) * pow
      pow *= x - a
    }
    if (T_x >= yLo - 1 && T_x <= yHi + 1) {
      const [px, py] = toPx(x, T_x)
      taylorPts.push(`${px},${py}`)
    }
  }

  const [pxA, pyA] = toPx(a, fn.f(a))

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {/* grid */}
        {Array.from({ length: 2 * RANGE_X + 1 }, (_, i) => {
          const x = HALF + (i - RANGE_X) * SCALE_X
          return (
            <line
              key={`vx-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={SIZE}
              stroke={i === RANGE_X ? T.line : T.lineSoft}
              strokeWidth={i === RANGE_X ? 1.4 : 1}
            />
          )
        })}
        {/* horizontal grid every 1 unit */}
        {Array.from({ length: Math.ceil(ySpan) + 1 }, (_, j) => {
          const y = Math.floor(yHi) - j
          if (y < yLo || y > yHi) return null
          const py = Y0_PX - y * SCALE_Y
          return (
            <line
              key={`hy-${j}`}
              x1={0}
              y1={py}
              x2={SIZE}
              y2={py}
              stroke={y === 0 ? T.line : T.lineSoft}
              strokeWidth={y === 0 ? 1.4 : 1}
            />
          )
        })}

        {/* True function (light) */}
        <polyline
          points={truePts.join(' ')}
          fill="none"
          stroke={T.ink}
          strokeOpacity={0.35}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Taylor approximation */}
        <polyline
          points={taylorPts.join(' ')}
          fill="none"
          stroke={T.red}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />

        {/* center vertical guideline */}
        <line
          x1={HALF + a * SCALE_X}
          y1={0}
          x2={HALF + a * SCALE_X}
          y2={SIZE}
          stroke={T.green}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.7}
        />

        {/* center point on curve */}
        <circle cx={pxA} cy={pyA} r={5} fill={T.green} stroke="white" strokeWidth={2} />
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
        <div className="flex items-center justify-between">
          <Label>Center a</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{a.toFixed(2)}</span>
        </div>
        <Slider value={a} min={-RANGE_X + 0.5} max={RANGE_X - 0.5} step={0.05} onChange={setA} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Order N</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{N}</span>
        </div>
        <Slider value={N} min={0} max={15} step={1} onChange={setN} />
      </div>

      <div className="text-[11.5px] text-[#999] leading-relaxed pt-2 border-t border-[#E5E5E5]">
        Taylor at {a.toFixed(2)}, order {N}. The red curve is exact at x = a, and increasingly
        accurate near it.
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Taylor Series"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            f(x) = Σ<sub>k=0</sub><sup>∞</sup> f<sup>(k)</sup>(a) (x − a)<sup>k</sup> / k!
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            A polynomial of degree N agrees with f and its first N derivatives at x = a. Adding
            terms shrinks the error inside the radius of convergence.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#666] leading-relaxed">
            For ln(1 + x) and 1/(1 − x), the series only converges for |x − a| less than the
            distance to the nearest singularity — try moving a near the boundary to watch
            divergence outside that radius.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
