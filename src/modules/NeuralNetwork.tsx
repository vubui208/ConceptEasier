import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GhostButton, Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

const SIZE = 580

// Architecture: 2 → 5 → 4 → 1
const LAYERS = [2, 5, 4, 1] as const

type Network = {
  // weights[i] is a flat (out × in) matrix from layer i to layer i+1.
  weights: number[][]
  biases: number[][]
}

function randomNetwork(seed = Math.random()): Network {
  // Simple LCG for reproducibility per "seed"
  let s = Math.floor(seed * 1e9) >>> 0
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return (s / 0x100000000) * 2 - 1 // in [-1, 1]
  }
  const weights: number[][] = []
  const biases: number[][] = []
  for (let li = 0; li < LAYERS.length - 1; li++) {
    const inN = LAYERS[li]
    const outN = LAYERS[li + 1]
    const w: number[] = []
    for (let k = 0; k < inN * outN; k++) w.push(rng() * 1.4)
    weights.push(w)
    const b: number[] = []
    for (let k = 0; k < outN; k++) b.push(rng() * 0.4)
    biases.push(b)
  }
  return { weights, biases }
}

const relu = (x: number) => Math.max(0, x)

function forward(net: Network, input: number[]) {
  const activations: number[][] = [input.slice()]
  for (let li = 0; li < net.weights.length; li++) {
    const inN = LAYERS[li]
    const outN = LAYERS[li + 1]
    const W = net.weights[li]
    const b = net.biases[li]
    const inV = activations[activations.length - 1]
    const out: number[] = []
    for (let j = 0; j < outN; j++) {
      let z = b[j]
      for (let i = 0; i < inN; i++) {
        z += W[j * inN + i] * inV[i]
      }
      // Use ReLU on hidden layers; identity on the last layer for clarity.
      const a = li === net.weights.length - 1 ? z : relu(z)
      out.push(a)
    }
    activations.push(out)
  }
  return activations
}

export function NeuralNetworkModule() {
  const [seed, setSeed] = useState(0.31)
  const net = useMemo(() => randomNetwork(seed), [seed])
  const [x1, setX1] = useState(0.5)
  const [x2, setX2] = useState(-0.4)

  const acts = forward(net, [x1, x2])

  // Layout
  const PAD_X = 80
  const PAD_Y = 60
  const usableW = SIZE - 2 * PAD_X
  const usableH = SIZE - 2 * PAD_Y
  const layerXs = LAYERS.map((_, idx) => PAD_X + (idx / (LAYERS.length - 1)) * usableW)
  const NODE_R = 17
  const layout: { x: number; y: number }[][] = LAYERS.map((n, li) => {
    const xs = layerXs[li]
    const arr: { x: number; y: number }[] = []
    for (let j = 0; j < n; j++) {
      const y = PAD_Y + ((j + 0.5) * usableH) / n
      arr.push({ x: xs, y })
    }
    return arr
  })

  // Find max activation magnitude for normalisation
  let amax = 0
  for (const layer of acts) for (const v of layer) amax = Math.max(amax, Math.abs(v))
  amax = Math.max(amax, 0.01)

  // Find max weight magnitude per layer for scaling thickness
  const wmax = net.weights.map((w) => Math.max(0.01, ...w.map((v) => Math.abs(v))))

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[580px] aspect-square">
        {/* Edges */}
        {net.weights.map((W, li) => {
          const inN = LAYERS[li]
          const outN = LAYERS[li + 1]
          const inLayer = layout[li]
          const outLayer = layout[li + 1]
          const elements: React.ReactNode[] = []
          for (let j = 0; j < outN; j++) {
            for (let i = 0; i < inN; i++) {
              const w = W[j * inN + i]
              const a = inLayer[i]
              const b = outLayer[j]
              const thickness = 0.4 + (Math.abs(w) / wmax[li]) * 4
              elements.push(
                <motion.line
                  key={`e-${li}-${j}-${i}`}
                  animate={{
                    x1: a.x,
                    y1: a.y,
                    x2: b.x,
                    y2: b.y,
                    stroke: w >= 0 ? T.ink : T.red,
                    strokeOpacity: 0.25 + (Math.abs(w) / wmax[li]) * 0.55,
                    strokeWidth: thickness,
                  }}
                  transition={SOFT_SPRING}
                  initial={false}
                />,
              )
            }
          }
          return elements
        })}

        {/* Nodes */}
        {layout.map((layer, li) =>
          layer.map((p, ni) => {
            const a = acts[li][ni]
            const intensity = Math.min(1, Math.abs(a) / amax)
            const fill = a >= 0 ? T.ink : T.red
            return (
              <g key={`n-${li}-${ni}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={NODE_R}
                  fill={fill}
                  fillOpacity={0.1 + intensity * 0.8}
                  stroke={T.ink}
                  strokeWidth={1}
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fill={intensity > 0.5 ? 'white' : T.ink}
                >
                  {a.toFixed(2)}
                </text>
              </g>
            )
          }),
        )}

        {/* Layer labels */}
        {LAYERS.map((_, li) => (
          <text
            key={`L-${li}`}
            x={layerXs[li]}
            y={PAD_Y - 14}
            textAnchor="middle"
            fontSize={10}
            fill="#999"
          >
            {li === 0 ? 'input' : li === LAYERS.length - 1 ? 'output' : `hidden ${li}`}
          </text>
        ))}
      </svg>
      <div className="mt-2 text-[11.5px] text-[#666] tracking-tight text-center">
        Edge thickness = |weight|. Edge colour = sign (red negative). Node opacity = activation magnitude.
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <Label>Inputs</Label>
        <div className="grid grid-cols-1 gap-3 mt-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#666]">x₁</span>
              <span className="text-[11px] font-mono text-[#222] tabular-nums">{x1.toFixed(2)}</span>
            </div>
            <Slider value={x1} min={-2} max={2} step={0.05} onChange={setX1} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#666]">x₂</span>
              <span className="text-[11px] font-mono text-[#222] tabular-nums">{x2.toFixed(2)}</span>
            </div>
            <Slider value={x2} min={-2} max={2} step={0.05} onChange={setX2} />
          </div>
        </div>
      </div>

      <GhostButton onClick={() => setSeed(Math.random())} className="w-full justify-center">
        <Shuffle size={13} strokeWidth={1.6} /> Resample weights
      </GhostButton>

      <div className="flex items-center justify-between font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#999]">output ŷ</span>
        <span className="text-[#222]">{acts[acts.length - 1][0].toFixed(3)}</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Neural Network Forward Pass"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            a<sup>(ℓ+1)</sup> = ReLU( W<sup>(ℓ)</sup> a<sup>(ℓ)</sup> + b<sup>(ℓ)</sup> )
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            Each layer is an affine map (Wx + b) followed by an elementwise nonlinearity. Stack
            them and the network can fit arbitrarily complex functions.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#666] leading-relaxed">
            Architecture here: 2 → 5 → 4 → 1, ReLU on hidden layers, linear output. "Resample
            weights" mimics what training would adjust.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
