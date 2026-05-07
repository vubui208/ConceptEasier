import { motion } from 'framer-motion'
import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

type Mode = 'add' | 'project'

export function VectorOpsModule() {
  const [mode, setMode] = useState<Mode>('add')
  const [a, setA] = useState({ x: 3, y: 1 })
  const [b, setB] = useState({ x: 1, y: 2.5 })

  const SIZE = 580
  const HALF = SIZE / 2
  const SCALE = 50
  const RANGE = 5

  const project = (x: number, y: number) =>
    [HALF + x * SCALE, HALF - y * SCALE] as const

  const refLines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = -RANGE; i <= RANGE; i++) {
    refLines.push({ x1: HALF + i * SCALE, y1: 0, x2: HALF + i * SCALE, y2: SIZE })
    refLines.push({ x1: 0, y1: HALF + i * SCALE, x2: SIZE, y2: HALF + i * SCALE })
  }

  const O = project(0, 0)
  const A = project(a.x, a.y)
  const B = project(b.x, b.y)
  const SUM = project(a.x + b.x, a.y + b.y)
  const Bshift = project(a.x + b.x, a.y + b.y) // tip of B drawn from A's head

  // For projection mode: proj_b A = ((A·B)/|B|^2) * B
  const dot = a.x * b.x + a.y * b.y
  const bMag2 = b.x * b.x + b.y * b.y
  const bMag = Math.sqrt(bMag2)
  const aMag = Math.sqrt(a.x * a.x + a.y * a.y)
  const k = bMag2 === 0 ? 0 : dot / bMag2
  const projVec = { x: k * b.x, y: k * b.y }
  const P = project(projVec.x, projVec.y)
  const cosTheta = aMag === 0 || bMag === 0 ? 0 : dot / (aMag * bMag)
  const theta = (Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180) / Math.PI

  const stageAdd = (
    <>
      {/* Vector B drawn from tip of A (translucent dashed) */}
      <motion.line
        animate={{ x1: A[0], y1: A[1], x2: SUM[0], y2: SUM[1] }}
        transition={SOFT_SPRING}
        stroke={T.green}
        strokeWidth={2}
        strokeDasharray="5 4"
        strokeOpacity={0.6}
        strokeLinecap="round"
        initial={false}
      />
      {/* A vector */}
      <motion.line
        animate={{ x1: O[0], y1: O[1], x2: A[0], y2: A[1] }}
        transition={SOFT_SPRING}
        stroke={T.red}
        strokeWidth={2.6}
        strokeLinecap="round"
        initial={false}
      />
      <motion.circle
        animate={{ cx: A[0], cy: A[1] }}
        transition={SOFT_SPRING}
        r={4.5}
        fill={T.red}
        initial={false}
      />
      {/* B vector */}
      <motion.line
        animate={{ x1: O[0], y1: O[1], x2: B[0], y2: B[1] }}
        transition={SOFT_SPRING}
        stroke={T.green}
        strokeWidth={2.6}
        strokeLinecap="round"
        initial={false}
      />
      <motion.circle
        animate={{ cx: B[0], cy: B[1] }}
        transition={SOFT_SPRING}
        r={4.5}
        fill={T.green}
        initial={false}
      />
      {/* A + B sum vector */}
      <motion.line
        animate={{ x1: O[0], y1: O[1], x2: SUM[0], y2: SUM[1] }}
        transition={SOFT_SPRING}
        stroke={T.ink}
        strokeWidth={3}
        strokeLinecap="round"
        initial={false}
      />
      <motion.circle
        animate={{ cx: SUM[0], cy: SUM[1] }}
        transition={SOFT_SPRING}
        r={5}
        fill={T.ink}
        initial={false}
      />
    </>
  )

  const stageProject = (
    <>
      {/* dashed perpendicular drop from A onto projection */}
      <motion.line
        animate={{ x1: A[0], y1: A[1], x2: P[0], y2: P[1] }}
        transition={SOFT_SPRING}
        stroke={T.inkSofter}
        strokeWidth={1.4}
        strokeDasharray="4 4"
        initial={false}
      />
      {/* shadow / projection segment along B (thicker, ink-coloured) */}
      <motion.line
        animate={{ x1: O[0], y1: O[1], x2: P[0], y2: P[1] }}
        transition={SOFT_SPRING}
        stroke={T.ink}
        strokeWidth={5}
        strokeOpacity={0.18}
        strokeLinecap="round"
        initial={false}
      />
      {/* A */}
      <motion.line
        animate={{ x1: O[0], y1: O[1], x2: A[0], y2: A[1] }}
        transition={SOFT_SPRING}
        stroke={T.red}
        strokeWidth={2.6}
        strokeLinecap="round"
        initial={false}
      />
      <motion.circle
        animate={{ cx: A[0], cy: A[1] }}
        transition={SOFT_SPRING}
        r={4.5}
        fill={T.red}
        initial={false}
      />
      {/* B */}
      <motion.line
        animate={{ x1: O[0], y1: O[1], x2: B[0], y2: B[1] }}
        transition={SOFT_SPRING}
        stroke={T.green}
        strokeWidth={2.6}
        strokeLinecap="round"
        initial={false}
      />
      <motion.circle
        animate={{ cx: B[0], cy: B[1] }}
        transition={SOFT_SPRING}
        r={4.5}
        fill={T.green}
        initial={false}
      />
      {/* projection point */}
      <motion.circle
        animate={{ cx: P[0], cy: P[1] }}
        transition={SOFT_SPRING}
        r={4.5}
        fill={T.ink}
        initial={false}
      />
    </>
  )

  void Bshift // unused — keep var for parity

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[580px] aspect-square"
      >
        {refLines.map((ln, idx) => (
          <line
            key={idx}
            x1={ln.x1}
            y1={ln.y1}
            x2={ln.x2}
            y2={ln.y2}
            stroke={T.line}
            strokeWidth={1}
            opacity={0.45}
          />
        ))}
        <line x1={0} y1={HALF} x2={SIZE} y2={HALF} stroke={T.line} strokeWidth={1.5} />
        <line x1={HALF} y1={0} x2={HALF} y2={SIZE} stroke={T.line} strokeWidth={1.5} />
        {mode === 'add' ? stageAdd : stageProject}
      </svg>

      <div className="mt-4 flex items-center gap-5 text-[11px]">
        <span className="inline-flex items-center gap-2 text-[#666]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: T.red }}
          />
          A = ({a.x.toFixed(2)}, {a.y.toFixed(2)})
        </span>
        <span className="inline-flex items-center gap-2 text-[#666]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: T.green }}
          />
          B = ({b.x.toFixed(2)}, {b.y.toFixed(2)})
        </span>
        {mode === 'add' && (
          <span className="inline-flex items-center gap-2 text-[#666]">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: T.ink }}
            />
            A + B
          </span>
        )}
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <Label>Operation</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(['add', 'project'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                mode === m
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {m === 'add' ? 'Tip-to-tail addition' : 'Dot · projection'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Vector A (red)</Label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2.5">
          <SliderRow name="Ax" value={a.x} onChange={(v) => setA({ ...a, x: v })} />
          <SliderRow name="Ay" value={a.y} onChange={(v) => setA({ ...a, y: v })} />
        </div>
      </div>

      <div>
        <Label>Vector B (green)</Label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2.5">
          <SliderRow name="Bx" value={b.x} onChange={(v) => setB({ ...b, x: v })} />
          <SliderRow name="By" value={b.y} onChange={(v) => setB({ ...b, y: v })} />
        </div>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title={mode === 'add' ? 'Vector Addition' : 'Dot Product & Projection'}
      formula={
        mode === 'add' ? (
          <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
            <div>
              The tip-to-tail rule places <span className="text-[#5CB85C]">B</span> at the head of{' '}
              <span className="text-[#D9534F]">A</span>. The arrow from origin to that final tip is{' '}
              <span className="text-[#222] font-medium">A + B</span>.
            </div>
            <div className="font-mono text-[13px] mt-2 text-[#222]">
              A + B = ({(a.x + b.x).toFixed(2)}, {(a.y + b.y).toFixed(2)})
            </div>
            <div className="text-[11px] text-[#999] mt-2">
              Vector addition is commutative — drawing B then A would land at the same tip.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
            <div>
              The dot product <span className="font-mono text-[#222]">A · B = |A||B|cos θ</span>{' '}
              measures alignment.
            </div>
            <div className="font-mono text-[13px] mt-2 text-[#222]">
              A · B = {dot.toFixed(2)}
            </div>
            <div className="font-mono text-[12px] text-[#666]">
              |A| = {aMag.toFixed(2)} · |B| = {bMag.toFixed(2)} · θ ≈ {theta.toFixed(1)}°
            </div>
            <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[12px]">
              <span className="text-[#666]">Projection of A onto B:</span>
              <div className="font-mono text-[13px] mt-1 text-[#222]">
                proj<sub>B</sub>(A) = ({projVec.x.toFixed(2)}, {projVec.y.toFixed(2)})
              </div>
            </div>
            <div className="text-[11px] text-[#999] mt-2">
              Drag the perpendicular shadow — when A ⟂ B the projection collapses to zero.
            </div>
          </div>
        )
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}

function SliderRow({
  name,
  value,
  onChange,
}: {
  name: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[12px] italic text-[#666]">{name}</span>
        <span className="text-[11px] font-mono tabular-nums text-[#222]">
          {value >= 0 ? ' ' : ''}
          {value.toFixed(2)}
        </span>
      </div>
      <Slider value={value} min={-4} max={4} step={0.05} onChange={onChange} />
    </div>
  )
}
