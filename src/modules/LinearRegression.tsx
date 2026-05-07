import { motion } from 'framer-motion'
import { Plus, Shuffle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { GhostButton, LogicBox, ModuleLayout } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

const SIZE = 560
const PAD = 50
const PLOT_W = SIZE - 2 * PAD
const PLOT_H = SIZE - 2 * PAD
const RANGE_X: [number, number] = [-1, 9]
const RANGE_Y: [number, number] = [-1, 9]

type Pt = { id: string; x: number; y: number }

function defaultPoints(): Pt[] {
  // Roughly y ≈ 0.6 x + 1 with noise
  const arr: Pt[] = []
  for (let i = 0; i < 12; i++) {
    const x = 0.5 + Math.random() * 7.5
    const y = 0.6 * x + 1 + (Math.random() - 0.5) * 1.6
    arr.push({ id: `p-${i}-${Math.random().toString(36).slice(2, 5)}`, x, y })
  }
  return arr
}

export function LinearRegressionModule() {
  const [pts, setPts] = useState<Pt[]>(() => defaultPoints())

  const toX = (x: number) => PAD + ((x - RANGE_X[0]) / (RANGE_X[1] - RANGE_X[0])) * PLOT_W
  const toY = (y: number) => PAD + (1 - (y - RANGE_Y[0]) / (RANGE_Y[1] - RANGE_Y[0])) * PLOT_H

  // OLS: m = cov(x, y) / var(x); b = mean(y) - m * mean(x)
  let m = 0
  let bIntercept = 0
  let r2 = 0
  if (pts.length >= 2) {
    const n = pts.length
    let sx = 0
    let sy = 0
    for (const p of pts) {
      sx += p.x
      sy += p.y
    }
    const mx = sx / n
    const my = sy / n
    let sxy = 0
    let sxx = 0
    let syy = 0
    for (const p of pts) {
      sxy += (p.x - mx) * (p.y - my)
      sxx += (p.x - mx) ** 2
      syy += (p.y - my) ** 2
    }
    if (sxx > 1e-9) {
      m = sxy / sxx
      bIntercept = my - m * mx
      r2 = syy > 1e-9 ? (sxy * sxy) / (sxx * syy) : 0
    }
  }

  const xLine1 = RANGE_X[0]
  const xLine2 = RANGE_X[1]
  const yLine1 = m * xLine1 + bIntercept
  const yLine2 = m * xLine2 + bIntercept

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
          if (sx < PAD || sx > SIZE - PAD || sy < PAD || sy > SIZE - PAD) return
          const xMath =
            RANGE_X[0] + ((sx - PAD) / PLOT_W) * (RANGE_X[1] - RANGE_X[0])
          const yMath =
            RANGE_Y[0] + (1 - (sy - PAD) / PLOT_H) * (RANGE_Y[1] - RANGE_Y[0])
          setPts((p) => [
            ...p,
            { id: `p-${Date.now().toString(36)}-${p.length}`, x: xMath, y: yMath },
          ])
        }}
      >
        {/* axes + grid */}
        <line x1={PAD} y1={toY(0)} x2={SIZE - PAD} y2={toY(0)} stroke={T.line} strokeWidth={1} />
        <line x1={toX(0)} y1={PAD} x2={toX(0)} y2={SIZE - PAD} stroke={T.line} strokeWidth={1} />
        <rect x={PAD} y={PAD} width={PLOT_W} height={PLOT_H} fill="none" stroke={T.line} strokeWidth={1} />

        {/* residuals (error stems) */}
        {pts.map((p) => {
          const yPred = m * p.x + bIntercept
          return (
            <line
              key={`res-${p.id}`}
              x1={toX(p.x)}
              y1={toY(p.y)}
              x2={toX(p.x)}
              y2={toY(yPred)}
              stroke={T.red}
              strokeOpacity={0.4}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          )
        })}

        {/* fit line */}
        {pts.length >= 2 && (
          <motion.line
            animate={{
              x1: toX(xLine1),
              y1: toY(yLine1),
              x2: toX(xLine2),
              y2: toY(yLine2),
            }}
            transition={SOFT_SPRING}
            stroke={T.ink}
            strokeWidth={2}
            initial={false}
          />
        )}

        {/* points */}
        {pts.map((p) => (
          <circle
            key={p.id}
            cx={toX(p.x)}
            cy={toY(p.y)}
            r={4.5}
            fill={T.ink}
            stroke="white"
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="mt-2 text-[11.5px] text-[#666] tracking-tight text-center">
        Click anywhere inside the plot to add a data point.
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1.5">
        <GhostButton onClick={() => setPts(defaultPoints())} className="justify-center">
          <Shuffle size={13} strokeWidth={1.6} /> Reroll
        </GhostButton>
        <GhostButton onClick={() => setPts([])} disabled={pts.length === 0} className="justify-center">
          <Trash2 size={13} strokeWidth={1.6} /> Clear
        </GhostButton>
      </div>

      <button
        onClick={() => {
          // Add a single random point.
          const x = 0.5 + Math.random() * 7.5
          const y = Math.random() * 7
          setPts((p) => [
            ...p,
            { id: `p-${Date.now().toString(36)}-${p.length}`, x, y },
          ])
        }}
        className="h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] rounded-md bg-[#222] text-white border border-[#222] hover:bg-black"
      >
        <Plus size={13} strokeWidth={2} /> Add random point
      </button>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#999]">slope m</span>
        <span className="text-right">{m.toFixed(3)}</span>
        <span className="text-[#999]">intercept b</span>
        <span className="text-right">{bIntercept.toFixed(3)}</span>
        <span className="text-[#999]">R²</span>
        <span className="text-right text-[#5CB85C]">{r2.toFixed(3)}</span>
        <span className="text-[#999]">n</span>
        <span className="text-right">{pts.length}</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Linear Regression (OLS)"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            ŷ = m · x + b
            <br />
            m = Σ (xᵢ − x̄)(yᵢ − ȳ) / Σ (xᵢ − x̄)²
            <br />b = ȳ − m · x̄
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            Ordinary least squares minimises the sum of squared vertical distances (the red
            dashed stems) from each point to the line.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#666] leading-relaxed">
            R² is the fraction of variance in y explained by x — 1 means the line fits perfectly,
            0 means x tells you nothing.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
