import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { Label, ModuleLayout, LogicBox, Slider } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

type Mat2 = [[number, number], [number, number]]

const MATRIX_PRESETS: { label: string; m: Mat2 }[] = [
  { label: 'Identity', m: [[1, 0], [0, 1]] },
  {
    label: 'Rotate 45°',
    m: [
      [Math.SQRT1_2, -Math.SQRT1_2],
      [Math.SQRT1_2, Math.SQRT1_2],
    ],
  },
  { label: 'Shear x', m: [[1, 1], [0, 1]] },
  { label: 'Scale 2×', m: [[2, 0], [0, 2]] },
  { label: 'Reflect x', m: [[-1, 0], [0, 1]] },
  { label: 'Squish', m: [[1, 0.5], [0.5, 0.4]] },
]

const SIZE = 580
const HALF = SIZE / 2
const SCALE = 50
const RANGE = 6

export function LinearTransformModule() {
  const [matrix, setMatrix] = useState<Mat2>([[1, 0], [0, 1]])
  const a = matrix[0][0]
  const b = matrix[0][1]
  const c = matrix[1][0]
  const d = matrix[1][1]
  const det = a * d - b * c

  const setEntry = (i: 0 | 1, j: 0 | 1, v: number) => {
    setMatrix((prev) => {
      const next: Mat2 = [
        [prev[0][0], prev[0][1]],
        [prev[1][0], prev[1][1]],
      ]
      next[i][j] = v
      return next
    })
  }

  const project = useCallback(
    (x: number, y: number) => {
      const mx = a * x + b * y
      const my = c * x + d * y
      return [HALF + mx * SCALE, HALF - my * SCALE] as const
    },
    [a, b, c, d],
  )

  const refLines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = -RANGE; i <= RANGE; i++) {
    refLines.push({ x1: HALF + i * SCALE, y1: 0, x2: HALF + i * SCALE, y2: SIZE })
    refLines.push({ x1: 0, y1: HALF + i * SCALE, x2: SIZE, y2: HALF + i * SCALE })
  }

  const transformedV: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  const transformedH: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  for (let i = -RANGE; i <= RANGE; i++) {
    const a1 = project(i, -RANGE)
    const a2 = project(i, RANGE)
    transformedV.push({ x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], key: `v${i}` })
    const b1 = project(-RANGE, i)
    const b2 = project(RANGE, i)
    transformedH.push({ x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1], key: `h${i}` })
  }

  const origin = project(0, 0)
  const iHat = project(1, 0)
  const jHat = project(0, 1)
  const ijSum = project(1, 1)
  const detPoly = `${origin[0]},${origin[1]} ${iHat[0]},${iHat[1]} ${ijSum[0]},${ijSum[1]} ${jHat[0]},${jHat[1]}`
  const detFill = det < 0 ? T.red : T.ink
  const detOpacity = Math.min(0.07 + Math.min(Math.abs(det), 4) * 0.025, 0.18)

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
            opacity={0.5}
          />
        ))}
        <line x1={0} y1={HALF} x2={SIZE} y2={HALF} stroke={T.line} strokeWidth={1.5} />
        <line x1={HALF} y1={0} x2={HALF} y2={SIZE} stroke={T.line} strokeWidth={1.5} />

        <motion.polygon
          animate={{ points: detPoly, fill: detFill, fillOpacity: detOpacity }}
          transition={SOFT_SPRING}
          stroke="none"
        />

        {transformedV.map((s) => (
          <motion.line
            key={s.key}
            animate={{ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }}
            transition={SOFT_SPRING}
            stroke={T.ink}
            strokeOpacity={0.18}
            strokeWidth={1}
            initial={false}
          />
        ))}
        {transformedH.map((s) => (
          <motion.line
            key={s.key}
            animate={{ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }}
            transition={SOFT_SPRING}
            stroke={T.ink}
            strokeOpacity={0.18}
            strokeWidth={1}
            initial={false}
          />
        ))}

        <motion.line
          animate={{
            x1: project(-RANGE, 0)[0],
            y1: project(-RANGE, 0)[1],
            x2: project(RANGE, 0)[0],
            y2: project(RANGE, 0)[1],
          }}
          transition={SOFT_SPRING}
          stroke={T.ink}
          strokeOpacity={0.5}
          strokeWidth={1.4}
          initial={false}
        />
        <motion.line
          animate={{
            x1: project(0, -RANGE)[0],
            y1: project(0, -RANGE)[1],
            x2: project(0, RANGE)[0],
            y2: project(0, RANGE)[1],
          }}
          transition={SOFT_SPRING}
          stroke={T.ink}
          strokeOpacity={0.5}
          strokeWidth={1.4}
          initial={false}
        />

        <motion.line
          animate={{ x2: iHat[0], y2: iHat[1] }}
          transition={SOFT_SPRING}
          x1={origin[0]}
          y1={origin[1]}
          stroke={T.red}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={false}
        />
        <motion.circle
          animate={{ cx: iHat[0], cy: iHat[1] }}
          transition={SOFT_SPRING}
          r={4.5}
          fill={T.red}
          initial={false}
        />
        <motion.line
          animate={{ x2: jHat[0], y2: jHat[1] }}
          transition={SOFT_SPRING}
          x1={origin[0]}
          y1={origin[1]}
          stroke={T.green}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={false}
        />
        <motion.circle
          animate={{ cx: jHat[0], cy: jHat[1] }}
          transition={SOFT_SPRING}
          r={4.5}
          fill={T.green}
          initial={false}
        />
      </svg>

      <div className="mt-4 flex items-center gap-5 text-[11px]">
        <span className="inline-flex items-center gap-2 text-[#666]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: T.red }}
          />
          î = ({a.toFixed(2)}, {c.toFixed(2)})
        </span>
        <span className="inline-flex items-center gap-2 text-[#666]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: T.green }}
          />
          ĵ = ({b.toFixed(2)}, {d.toFixed(2)})
        </span>
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
        <Label>Matrix Entries</Label>
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
                <Slider
                  value={v}
                  min={-3}
                  max={3}
                  step={0.05}
                  onChange={(nv) => setEntry(e.i, e.j, nv)}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <Label>Presets</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2.5">
          {MATRIX_PRESETS.map((p) => (
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

  const interp =
    det === 0
      ? 'Singular — space collapses onto a line. Inverse does not exist.'
      : det < 0
      ? 'Negative — orientation has been flipped (mirror).'
      : det > 1
      ? `Areas are scaled up by ${det.toFixed(2)}×.`
      : det < 1
      ? `Areas are scaled down by ${det.toFixed(2)}×.`
      : 'Areas are preserved.'

  const logic = (
    <LogicBox
      title="Formula"
      formula={
        <div className="flex flex-col gap-3">
          <div className="text-[12px] text-[#666] leading-relaxed">
            A 2×2 matrix transforms space by relocating the basis vectors î
            and ĵ. The columns of the matrix are the new positions.
          </div>
          <div className="flex items-center gap-2 font-mono text-[14px] mt-1">
            <span className="text-[#666]">
              T(<span className="italic">v</span>) =
            </span>
            <div className="flex items-stretch gap-0">
              <span className="block w-[3px] my-1 border-l border-t border-b border-[#222]" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 px-2 py-1 tabular-nums text-right">
                <span>{a.toFixed(2)}</span>
                <span>{b.toFixed(2)}</span>
                <span>{c.toFixed(2)}</span>
                <span>{d.toFixed(2)}</span>
              </div>
              <span className="block w-[3px] my-1 border-r border-t border-b border-[#222]" />
            </div>
            <span className="italic text-[#666]">v</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
            <Label>Determinant (ad − bc)</Label>
            <motion.span
              key={det.toFixed(2)}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={[
                'text-[14px] font-mono tabular-nums font-medium',
                det < 0 ? 'text-[#D9534F]' : 'text-[#222]',
              ].join(' ')}
            >
              {det.toFixed(2)}
            </motion.span>
          </div>
          <div className="text-[11px] text-[#999] leading-relaxed">{interp}</div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
