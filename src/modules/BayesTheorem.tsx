import { motion } from 'framer-motion'
import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

const SIZE = 560
const M = 60
const W = SIZE - 2 * M
const H = SIZE - 2 * M

export function BayesTheoremModule() {
  // Medical-test scenario.
  const [prior, setPrior] = useState(0.01) // P(D) — prevalence
  const [sens, setSens] = useState(0.95) // P(+|D)
  const [spec, setSpec] = useState(0.9) // P(−|¬D)

  const fpr = 1 - spec
  const Ppos = sens * prior + fpr * (1 - prior) // P(+)
  const post = (sens * prior) / Math.max(1e-9, Ppos) // P(D|+)

  // Layout the population square: vertical split by prior, horizontal split
  // within each column by test outcome rate.
  const x0 = M
  const y0 = M
  const xSplit = x0 + prior * W
  // Diseased column: top = true positive, bottom = false negative
  const yTP = y0 + sens * H // bottom of TP region (top down)
  // Healthy column: top = false positive, bottom = true negative
  const yFP = y0 + fpr * H

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {/* Diseased column */}
        <motion.rect
          animate={{ x: x0, y: y0, width: xSplit - x0, height: yTP - y0 }}
          transition={SOFT_SPRING}
          fill={T.red}
          fillOpacity={0.55}
          initial={false}
        />
        <motion.rect
          animate={{ x: x0, y: yTP, width: xSplit - x0, height: y0 + H - yTP }}
          transition={SOFT_SPRING}
          fill={T.red}
          fillOpacity={0.18}
          initial={false}
        />
        {/* Healthy column */}
        <motion.rect
          animate={{ x: xSplit, y: y0, width: x0 + W - xSplit, height: yFP - y0 }}
          transition={SOFT_SPRING}
          fill={T.green}
          fillOpacity={0.55}
          initial={false}
        />
        <motion.rect
          animate={{ x: xSplit, y: yFP, width: x0 + W - xSplit, height: y0 + H - yFP }}
          transition={SOFT_SPRING}
          fill={T.green}
          fillOpacity={0.18}
          initial={false}
        />

        {/* outline */}
        <rect x={x0} y={y0} width={W} height={H} fill="none" stroke={T.ink} strokeWidth={1.2} />

        {/* dividing lines */}
        <motion.line
          animate={{ x1: xSplit, x2: xSplit }}
          transition={SOFT_SPRING}
          y1={y0}
          y2={y0 + H}
          stroke={T.ink}
          strokeOpacity={0.5}
          strokeWidth={1.4}
          initial={false}
        />

        {/* labels */}
        <text x={x0 + 8} y={y0 - 14} fontSize={11} fill="#666">
          Diseased (P(D) = {(prior * 100).toFixed(2)}%)
        </text>
        <text x={x0 + W - 8} y={y0 - 14} fontSize={11} fill="#666" textAnchor="end">
          Healthy (P(¬D) = {((1 - prior) * 100).toFixed(2)}%)
        </text>

        {/* TP / FN / FP / TN region labels — only when wide enough to fit */}
        {(xSplit - x0) > 50 && (
          <>
            <text x={(x0 + xSplit) / 2} y={(y0 + yTP) / 2 + 4} fontSize={11} fill="white" textAnchor="middle">
              TP
            </text>
            <text x={(x0 + xSplit) / 2} y={(yTP + y0 + H) / 2 + 4} fontSize={10} fill="#666" textAnchor="middle">
              FN
            </text>
          </>
        )}
        <text x={(xSplit + x0 + W) / 2} y={(y0 + yFP) / 2 + 4} fontSize={11} fill="white" textAnchor="middle">
          FP
        </text>
        <text x={(xSplit + x0 + W) / 2} y={(yFP + y0 + H) / 2 + 4} fontSize={10} fill="#666" textAnchor="middle">
          TN
        </text>
      </svg>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <SliderRow label="Prior P(D)" value={prior} onChange={setPrior} pct />
      <SliderRow label="Sensitivity P(+|D)" value={sens} onChange={setSens} pct />
      <SliderRow label="Specificity P(−|¬D)" value={spec} onChange={setSpec} pct />

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-3 border-t border-[#E5E5E5]">
        <span className="text-[#999]">P(+)</span>
        <span className="text-right">{(Ppos * 100).toFixed(2)}%</span>
        <span className="text-[#999]">P(D, +)  TP</span>
        <span className="text-right">{(prior * sens * 100).toFixed(3)}%</span>
        <span className="text-[#999]">P(¬D, +)  FP</span>
        <span className="text-right">{((1 - prior) * fpr * 100).toFixed(3)}%</span>
        <span className="text-[#222] font-semibold">P(D | +)</span>
        <span className="text-right text-[#D9534F] font-semibold">{(post * 100).toFixed(2)}%</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Bayes' Theorem"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222] leading-snug">
            P(D | +) = P(+ | D) · P(D) / P(+)
            <br />
            P(+) = P(+ | D) P(D) + P(+ | ¬D) P(¬D)
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            The posterior reweights the prior by how much more likely the evidence is under D
            than under ¬D. Dial the prior to 1% with a 95% sensitive / 90% specific test — most
            positives are still false positives.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}

function SliderRow({
  label,
  value,
  onChange,
  pct = false,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  pct?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-[11px] font-mono text-[#666] tabular-nums">
          {pct ? `${(value * 100).toFixed(2)}%` : value.toFixed(3)}
        </span>
      </div>
      <Slider value={value} min={0.001} max={0.999} step={0.001} onChange={onChange} />
    </div>
  )
}
