import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, Plus, RotateCcw } from 'lucide-react'
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

type Ball = {
  id: string
  pathX: number[]
  pathY: number[]
  bin: number
  durationMs: number
  startedAt: number
}

const CANVAS_W = 560
const CANVAS_H = 560
const TOP_Y = 50
const ROW_GAP = 32
const PEG_GAP = 38
const PEG_R = 2.4

function pegX(row: number, col: number) {
  return CANVAS_W / 2 + (col - row / 2) * PEG_GAP
}
function pegY(row: number) {
  return TOP_Y + row * ROW_GAP
}

export function GaltonBoardModule() {
  const [rows, setRows] = useState(9)
  const [bins, setBins] = useState<number[]>(() => new Array(rows + 1).fill(0))
  const [active, setActive] = useState<Ball[]>([])
  const [continuous, setContinuous] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [boundRows, setBoundRows] = useState(rows)
  const ballIdRef = useRef(0)
  const continuousRef = useRef(false)

  // Adjust derived state during render when `rows` changes — this avoids the
  // setState-in-effect anti-pattern.
  if (boundRows !== rows) {
    setBoundRows(rows)
    setBins(new Array(rows + 1).fill(0))
    setActive([])
  }

  // Drop a ball: precompute its zig-zag path through the pegs.
  const dropOne = () => {
    let col = 0
    const xs: number[] = []
    const ys: number[] = []
    xs.push(pegX(0, 0))
    ys.push(pegY(0) - 25)
    for (let r = 0; r < rows; r++) {
      // hit peg at (r, col)
      xs.push(pegX(r, col))
      ys.push(pegY(r))
      // randomly go left or right
      const right = Math.random() < 0.5 ? 0 : 1
      col += right
    }
    // settle into bin between final row peg
    const binX = pegX(rows, col)
    const finalY = pegY(rows) + 50
    xs.push(binX)
    ys.push(finalY)
    const ball: Ball = {
      id: `ball-${ballIdRef.current++}`,
      pathX: xs,
      pathY: ys,
      bin: col,
      durationMs: Math.round(1100 / speed),
      startedAt: performance.now(),
    }
    setActive((prev) => [...prev, ball])
    // schedule completion: tally into bin and remove from active list
    window.setTimeout(() => {
      setBins((b) => {
        const next = b.slice()
        next[col] += 1
        return next
      })
      setActive((prev) => prev.filter((p) => p.id !== ball.id))
    }, ball.durationMs)
  }

  const dropMany = (count: number) => {
    for (let i = 0; i < count; i++) {
      window.setTimeout(() => dropOne(), i * Math.max(40, 80 / speed))
    }
  }

  // Continuous mode — drop one per tick, paced by speed.
  useEffect(() => {
    continuousRef.current = continuous
  }, [continuous])

  useEffect(() => {
    if (!continuous) return
    const interval = Math.max(80, 220 / speed)
    const id = window.setInterval(() => {
      if (continuousRef.current) dropOne()
    }, interval)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continuous, speed, rows])

  const totalBalls = bins.reduce((s, n) => s + n, 0)
  const peakBin = bins.reduce((mi, v, i, arr) => (v > arr[mi] ? i : mi), 0)
  const peakCount = bins[peakBin] || 0

  const reset = () => {
    setBins(new Array(rows + 1).fill(0))
    setActive([])
  }

  // Bin layout
  const binWidth = PEG_GAP
  const binY = pegY(rows) + 60
  const binH = 200

  // Theoretical Bernoulli/Binomial pmf scaled to peak.
  // For comparison, draw a normal curve overlaid.
  const meanBin = rows / 2
  const stdBin = Math.sqrt(rows / 4)
  const idealPath: string[] = []
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80) * (rows + 1)
    const z = (x - 0.5 - meanBin) / stdBin
    const pdf = Math.exp(-(z * z) / 2) / (stdBin * Math.sqrt(2 * Math.PI))
    // Match the histogram peak height: pdf at mean = 1/(σ·√2π); scale so at mean it equals peakCount.
    const h = pdf / (1 / (stdBin * Math.sqrt(2 * Math.PI))) * peakCount
    const px = pegX(rows, x - 0.5) // bin x = pegX(rows, i - 0.5) approximately
    const py = binY + binH - Math.min(binH - 4, h * (binH / Math.max(peakCount, 1)))
    idealPath.push(`${px},${py}`)
  }

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-full max-w-[560px] aspect-square"
      >
        {/* Pegs */}
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: r + 1 }, (_, c) => (
            <circle
              key={`peg-${r}-${c}`}
              cx={pegX(r, c)}
              cy={pegY(r)}
              r={PEG_R}
              fill={T.line}
            />
          )),
        )}

        {/* Bins (containers) */}
        {Array.from({ length: rows + 1 }, (_, i) => {
          const x = pegX(rows, i - 0.5)
          return (
            <g key={`bin-${i}`}>
              <line
                x1={x - binWidth / 2}
                y1={binY}
                x2={x - binWidth / 2}
                y2={binY + binH}
                stroke={T.line}
                strokeWidth={1}
              />
              <line
                x1={x + binWidth / 2}
                y1={binY}
                x2={x + binWidth / 2}
                y2={binY + binH}
                stroke={T.line}
                strokeWidth={1}
              />
              <line
                x1={x - binWidth / 2}
                y1={binY + binH}
                x2={x + binWidth / 2}
                y2={binY + binH}
                stroke={T.line}
                strokeWidth={1}
              />
            </g>
          )
        })}

        {/* Bin fills (bars) */}
        {bins.map((count, i) => {
          if (count === 0) return null
          const x = pegX(rows, i - 0.5)
          const h = Math.min(binH - 4, count * (binH / Math.max(peakCount || 1, 1)))
          return (
            <motion.rect
              key={`fill-${i}`}
              x={x - binWidth / 2 + 1}
              animate={{
                y: binY + binH - h,
                height: h,
              }}
              width={binWidth - 2}
              fill={T.ink}
              fillOpacity={0.85}
              transition={{ duration: 0.3 }}
            />
          )
        })}

        {/* Ideal Gaussian overlay */}
        {totalBalls > 5 && peakCount > 0 && (
          <polyline
            points={idealPath.join(' ')}
            fill="none"
            stroke={T.red}
            strokeWidth={1.6}
            strokeOpacity={0.7}
            strokeDasharray="3 3"
          />
        )}

        {/* Active balls — animated through their pre-computed path. */}
        <AnimatePresence>
          {active.map((b) => {
            const N = b.pathX.length
            const times = Array.from({ length: N }, (_, i) => i / (N - 1))
            return (
              <motion.circle
                key={b.id}
                r={4}
                fill={T.ink}
                initial={{ cx: b.pathX[0], cy: b.pathY[0], opacity: 0 }}
                animate={{
                  cx: b.pathX,
                  cy: b.pathY,
                  opacity: [0, 1, 1, 1, 0],
                }}
                transition={{
                  duration: b.durationMs / 1000,
                  ease: 'linear',
                  times,
                  opacity: { duration: b.durationMs / 1000, times: [0, 0.05, 0.5, 0.9, 1] },
                }}
                exit={{ opacity: 0 }}
              />
            )
          })}
        </AnimatePresence>
      </svg>

      <div className="mt-2 text-[12px] text-[#666] tracking-tight text-center max-w-[640px]">
        {totalBalls} ball{totalBalls === 1 ? '' : 's'} dropped · peak bin {peakBin}
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <IconButton
          onClick={() => setContinuous((c) => !c)}
          label={continuous ? 'Pause' : 'Play'}
          primary
        >
          {continuous ? (
            <Pause size={13} strokeWidth={2} />
          ) : (
            <Play size={13} strokeWidth={2} />
          )}
        </IconButton>
        <IconButton onClick={reset} label="Reset">
          <RotateCcw size={13} strokeWidth={1.6} />
        </IconButton>
        <div className="ml-auto text-[11px] text-[#666] font-mono tabular-nums">
          {totalBalls.toString().padStart(4, ' ')}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={dropOne}
          className="h-8 text-[11.5px] inline-flex items-center justify-center gap-1 rounded-md bg-[#222] text-white border border-[#222] hover:bg-black"
        >
          <Plus size={12} strokeWidth={2} /> 1
        </button>
        <GhostButton onClick={() => dropMany(50)} className="justify-center">
          + 50
        </GhostButton>
        <GhostButton onClick={() => dropMany(200)} className="justify-center">
          + 200
        </GhostButton>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Rows</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{rows}</span>
        </div>
        <Slider value={rows} min={4} max={12} step={1} onChange={(v) => setRows(v)} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Speed</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">
            {speed.toFixed(2)}×
          </span>
        </div>
        <Slider value={speed} min={0.25} max={3} step={0.05} onChange={(v) => setSpeed(v)} />
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Central Limit Theorem"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div>
            Each ball makes <span className="font-mono">{rows}</span> independent left/right
            decisions. Its bin is the sum of those Bernoulli(½) outcomes — a{' '}
            <span className="font-mono">Binomial({rows}, ½)</span>.
          </div>
          <div className="font-mono text-[12px] mt-1">μ = n/2 = {(rows / 2).toFixed(1)}</div>
          <div className="font-mono text-[12px]">σ = √(n/4) ≈ {Math.sqrt(rows / 4).toFixed(2)}</div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#999] leading-relaxed">
            By the CLT, as the number of pegs grows, the histogram converges to a normal
            distribution N(μ, σ²) — the dashed red curve.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
