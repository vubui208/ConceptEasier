import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { T } from '../shared/tokens'

type ActId = 'sigmoid' | 'tanh' | 'relu' | 'leakyRelu' | 'gelu' | 'softplus'

type ActDef = {
  id: ActId
  label: string
  expr: string
  f: (x: number) => number
  df: (x: number) => number
  blurb: string
}

function gelu(x: number) {
  // Tanh approximation, common in NN libs.
  const c = Math.sqrt(2 / Math.PI)
  return 0.5 * x * (1 + Math.tanh(c * (x + 0.044715 * x * x * x)))
}
function geluDeriv(x: number) {
  // Numerical derivative for visualization.
  const eps = 1e-3
  return (gelu(x + eps) - gelu(x - eps)) / (2 * eps)
}

const ACTS: Record<ActId, ActDef> = {
  sigmoid: {
    id: 'sigmoid',
    label: 'Sigmoid',
    expr: 'σ(x) = 1 / (1 + e⁻ˣ)',
    f: (x) => 1 / (1 + Math.exp(-x)),
    df: (x) => {
      const s = 1 / (1 + Math.exp(-x))
      return s * (1 - s)
    },
    blurb: 'Squashes ℝ → (0, 1). Saturates for |x| ≫ 0 → vanishing gradients.',
  },
  tanh: {
    id: 'tanh',
    label: 'tanh',
    expr: 'tanh(x) = (eˣ − e⁻ˣ) / (eˣ + e⁻ˣ)',
    f: (x) => Math.tanh(x),
    df: (x) => 1 - Math.tanh(x) ** 2,
    blurb: 'Zero-centred sigmoid; (-1, 1). Steeper near 0 helps optimisation.',
  },
  relu: {
    id: 'relu',
    label: 'ReLU',
    expr: 'ReLU(x) = max(0, x)',
    f: (x) => Math.max(0, x),
    df: (x) => (x > 0 ? 1 : 0),
    blurb: 'Cheap and unbounded above. "Dying ReLU" for x < 0 — gradient = 0.',
  },
  leakyRelu: {
    id: 'leakyRelu',
    label: 'Leaky ReLU',
    expr: 'LReLU(x) = max(0.01 x, x)',
    f: (x) => (x >= 0 ? x : 0.01 * x),
    df: (x) => (x >= 0 ? 1 : 0.01),
    blurb: 'Small negative slope keeps gradient alive when x < 0.',
  },
  gelu: {
    id: 'gelu',
    label: 'GELU',
    expr: 'GELU(x) ≈ 0.5 x (1 + tanh(√(2/π)(x + 0.0447 x³)))',
    f: gelu,
    df: geluDeriv,
    blurb: 'Smooth ReLU-like function used in transformers (GPT, BERT).',
  },
  softplus: {
    id: 'softplus',
    label: 'Softplus',
    expr: 'softplus(x) = ln(1 + eˣ)',
    f: (x) => Math.log(1 + Math.exp(x)),
    df: (x) => 1 / (1 + Math.exp(-x)),
    blurb: "Smooth approximation to ReLU. Derivative is the sigmoid.",
  },
}

const SIZE = 560
const PAD = 50
const W = SIZE - 2 * PAD
const H = SIZE - 2 * PAD
const RANGE_X: [number, number] = [-5, 5]
const RANGE_Y: [number, number] = [-1.5, 2.5]

const toX = (x: number) => PAD + ((x - RANGE_X[0]) / (RANGE_X[1] - RANGE_X[0])) * W
const toY = (y: number) => PAD + (1 - (y - RANGE_Y[0]) / (RANGE_Y[1] - RANGE_Y[0])) * H

export function ActivationModule() {
  const [actId, setActId] = useState<ActId>('relu')
  const [showDeriv, setShowDeriv] = useState(true)
  const [x0, setX0] = useState(0)
  const a = ACTS[actId]

  const N = 240
  const fPts: string[] = []
  const dfPts: string[] = []
  for (let i = 0; i <= N; i++) {
    const x = RANGE_X[0] + (i / N) * (RANGE_X[1] - RANGE_X[0])
    fPts.push(`${toX(x)},${toY(a.f(x))}`)
    dfPts.push(`${toX(x)},${toY(a.df(x))}`)
  }
  const yX = a.f(x0)
  const dyX = a.df(x0)

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {/* axes */}
        <line x1={PAD} y1={toY(0)} x2={SIZE - PAD} y2={toY(0)} stroke={T.line} strokeWidth={1.2} />
        <line x1={toX(0)} y1={PAD} x2={toX(0)} y2={SIZE - PAD} stroke={T.line} strokeWidth={1.2} />
        <rect x={PAD} y={PAD} width={W} height={H} fill="none" stroke={T.line} strokeWidth={1} />

        {/* derivative (faint, dashed) */}
        {showDeriv && (
          <polyline
            points={dfPts.join(' ')}
            fill="none"
            stroke={T.green}
            strokeWidth={1.6}
            strokeDasharray="4 4"
          />
        )}
        {/* function */}
        <polyline points={fPts.join(' ')} fill="none" stroke={T.ink} strokeWidth={2} />

        {/* current point */}
        <line x1={toX(x0)} y1={toY(yX)} x2={toX(x0)} y2={toY(0)} stroke={T.line} strokeDasharray="3 3" />
        <circle cx={toX(x0)} cy={toY(yX)} r={5} fill={T.ink} stroke="white" strokeWidth={2} />
        {showDeriv && <circle cx={toX(x0)} cy={toY(dyX)} r={4} fill={T.green} />}

        {/* axis labels */}
        <text x={SIZE - PAD - 4} y={toY(0) - 6} fontSize={11} fill="#999" textAnchor="end">
          x
        </text>
        <text x={toX(0) + 6} y={PAD + 12} fontSize={11} fill="#999">
          y
        </text>
      </svg>
      <div className="mt-2 text-[12px] text-[#666] tracking-tight text-center">
        {a.expr}
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <Label>Activation</Label>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {(Object.keys(ACTS) as ActId[]).map((id) => (
            <button
              key={id}
              onClick={() => setActId(id)}
              className={[
                'h-8 text-[10.5px] tracking-tight rounded-md border transition-all',
                actId === id
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {ACTS[id].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Probe x</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{x0.toFixed(2)}</span>
        </div>
        <Slider value={x0} min={RANGE_X[0]} max={RANGE_X[1]} step={0.05} onChange={setX0} />
      </div>

      <div>
        <button
          onClick={() => setShowDeriv((d) => !d)}
          className={[
            'h-8 w-full text-[11.5px] tracking-tight rounded-md border transition-all',
            showDeriv
              ? 'bg-[#222]/[0.06] border-[#222]'
              : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
          ].join(' ')}
        >
          {showDeriv ? '✓ ' : ''}Show derivative (green dashed)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#999]">f(x)</span>
        <span className="text-right">{yX.toFixed(3)}</span>
        <span className="text-[#999]">f′(x)</span>
        <span className="text-[#5CB85C] text-right">{dyX.toFixed(3)}</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Activation Functions"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div>{a.blurb}</div>
          <div className="text-[11.5px] text-[#999] mt-2 leading-relaxed border-t border-[#E5E5E5] pt-2">
            The derivative determines how gradient flows during backprop. ReLU's flat zero on
            the left side is the source of "dying neurons"; smoother variants (GELU, Softplus)
            keep gradient everywhere.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
