import { motion } from 'framer-motion'
import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

type Mat2 = [[number, number], [number, number]]

const PRESETS: { label: string; m: Mat2 }[] = [
  { label: 'Diagonal', m: [[2, 0], [0, 0.5]] },
  { label: 'Shear x', m: [[1, 1], [0, 1]] },
  { label: 'Rotate 30°', m: [[Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6)], [Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)]] },
  { label: 'Symmetric', m: [[2, 1], [1, 2]] },
  { label: 'Reflection', m: [[1, 0], [0, -1]] },
  { label: 'Defective', m: [[2, 1], [0, 2]] },
]

const SIZE = 560
const HALF = SIZE / 2
const SCALE = 60
const RANGE = 4

const toPx = (x: number, y: number) =>
  [HALF + x * SCALE, HALF - y * SCALE] as const

/**
 * Closed-form 2x2 eigendecomposition.
 * Returns up to 2 real eigenvalue/vector pairs. If the eigenvalues are
 * complex, returns an empty list (and we report that to the user).
 */
function eig2(m: Mat2): { lambda: number; v: [number, number] }[] {
  const a = m[0][0]
  const b = m[0][1]
  const c = m[1][0]
  const d = m[1][1]
  const tr = a + d
  const det = a * d - b * c
  const disc = tr * tr - 4 * det
  if (disc < -1e-9) return [] // complex pair
  const s = Math.sqrt(Math.max(0, disc))
  const l1 = (tr + s) / 2
  const l2 = (tr - s) / 2

  const eigVec = (l: number): [number, number] => {
    // Solve (M − λI) v = 0
    // [[a−λ, b], [c, d−λ]]
    const m11 = a - l
    const m12 = b
    const m21 = c
    const m22 = d - l
    // Try first row
    if (Math.abs(m11) > 1e-9 || Math.abs(m12) > 1e-9) {
      const v: [number, number] = [-m12, m11]
      const n = Math.hypot(v[0], v[1])
      return n > 1e-9 ? [v[0] / n, v[1] / n] : [1, 0]
    }
    if (Math.abs(m21) > 1e-9 || Math.abs(m22) > 1e-9) {
      const v: [number, number] = [-m22, m21]
      const n = Math.hypot(v[0], v[1])
      return n > 1e-9 ? [v[0] / n, v[1] / n] : [0, 1]
    }
    return [1, 0]
  }

  return [
    { lambda: l1, v: eigVec(l1) },
    { lambda: l2, v: eigVec(l2) },
  ]
}

export function EigenvectorsModule() {
  const [matrix, setMatrix] = useState<Mat2>([[2, 1], [1, 2]])
  const a = matrix[0][0]
  const b = matrix[0][1]
  const c = matrix[1][0]
  const d = matrix[1][1]
  const setEntry = (i: 0 | 1, j: 0 | 1, v: number) =>
    setMatrix((prev) => {
      const next: Mat2 = [
        [prev[0][0], prev[0][1]],
        [prev[1][0], prev[1][1]],
      ]
      next[i][j] = v
      return next
    })

  const eigs = eig2(matrix)
  const isComplex = eigs.length === 0
  const O = toPx(0, 0)

  // Reference grid lines
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

        {/* For each eigenvector, draw the line through origin (the invariant
            subspace) plus the original vector and its image. */}
        {eigs.map((e, idx) => {
          const colour = idx === 0 ? T.red : T.green
          const [vx, vy] = e.v
          // Line through origin spanning the eigenspace
          const farX1 = -RANGE * vx
          const farY1 = -RANGE * vy
          const farX2 = RANGE * vx
          const farY2 = RANGE * vy
          const [lx1, ly1] = toPx(farX1, farY1)
          const [lx2, ly2] = toPx(farX2, farY2)

          // The original vector and its scaled image
          const [vxPx, vyPx] = toPx(vx, vy)
          const [ix, iy] = toPx(e.lambda * vx, e.lambda * vy)

          return (
            <g key={idx}>
              <line
                x1={lx1}
                y1={ly1}
                x2={lx2}
                y2={ly2}
                stroke={colour}
                strokeOpacity={0.18}
                strokeWidth={2.5}
              />
              <motion.line
                animate={{ x2: vxPx, y2: vyPx }}
                transition={SOFT_SPRING}
                x1={O[0]}
                y1={O[1]}
                stroke={colour}
                strokeWidth={2.4}
                strokeLinecap="round"
                initial={false}
              />
              <motion.circle
                animate={{ cx: vxPx, cy: vyPx }}
                transition={SOFT_SPRING}
                r={4}
                fill={colour}
                initial={false}
              />
              <motion.line
                animate={{ x2: ix, y2: iy }}
                transition={SOFT_SPRING}
                x1={O[0]}
                y1={O[1]}
                stroke={colour}
                strokeWidth={1.6}
                strokeOpacity={0.55}
                strokeDasharray="6 5"
                initial={false}
              />
              <motion.circle
                animate={{ cx: ix, cy: iy }}
                transition={SOFT_SPRING}
                r={4}
                fill={colour}
                opacity={0.55}
                initial={false}
              />
            </g>
          )
        })}

        {isComplex && (
          <text
            x={HALF}
            y={SIZE - 16}
            textAnchor="middle"
            fontSize={13}
            fill={T.red}
          >
            Complex eigenvalues — no real invariant lines (rotation).
          </text>
        )}
      </svg>
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
      title="Eigenvectors & Eigenvalues"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">M v = λ v</div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            An eigenvector v is a direction the transformation does not rotate — only scales by
            λ. The faded dashed arrow shows where the unit eigenvector lands.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] grid grid-cols-3 gap-x-2 gap-y-1.5 font-mono text-[12px] tabular-nums">
            <span className="text-[#999]">tr</span>
            <span className="text-[#222] col-span-2 text-right">{(a + d).toFixed(2)}</span>
            <span className="text-[#999]">det</span>
            <span className="text-[#222] col-span-2 text-right">{(a * d - b * c).toFixed(2)}</span>
            {isComplex ? (
              <span className="text-[#D9534F] col-span-3">eigenvalues are complex</span>
            ) : (
              eigs.map((e, i) => (
                <div key={i} className="col-span-3 grid grid-cols-3 gap-x-2">
                  <span className={i === 0 ? 'text-[#D9534F]' : 'text-[#5CB85C]'}>
                    λ{i + 1}
                  </span>
                  <span className="text-[#222] text-right">{e.lambda.toFixed(2)}</span>
                  <span className="text-[#666] text-right">
                    ({e.v[0].toFixed(2)}, {e.v[1].toFixed(2)})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
