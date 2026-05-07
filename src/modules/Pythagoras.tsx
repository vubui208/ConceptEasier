import { motion } from 'framer-motion'
import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { SOFT_SPRING, T } from '../shared/tokens'

const SIZE = 580

export function PythagorasModule() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)

  const c = Math.hypot(a, b)
  const a2 = a * a
  const b2 = b * b
  const c2 = c * c

  // Place the right-angle vertex at the centre of the canvas.
  // Triangle vertices: A (right angle), B (a-side end), C (b-side end).
  // Use a unit-pixel scale that fits the largest dimension nicely.
  const maxSide = Math.max(a, b, c)
  const scale = Math.min(70, ((SIZE - 200) / 2) / Math.max(maxSide, 6))
  const cx = SIZE / 2
  const cy = SIZE / 2 + 40
  // Right-angle vertex
  const A = [cx, cy]
  const B = [cx + a * scale, cy] // along positive x
  const C = [cx, cy - b * scale] // up along positive y
  const tri = `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`

  // Squares attached to each side (drawn outward).
  // Square on a (bottom), b (left), c (hypotenuse).
  const sq_a = `${A[0]},${A[1]} ${B[0]},${B[1]} ${B[0]},${B[1] + a * scale} ${A[0]},${A[1] + a * scale}`
  const sq_b = `${A[0]},${A[1]} ${C[0]},${C[1]} ${C[0] - b * scale},${C[1]} ${A[0] - b * scale},${A[1]}`

  // Square on hypotenuse — the trickier one. Outward normal of BC pointing
  // away from the right-angle vertex A.
  const dx = C[0] - B[0]
  const dy = C[1] - B[1]
  const len = Math.hypot(dx, dy)
  const ux = dx / len // unit along hypotenuse from B → C
  const uy = dy / len
  // Right-perpendicular pointing outward (away from A).
  // Rotate (ux, uy) by -90°: (uy, -ux)
  const nx = uy
  const ny = -ux
  const sq_c = `${B[0]},${B[1]} ${C[0]},${C[1]} ${C[0] + nx * c * scale},${C[1] + ny * c * scale} ${B[0] + nx * c * scale},${B[1] + ny * c * scale}`

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[580px] aspect-square">
        {/* squares */}
        <motion.polygon
          animate={{ points: sq_a }}
          transition={SOFT_SPRING}
          fill={T.red}
          fillOpacity={0.18}
          stroke={T.red}
          strokeWidth={1.6}
          initial={false}
        />
        <motion.polygon
          animate={{ points: sq_b }}
          transition={SOFT_SPRING}
          fill={T.green}
          fillOpacity={0.18}
          stroke={T.green}
          strokeWidth={1.6}
          initial={false}
        />
        <motion.polygon
          animate={{ points: sq_c }}
          transition={SOFT_SPRING}
          fill={T.ink}
          fillOpacity={0.16}
          stroke={T.ink}
          strokeWidth={1.6}
          initial={false}
        />

        {/* triangle */}
        <motion.polygon
          animate={{ points: tri }}
          transition={SOFT_SPRING}
          fill="white"
          stroke={T.ink}
          strokeWidth={2}
          initial={false}
        />

        {/* right-angle marker */}
        <motion.rect
          animate={{ x: A[0], y: A[1] - 12 * Math.sign(scale) }}
          transition={SOFT_SPRING}
          width={12}
          height={12}
          fill="none"
          stroke={T.ink}
          strokeWidth={1.2}
          initial={false}
        />

        {/* labels */}
        <motion.text
          animate={{ x: (A[0] + B[0]) / 2, y: A[1] + a * scale / 2 + 5 }}
          transition={SOFT_SPRING}
          fontSize={16}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill={T.red}
          fontWeight={500}
          initial={false}
        >
          a² = {a2.toFixed(2)}
        </motion.text>
        <motion.text
          animate={{ x: A[0] - b * scale / 2 - 10, y: (A[1] + C[1]) / 2 + 4 }}
          transition={SOFT_SPRING}
          fontSize={16}
          textAnchor="end"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill={T.green}
          fontWeight={500}
          initial={false}
        >
          b² = {b2.toFixed(2)}
        </motion.text>
        <motion.text
          animate={{
            x: (B[0] + C[0]) / 2 + nx * c * scale * 0.55,
            y: (B[1] + C[1]) / 2 + ny * c * scale * 0.55,
          }}
          transition={SOFT_SPRING}
          fontSize={17}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill={T.ink}
          fontWeight={500}
          initial={false}
        >
          c² = {c2.toFixed(2)}
        </motion.text>
      </svg>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between">
          <Label>Leg a</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{a.toFixed(2)}</span>
        </div>
        <Slider value={a} min={0.5} max={6} step={0.05} onChange={setA} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label>Leg b</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{b.toFixed(2)}</span>
        </div>
        <Slider value={b} min={0.5} max={6} step={0.05} onChange={setB} />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#D9534F]">a²</span>
        <span className="text-right">{a2.toFixed(3)}</span>
        <span className="text-[#5CB85C]">b²</span>
        <span className="text-right">{b2.toFixed(3)}</span>
        <span className="text-[#222]">a² + b²</span>
        <span className="text-right">{(a2 + b2).toFixed(3)}</span>
        <span className="text-[#222]">c²</span>
        <span className="text-right">{c2.toFixed(3)}</span>
        <span className="text-[#999]">c</span>
        <span className="text-right">{c.toFixed(3)}</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Pythagorean Theorem"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[14px] text-[#222]">a² + b² = c²</div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            For any right triangle, the area of the squares built on the two legs sums exactly to
            the area of the square on the hypotenuse.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
