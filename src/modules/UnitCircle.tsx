import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { IconButton, Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { T } from '../shared/tokens'

const SIZE = 580
const CIRCLE_CX = 150
const CIRCLE_CY = SIZE / 2
const R = 110
const WAVE_X0 = 280
const WAVE_W = SIZE - WAVE_X0 - 20
const PHASES_VISIBLE = 2 * Math.PI // x-axis spans 0..2π

export function UnitCircleModule() {
  const [theta, setTheta] = useState(Math.PI / 6)
  const [playing, setPlaying] = useState(false)
  const [show, setShow] = useState<'sin' | 'cos' | 'both'>('both')

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setTheta((t) => (t + dt * 1.2) % (2 * Math.PI))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const cx = CIRCLE_CX + R * Math.cos(theta)
  const cy = CIRCLE_CY - R * Math.sin(theta)
  const sinV = Math.sin(theta)
  const cosV = Math.cos(theta)

  // Map theta in [0, 2π] to wave x position (current phase position).
  const waveX = (t: number) => WAVE_X0 + (t / PHASES_VISIBLE) * WAVE_W
  const waveYsin = (s: number) => CIRCLE_CY - s * R
  const sinPath: string[] = []
  const cosPath: string[] = []
  const N = 200
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * PHASES_VISIBLE
    sinPath.push(`${waveX(t)},${waveYsin(Math.sin(t))}`)
    cosPath.push(`${waveX(t)},${waveYsin(Math.cos(t))}`)
  }

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[580px] aspect-square">
        {/* baseline */}
        <line x1={0} y1={CIRCLE_CY} x2={SIZE} y2={CIRCLE_CY} stroke={T.line} strokeWidth={1} />

        {/* axes for unit circle */}
        <line x1={CIRCLE_CX - R - 16} y1={CIRCLE_CY} x2={CIRCLE_CX + R + 16} y2={CIRCLE_CY} stroke={T.line} strokeWidth={1} />
        <line x1={CIRCLE_CX} y1={CIRCLE_CY - R - 16} x2={CIRCLE_CX} y2={CIRCLE_CY + R + 16} stroke={T.line} strokeWidth={1} />

        {/* circle */}
        <circle cx={CIRCLE_CX} cy={CIRCLE_CY} r={R} fill="none" stroke={T.ink} strokeOpacity={0.45} strokeWidth={1.4} />

        {/* radius arm */}
        <motion.line
          animate={{ x2: cx, y2: cy }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          x1={CIRCLE_CX}
          y1={CIRCLE_CY}
          stroke={T.ink}
          strokeWidth={2}
          initial={false}
        />

        {/* sin component (vertical drop) */}
        {(show === 'sin' || show === 'both') && (
          <motion.line
            animate={{ x1: cx, y1: cy, x2: cx, y2: CIRCLE_CY }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            stroke={T.red}
            strokeWidth={2}
            initial={false}
          />
        )}
        {/* cos component (horizontal) */}
        {(show === 'cos' || show === 'both') && (
          <motion.line
            animate={{ x1: CIRCLE_CX, y1: CIRCLE_CY, x2: cx, y2: CIRCLE_CY }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            stroke={T.green}
            strokeWidth={2}
            initial={false}
          />
        )}

        {/* point on circle */}
        <motion.circle
          animate={{ cx, cy }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          r={5}
          fill={T.ink}
          stroke="white"
          strokeWidth={2}
          initial={false}
        />

        {/* wave panel — divider */}
        <line x1={WAVE_X0} y1={20} x2={WAVE_X0} y2={SIZE - 20} stroke={T.line} strokeDasharray="3 4" strokeWidth={1} />

        {/* sin/cos waves */}
        {(show === 'sin' || show === 'both') && (
          <polyline points={sinPath.join(' ')} fill="none" stroke={T.red} strokeWidth={1.8} />
        )}
        {(show === 'cos' || show === 'both') && (
          <polyline points={cosPath.join(' ')} fill="none" stroke={T.green} strokeWidth={1.8} strokeDasharray="3 3" />
        )}

        {/* link line from point on circle to wave */}
        {(show === 'sin' || show === 'both') && (
          <motion.line
            animate={{ x2: waveX(theta), y2: waveYsin(sinV) }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            x1={cx}
            y1={cy}
            stroke={T.red}
            strokeOpacity={0.4}
            strokeDasharray="3 4"
            strokeWidth={1}
            initial={false}
          />
        )}

        {/* current point on wave */}
        {(show === 'sin' || show === 'both') && (
          <motion.circle
            animate={{ cx: waveX(theta), cy: waveYsin(sinV) }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            r={4}
            fill={T.red}
            initial={false}
          />
        )}
        {(show === 'cos' || show === 'both') && (
          <motion.circle
            animate={{ cx: waveX(theta), cy: waveYsin(cosV) }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            r={4}
            fill={T.green}
            initial={false}
          />
        )}
      </svg>
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
        <IconButton
          onClick={() => {
            setTheta(0)
            setPlaying(false)
          }}
          label="Reset"
        >
          <RotateCcw size={13} strokeWidth={1.6} />
        </IconButton>
      </div>

      <div>
        <Label>Show</Label>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {(['sin', 'cos', 'both'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setShow(s)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                show === s
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {s === 'sin' ? 'sin' : s === 'cos' ? 'cos' : 'both'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Angle θ</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">
            {((theta * 180) / Math.PI).toFixed(1)}°
          </span>
        </div>
        <Slider value={theta} min={0} max={2 * Math.PI} step={0.01} onChange={setTheta} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#999]">sin θ</span>
        <span className="text-[#D9534F] text-right">{sinV.toFixed(3)}</span>
        <span className="text-[#999]">cos θ</span>
        <span className="text-[#5CB85C] text-right">{cosV.toFixed(3)}</span>
        <span className="text-[#999]">tan θ</span>
        <span className="text-[#222] text-right">
          {Math.abs(cosV) < 1e-3 ? '∞' : (sinV / cosV).toFixed(3)}
        </span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Unit Circle"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            (cos θ, sin θ)  with  cos²θ + sin²θ = 1
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            Wrap a point around the unit circle at angle θ. Its x-coordinate traces the cosine
            wave; its y-coordinate traces the sine wave. They differ by π/2 — sin leads cos by a
            quarter cycle.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
