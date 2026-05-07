import { useState } from 'react'
import { Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { T } from '../shared/tokens'

const SIZE = 580
const PHI = (1 + Math.sqrt(5)) / 2

/**
 * Build a Fibonacci-style square partition. We start with a unit square
 * and repeatedly attach the next square (side = previous Fibonacci number)
 * on the appropriate side, rotating direction each step.
 *
 * Returns the bounding box and a list of square cells with their position,
 * size, and the corner the spiral arc inscribes.
 */
type Cell = {
  x: number
  y: number
  s: number
  // Which corner the arc anchors at (the arc sweeps through 90° from one
  // adjacent corner to the next).
  arcStart: 'tl' | 'tr' | 'br' | 'bl'
}

function build(n: number): { cells: Cell[]; bounds: { x: number; y: number; w: number; h: number } } {
  // Fibonacci numbers (use 1,1,2,3,5,...)
  const fib: number[] = [1, 1]
  while (fib.length < n + 1) fib.push(fib[fib.length - 1] + fib[fib.length - 2])

  // Place squares around an origin. We track the current bounding rect and
  // attach the next square on right / top / left / bottom in turn.
  let xMin = 0
  let xMax = 1
  let yMin = 0
  let yMax = 1
  const cells: Cell[] = [{ x: 0, y: 0, s: 1, arcStart: 'br' }]
  const dirs: ('right' | 'top' | 'left' | 'bottom')[] = ['right', 'top', 'left', 'bottom']
  for (let i = 1; i < n; i++) {
    const s = fib[i + 1]
    const dir = dirs[i % 4]
    let x: number
    let y: number
    let arcStart: Cell['arcStart']
    if (dir === 'right') {
      x = xMax
      y = yMax - s
      xMax += s
      arcStart = 'bl'
    } else if (dir === 'top') {
      x = xMax - s
      y = yMin - s
      yMin -= s
      arcStart = 'tl'
    } else if (dir === 'left') {
      x = xMin - s
      y = yMin
      xMin -= s
      arcStart = 'tr'
    } else {
      x = xMin
      y = yMax
      yMax += s
      arcStart = 'br'
    }
    cells.push({ x, y, s, arcStart })
  }
  return {
    cells,
    bounds: { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin },
  }
}

export function FibonacciSpiralModule() {
  const [n, setN] = useState(7)
  const { cells, bounds } = build(n)

  // Fit bounds to canvas with margin
  const M = 30
  const scale = Math.min((SIZE - 2 * M) / bounds.w, (SIZE - 2 * M) / bounds.h)
  const offsetX = M + (SIZE - 2 * M - bounds.w * scale) / 2 - bounds.x * scale
  // SVG y grows downward; we flip to match standard math convention.
  const offsetY = M + (SIZE - 2 * M - bounds.h * scale) / 2 + bounds.y * scale + bounds.h * scale

  const px = (x: number) => offsetX + x * scale
  const py = (y: number) => offsetY - y * scale

  const ratios: { k: number; ratio: number }[] = []
  const fib: number[] = [1, 1]
  while (fib.length < n + 2) fib.push(fib[fib.length - 1] + fib[fib.length - 2])
  for (let i = 1; i < n + 1; i++) {
    ratios.push({ k: i, ratio: fib[i + 1] / fib[i] })
  }

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[580px] aspect-square">
        {cells.map((c, i) => {
          const x1 = px(c.x)
          const y1 = py(c.y + c.s) // top
          const w = c.s * scale
          const h = c.s * scale
          // Arc corners
          // We treat the cell as a screen-space rect from (x1,y1) of width w, height h.
          // The arc starts at one corner and sweeps 90° to the next.
          // Mapping: the arcStart in math-space corresponds via flipped y.
          const corners = {
            // After flipping, math 'tl' (top-left) -> screen top-left at (x1, y1)
            tl: { p: [x1, y1] as const, opp: [x1 + w, y1 + h] as const, center: [x1, y1 + h] as const },
            tr: { p: [x1 + w, y1] as const, opp: [x1, y1 + h] as const, center: [x1 + w, y1 + h] as const },
            br: { p: [x1 + w, y1 + h] as const, opp: [x1, y1] as const, center: [x1 + w, y1] as const },
            bl: { p: [x1, y1 + h] as const, opp: [x1 + w, y1] as const, center: [x1, y1] as const },
          }
          // Arc center is the corner DIAGONALLY across from the start; arc radius = side.
          // arcStart is the math-space "starting corner". Map to screen by flipping y:
          const screenStart =
            c.arcStart === 'tl'
              ? 'bl'
              : c.arcStart === 'tr'
              ? 'br'
              : c.arcStart === 'br'
              ? 'tr'
              : 'tl'
          const start = corners[screenStart].p
          const ends = {
            bl: corners.tl.p,
            br: corners.bl.p,
            tr: corners.br.p,
            tl: corners.tr.p,
          }
          const end = ends[screenStart]
          const arcCx = corners[screenStart].opp[0] // diagonal
          const arcCy = corners[screenStart].opp[1]
          void arcCx
          void arcCy
          // SVG arc path: from start, large=0, sweep direction depends on orientation.
          // Use sweep=0 (counterclockwise) — works for our square-attaching pattern.
          const r = w
          const arcPath = `M ${start[0]} ${start[1]} A ${r} ${r} 0 0 0 ${end[0]} ${end[1]}`
          return (
            <g key={i}>
              <rect
                x={x1}
                y={y1}
                width={w}
                height={h}
                fill={i % 2 === 0 ? T.ink : T.line}
                fillOpacity={i % 2 === 0 ? 0.04 : 0.1}
                stroke={T.ink}
                strokeOpacity={0.55}
                strokeWidth={1}
              />
              <text
                x={x1 + w / 2}
                y={y1 + h / 2 + 4}
                fontSize={Math.min(w * 0.3, 16)}
                textAnchor="middle"
                fill={T.inkSofter}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                {fib[i + 1]}
              </text>
              <path d={arcPath} fill="none" stroke={T.red} strokeWidth={2} />
            </g>
          )
        })}
      </svg>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between">
          <Label>Iterations</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{n}</span>
        </div>
        <Slider value={n} min={2} max={11} step={1} onChange={setN} />
      </div>

      <div className="pt-2 border-t border-[#E5E5E5]">
        <Label>Successive ratios F(k+1) / F(k)</Label>
        <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums">
          {ratios.map((r) => (
            <div key={r.k} className="flex items-center justify-between">
              <span className="text-[#999]">k={r.k}</span>
              <span className="text-[#222]">{r.ratio.toFixed(4)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px] font-mono">
          <span className="text-[#999]">φ</span>
          <span className="text-[#222]">{PHI.toFixed(6)}</span>
        </div>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Golden Ratio · Fibonacci"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            F(k+1) = F(k) + F(k−1)
            <br />
            lim F(k+1) / F(k) = φ = (1 + √5) / 2 ≈ 1.618
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            Adjacent Fibonacci squares partition a golden rectangle. Inscribing a quarter-arc in
            each square produces the Fibonacci spiral, which limits to the true logarithmic
            golden spiral.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
