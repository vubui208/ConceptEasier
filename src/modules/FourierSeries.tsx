import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { IconButton, Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { T } from '../shared/tokens'

type Wave = 'square' | 'sawtooth'

/**
 * k-th harmonic amplitude for the chosen wave target.
 * Square: odd-k only,  a_k = 4 / (π·k)
 * Saw:    every k,      a_k = 2 / (π·k) · (-1)^(k+1)
 */
function harmonics(wave: Wave, terms: number) {
  const out: { amp: number; freq: number }[] = []
  if (wave === 'square') {
    let k = 1
    while (out.length < terms) {
      out.push({ amp: 4 / (Math.PI * k), freq: k })
      k += 2
    }
  } else {
    for (let k = 1; k <= terms; k++) {
      const sign = k % 2 === 1 ? 1 : -1
      out.push({ amp: (2 / (Math.PI * k)) * sign, freq: k })
    }
  }
  return out
}

const SIZE = 580
const EPI_CX = 150
const EPI_CY = SIZE / 2
const TRACE_X0 = 290
const TRACE_W = SIZE - TRACE_X0 - 20
const Y_SCALE = 90 // px per amplitude unit

type Circle = { cx: number; cy: number; r: number }
type Arm = { x1: number; y1: number; x2: number; y2: number }
type FourierFrame = {
  pen: [number, number]
  circles: Circle[]
  arms: Arm[]
  trace: number[]
}

const EMPTY_FRAME: FourierFrame = {
  pen: [EPI_CX, EPI_CY],
  circles: [],
  arms: [],
  trace: [],
}

export function FourierSeriesModule() {
  const [wave, setWave] = useState<Wave>('square')
  const [terms, setTerms] = useState(5)
  const [speed, setSpeed] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [resetTick, setResetTick] = useState(0)
  const [frame, setFrame] = useState<FourierFrame>(EMPTY_FRAME)

  // Single RAF loop owns t and trace; computes the next frame, pushes via setFrame.
  useEffect(() => {
    let raf = 0
    let t = 0
    let trace: number[] = []
    let last = performance.now()

    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (playing) t += dt * speed

      const harms = harmonics(wave, terms)
      let px = EPI_CX
      let py = EPI_CY
      const circles: Circle[] = []
      const arms: Arm[] = []
      for (const h of harms) {
        const r = h.amp * Y_SCALE
        const angle = h.freq * t - Math.PI / 2
        const nx = px + Math.cos(angle) * Math.abs(r)
        const ny = py + Math.sin(angle) * Math.abs(r) * Math.sign(r || 1)
        circles.push({ cx: px, cy: py, r: Math.abs(r) })
        arms.push({ x1: px, y1: py, x2: nx, y2: ny })
        px = nx
        py = ny
      }
      const yValue = (py - EPI_CY) / Y_SCALE
      if (playing) {
        trace = [yValue, ...trace.slice(0, TRACE_W - 1)]
      }
      setFrame({ pen: [px, py], circles, arms, trace })

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, wave, terms, resetTick])

  const [px, py] = frame.pen
  const tracePoints = frame.trace
    .map((y, i) => `${TRACE_X0 + i},${EPI_CY + y * Y_SCALE}`)
    .join(' ')
  const linkY = py

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[580px] aspect-square"
      >
        <line x1={0} y1={EPI_CY} x2={SIZE} y2={EPI_CY} stroke={T.line} strokeWidth={1} />
        <line
          x1={TRACE_X0}
          y1={20}
          x2={TRACE_X0}
          y2={SIZE - 20}
          stroke={T.line}
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        {frame.circles.map((c, i) => (
          <circle
            key={`c-${i}`}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill="none"
            stroke={T.ink}
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        ))}

        {frame.arms.map((a, i) => (
          <line
            key={`a-${i}`}
            x1={a.x1}
            y1={a.y1}
            x2={a.x2}
            y2={a.y2}
            stroke={T.ink}
            strokeOpacity={0.55}
            strokeWidth={1.2}
          />
        ))}

        <circle cx={px} cy={py} r={4.5} fill={T.red} />

        <line
          x1={px}
          y1={py}
          x2={TRACE_X0}
          y2={linkY}
          stroke={T.red}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.7}
        />

        {frame.trace.length >= 2 && (
          <polyline
            points={tracePoints}
            fill="none"
            stroke={T.ink}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        <IdealWave wave={wave} cx={TRACE_X0} cy={EPI_CY} w={TRACE_W} yScale={Y_SCALE} />
      </svg>

      <div className="mt-3 text-[12px] text-[#666] tracking-tight text-center max-w-[640px]">
        {terms} harmonic{terms === 1 ? '' : 's'} · {wave === 'square' ? 'square' : 'sawtooth'}{' '}
        wave
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <IconButton
          onClick={() => setPlaying((p) => !p)}
          label={playing ? 'Pause' : 'Play'}
          primary
        >
          {playing ? <Pause size={13} strokeWidth={2} /> : <Play size={13} strokeWidth={2} />}
        </IconButton>
        <IconButton onClick={() => setResetTick((c) => c + 1)} label="Reset">
          <RotateCcw size={13} strokeWidth={1.6} />
        </IconButton>
      </div>

      <div>
        <Label>Wave Target</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(['square', 'sawtooth'] as Wave[]).map((w) => (
            <button
              key={w}
              onClick={() => setWave(w)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                wave === w
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {w === 'square' ? 'Square' : 'Sawtooth'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Harmonics (N)</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{terms}</span>
        </div>
        <Slider value={terms} min={1} max={15} step={1} onChange={(v) => setTerms(v)} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Speed</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">
            {speed.toFixed(2)}×
          </span>
        </div>
        <Slider value={speed} min={0.1} max={3} step={0.05} onChange={(v) => setSpeed(v)} />
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Fourier Series"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div>
            Any periodic function can be written as an infinite sum of sines and cosines.
          </div>
          <div className="font-mono text-[12.5px] text-[#222] mt-1">
            {wave === 'square'
              ? 'square(t) = (4/π) Σ sin(k·t)/k    for k = 1, 3, 5, …'
              : 'saw(t) = (2/π) Σ (-1)^(k+1) sin(k·t)/k    for k ≥ 1'}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#999]">
            Each circle in the chain is one harmonic — radius = amplitude, rotation rate =
            frequency. Adding more terms makes the pen's vertical motion converge to the target
            wave.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}

function IdealWave({
  wave,
  cx,
  cy,
  w,
  yScale,
}: {
  wave: Wave
  cx: number
  cy: number
  w: number
  yScale: number
}) {
  const samples: string[] = []
  const N = 80
  for (let i = 0; i <= N; i++) {
    const x = cx + (i / N) * w
    const phase = (i / N) * Math.PI * 2
    const y =
      wave === 'square'
        ? Math.sin(phase) >= 0
          ? 1
          : -1
        : 1 - ((phase / Math.PI) % 2)
    samples.push(`${x},${cy + y * yScale}`)
  }
  return (
    <polyline
      points={samples.join(' ')}
      fill="none"
      stroke={T.ink}
      strokeOpacity={0.18}
      strokeWidth={1.2}
      strokeDasharray="4 3"
    />
  )
}
