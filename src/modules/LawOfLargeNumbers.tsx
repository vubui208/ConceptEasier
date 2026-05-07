import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  GhostButton,
  IconButton,
  Label,
  LogicBox,
  ModuleLayout,
  Slider,
} from '../shared/atoms'
import { T } from '../shared/tokens'

const SIZE = 560
const PAD = 50
const PLOT_W = SIZE - 2 * PAD
const PLOT_H = SIZE - 2 * PAD

type Trial = 'coin' | 'die'

export function LawOfLargeNumbersModule() {
  const [p, setP] = useState(0.5) // for coin: P(heads). For die: rate at 3.5
  const [trial, setTrial] = useState<Trial>('coin')
  const [running, setRunning] = useState(false)
  const [trace, setTrace] = useState<{ n: number; mean: number }[]>([])
  const sumRef = useRef(0)
  const nRef = useRef(0)
  const lastDrawnRef = useRef<{ n: number; mean: number } | null>(null)

  // Truth value to compare to.
  const target = trial === 'coin' ? p : 3.5

  const reset = () => {
    sumRef.current = 0
    nRef.current = 0
    setTrace([])
    lastDrawnRef.current = null
  }

  // Switch trial type → reset.
  const switchTrial = (t: Trial) => {
    setTrial(t)
    setRunning(false)
    sumRef.current = 0
    nRef.current = 0
    setTrace([])
    lastDrawnRef.current = null
  }

  // Streaming sampler. Burst many flips per frame so the plot moves quickly.
  useEffect(() => {
    if (!running) return
    let raf = 0
    const loop = () => {
      const burst = 80
      let acc = 0
      for (let i = 0; i < burst; i++) {
        const v = trial === 'coin' ? (Math.random() < p ? 1 : 0) : 1 + Math.floor(Math.random() * 6)
        acc += v
      }
      sumRef.current += acc
      nRef.current += burst
      const n = nRef.current
      const mean = sumRef.current / n
      // Decimate sample storage to avoid massive arrays.
      const samplePoint = { n, mean }
      const last = lastDrawnRef.current
      // Only push if N grew by a factor of ~1.04 since last push (log-spaced).
      if (!last || n > Math.max(last.n + 1, last.n * 1.05)) {
        setTrace((tr) => {
          const next = [...tr, samplePoint]
          if (next.length > 1000) next.splice(0, next.length - 1000)
          return next
        })
        lastDrawnRef.current = samplePoint
      }
      // Stop after ~50k flips so we don't run forever.
      if (n >= 50000) {
        setRunning(false)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, p, trial])

  // Plot bounds.
  const yMin = trial === 'coin' ? 0 : 1
  const yMax = trial === 'coin' ? 1 : 6
  const ySpan = yMax - yMin
  const xMax = Math.max(50, lastN(trace))

  const toX = (n: number) =>
    PAD + (Math.log10(Math.max(n, 1)) / Math.log10(Math.max(xMax, 10))) * PLOT_W
  const toY = (m: number) => PAD + (1 - (m - yMin) / ySpan) * PLOT_H

  const linePts = trace.map((p) => `${toX(p.n)},${toY(p.mean)}`).join(' ')

  // Theoretical band: ±1 / sqrt(n) shrinks toward target.
  const bandPts: string[] = []
  const bandLow: string[] = []
  const stdShape = trial === 'coin' ? Math.sqrt(p * (1 - p)) : Math.sqrt(35 / 12)
  for (let i = 1; i <= 60; i++) {
    const n = Math.pow(10, (i / 60) * Math.log10(Math.max(xMax, 10)))
    const half = (1.96 * stdShape) / Math.sqrt(n)
    bandPts.push(`${toX(n)},${toY(target + half)}`)
    bandLow.push(`${toX(n)},${toY(target - half)}`)
  }
  const bandPoly = `${bandPts.join(' ')} ${bandLow.reverse().join(' ')}`

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {/* axes */}
        <line x1={PAD} y1={SIZE - PAD} x2={SIZE - PAD} y2={SIZE - PAD} stroke={T.line} strokeWidth={1.2} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={SIZE - PAD} stroke={T.line} strokeWidth={1.2} />

        {/* target line */}
        <line
          x1={PAD}
          y1={toY(target)}
          x2={SIZE - PAD}
          y2={toY(target)}
          stroke={T.green}
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />
        <text x={SIZE - PAD - 4} y={toY(target) - 5} fontSize={11} fill={T.green} textAnchor="end">
          E[X] = {target.toFixed(2)}
        </text>

        {/* 95% confidence band */}
        {trace.length > 1 && (
          <polygon points={bandPoly} fill={T.green} fillOpacity={0.08} stroke="none" />
        )}

        {/* path */}
        {trace.length >= 2 && (
          <polyline points={linePts} fill="none" stroke={T.ink} strokeWidth={1.6} strokeLinejoin="round" />
        )}

        {/* x ticks */}
        {[1, 10, 100, 1000, 10000, 50000].map((n) =>
          toX(n) >= PAD && toX(n) <= SIZE - PAD ? (
            <g key={n}>
              <line x1={toX(n)} y1={SIZE - PAD} x2={toX(n)} y2={SIZE - PAD + 4} stroke={T.line} />
              <text x={toX(n)} y={SIZE - PAD + 16} fontSize={10} textAnchor="middle" fill="#999">
                10^{Math.round(Math.log10(n))}
              </text>
            </g>
          ) : null,
        )}
      </svg>
      <div className="mt-2 text-[11.5px] text-[#666] tracking-tight text-center">
        Running average vs trial count (log scale on x).
      </div>
    </div>
  )

  const lastMean = trace.length > 0 ? trace[trace.length - 1].mean : null

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <IconButton
          onClick={() => setRunning((r) => !r)}
          label={running ? 'Pause' : 'Play'}
          primary
        >
          {running ? <Pause size={13} strokeWidth={2} /> : <Play size={13} strokeWidth={2} />}
        </IconButton>
        <IconButton onClick={reset} label="Reset">
          <RotateCcw size={13} strokeWidth={1.6} />
        </IconButton>
        <div className="ml-auto text-[11px] text-[#666] font-mono tabular-nums">
          n = {(trace.length > 0 ? trace[trace.length - 1].n : 0).toLocaleString()}
        </div>
      </div>

      <div>
        <Label>Trial</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(['coin', 'die'] as Trial[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTrial(t)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                trial === t
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {t === 'coin' ? 'Coin (Bernoulli)' : 'Die (1–6)'}
            </button>
          ))}
        </div>
      </div>

      {trial === 'coin' && (
        <div>
          <div className="flex items-center justify-between">
            <Label>P(heads)</Label>
            <span className="text-[11px] font-mono text-[#666] tabular-nums">{p.toFixed(2)}</span>
          </div>
          <Slider value={p} min={0.05} max={0.95} step={0.01} onChange={setP} />
        </div>
      )}

      <GhostButton
        onClick={() => {
          const burst = 1000
          let acc = 0
          for (let i = 0; i < burst; i++) {
            const v = trial === 'coin' ? (Math.random() < p ? 1 : 0) : 1 + Math.floor(Math.random() * 6)
            acc += v
          }
          sumRef.current += acc
          nRef.current += burst
          const n = nRef.current
          setTrace((tr) => [...tr, { n, mean: sumRef.current / n }])
        }}
        className="w-full justify-center"
      >
        + 1,000 samples
      </GhostButton>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#999]">target μ</span>
        <span className="text-right">{target.toFixed(3)}</span>
        <span className="text-[#999]">running mean</span>
        <span className="text-right text-[#222]">{lastMean === null ? '—' : lastMean.toFixed(4)}</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Law of Large Numbers"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            X̄ₙ = (1/n) Σ Xᵢ  →  E[X]   as n → ∞
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            The sample mean of an i.i.d. sequence converges to the true expectation. Early on,
            the running average is volatile; it stabilises like 1/√n (the green band).
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}

function lastN(trace: { n: number; mean: number }[]) {
  return trace.length === 0 ? 50 : trace[trace.length - 1].n
}
