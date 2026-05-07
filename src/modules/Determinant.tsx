import { motion } from 'framer-motion'
import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

type Mat2 = [[number, number], [number, number]]

const PRESETS: { label: string; m: Mat2 }[] = [
  { label: 'Identity (1×)', m: [[1, 0], [0, 1]] },
  { label: 'Scale 2×', m: [[2, 0], [0, 2]] },
  { label: 'Squish (½)', m: [[1, 0], [0, 0.5]] },
  { label: 'Reflect', m: [[-1, 0], [0, 1]] },
  { label: 'Singular', m: [[1, 1], [1, 1]] },
  { label: 'Skew', m: [[1, 0.5], [-0.5, 1]] },
]

const SIZE = 560
const HALF = SIZE / 2
const SCALE = 70
const RANGE = 4

const toPx = (x: number, y: number) =>
  [HALF + x * SCALE, HALF - y * SCALE] as const

export function DeterminantModule() {
  const [matrix, setMatrix] = useState<Mat2>([[1.5, 0.5], [0, 1]])
  const a = matrix[0][0]
  const b = matrix[0][1]
  const c = matrix[1][0]
  const d = matrix[1][1]
  const det = a * d - b * c

  const setEntry = (i: 0 | 1, j: 0 | 1, v: number) =>
    setMatrix((prev) => {
      const next: Mat2 = [
        [prev[0][0], prev[0][1]],
        [prev[1][0], prev[1][1]],
      ]
      next[i][j] = v
      return next
    })

  const O = toPx(0, 0)
  const I0 = toPx(1, 0) // unit i-hat
  const J0 = toPx(0, 1) // unit j-hat
  const I = toPx(a, c)
  const J = toPx(b, d)
  const SUM0 = toPx(1, 1)
  const SUM = toPx(a + b, c + d)

  // Reference unit square corners → screen coords
  const unitSquare = `${O[0]},${O[1]} ${I0[0]},${I0[1]} ${SUM0[0]},${SUM0[1]} ${J0[0]},${J0[1]}`
  const transformedPoly = `${O[0]},${O[1]} ${I[0]},${I[1]} ${SUM[0]},${SUM[1]} ${J[0]},${J[1]}`

  const interp =
    Math.abs(det) < 1e-3
      ? 'Singular — area collapses to a line. Inverse does not exist.'
      : det < 0
      ? `Negative — orientation flipped. |det| = ${Math.abs(det).toFixed(2)}.`
      : det > 1
      ? `Areas scaled up by ${det.toFixed(2)}×.`
      : `Areas scaled down by ${det.toFixed(2)}×.`

  const fillColour = det < 0 ? T.red : T.ink

  // Reference grid
  const refLines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = -RANGE; i <= RANGE; i++) {
    refLines.push({ x1: HALF + i * SCALE, y1: 0, x2: HALF + i * SCALE, y2: SIZE })
    refLines.push({ x1: 0, y1: HALF + i * SCALE, x2: SIZE, y2: HALF + i * SCALE })
  }

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {refLines.map((ln, i) => (
          <line
            key={i}
            x1={ln.x1}
            y1={ln.y1}
            x2={ln.x2}
            y2={ln.y2}
            stroke={T.line}
            opacity={0.45}
            strokeWidth={1}
          />
        ))}
        <line x1={0} y1={HALF} x2={SIZE} y2={HALF} stroke={T.line} strokeWidth={1.5} />
        <line x1={HALF} y1={0} x2={HALF} y2={SIZE} stroke={T.line} strokeWidth={1.5} />

        {/* Reference unit square (faded) */}
        <polygon
          points={unitSquare}
          fill={T.ink}
          fillOpacity={0.05}
          stroke={T.ink}
          strokeOpacity={0.25}
          strokeWidth={1.4}
          strokeDasharray="4 4"
        />

        {/* Transformed parallelogram */}
        <motion.polygon
          animate={{ points: transformedPoly, fill: fillColour, fillOpacity: Math.min(0.07 + Math.abs(det) * 0.04, 0.32) }}
          transition={SOFT_SPRING}
          stroke={fillColour}
          strokeOpacity={0.7}
          strokeWidth={1.8}
          initial={false}
        />

        {/* î and ĵ */}
        <motion.line
          animate={{ x2: I[0], y2: I[1] }}
          transition={SOFT_SPRING}
          x1={O[0]}
          y1={O[1]}
          stroke={T.red}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={false}
        />
        <motion.line
          animate={{ x2: J[0], y2: J[1] }}
          transition={SOFT_SPRING}
          x1={O[0]}
          y1={O[1]}
          stroke={T.green}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={false}
        />

        {/* Big determinant value in centre of parallelogram */}
        <motion.text
          animate={{
            x: (I[0] + J[0] + O[0] + SUM[0]) / 4,
            y: (I[1] + J[1] + O[1] + SUM[1]) / 4,
            fill: det < 0 ? T.red : T.ink,
          }}
          transition={SOFT_SPRING}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={24}
          fontWeight={500}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          initial={false}
          style={{ userSelect: 'none' }}
        >
          {det.toFixed(2)}
        </motion.text>
      </svg>
      <div className="mt-2 text-[12px] text-[#666] tracking-tight text-center max-w-[640px]">
        {interp}
      </div>
    </div>
  )

  const ENTRIES: { name: string; i: 0 | 1; j: 0 | 1 }[] = [
    { name: 'a', i: 0, j: 0 },
    { name: 'b', i: 0, j: 1 },
    { name: 'c', i: 1, j: 0 },
    { name: 'd', i: 1, j: 1 },
  ]

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <Label>Matrix</Label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2.5">
          {ENTRIES.map((e) => {
            const v = matrix[e.i][e.j]
            return (
              <div key={e.name}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[12px] italic text-[#666]">{e.name}</span>
                  <span className="text-[11px] font-mono tabular-nums text-[#222]">
                    {v >= 0 ? ' ' : ''}
                    {v.toFixed(2)}
                  </span>
                </div>
                <Slider value={v} min={-3} max={3} step={0.05} onChange={(nv) => setEntry(e.i, e.j, nv)} />
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <Label>Presets</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setMatrix(p.m)}
              className="h-8 text-[11px] tracking-tight rounded-md border border-[#E5E5E5] hover:bg-[#222]/[0.04] transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Determinant"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">det(M) = a·d − b·c</div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            The determinant is the signed area of the parallelogram spanned by the columns of
            M. Magnitude = scale factor for areas. Sign = whether orientation flipped.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
            <span className="font-mono text-[12px] text-[#999]">|det|</span>
            <span className={['font-mono text-[14px] tabular-nums', det < 0 ? 'text-[#D9534F]' : 'text-[#222]'].join(' ')}>
              {Math.abs(det).toFixed(3)}
            </span>
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
