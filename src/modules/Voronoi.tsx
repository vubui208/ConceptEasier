import { useMemo, useState } from 'react'
import { Plus, Shuffle, Trash2 } from 'lucide-react'
import { GhostButton, Label, LogicBox, ModuleLayout, Slider } from '../shared/atoms'
import { T } from '../shared/tokens'

const SIZE = 560
const GRID = 56 // cells per side — 56*56 = 3136 rects, fine for SVG

type Seed = { id: string; x: number; y: number }

// Soft, mid-light palette — distinguishable but not screaming.
const PALETTE = [
  '#E8E8E8',
  '#DCEFE3',
  '#E7DCEF',
  '#FDE8D8',
  '#D6E5F2',
  '#F2D6E2',
  '#EFEDD0',
  '#D8E8E8',
  '#E5DDD3',
  '#DCDFEF',
  '#EFDCDE',
  '#D5E5DC',
  '#E8D9E5',
  '#E5E0CB',
  '#D2E5EC',
  '#EFE2D9',
]

function randomSeeds(n: number, w: number, h: number): Seed[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-${Date.now().toString(36)}-${i}`,
    x: Math.random() * w * 0.85 + w * 0.075,
    y: Math.random() * h * 0.85 + h * 0.075,
  }))
}

export function VoronoiModule() {
  const [seeds, setSeeds] = useState<Seed[]>(() => randomSeeds(8, SIZE, SIZE))
  const [metric, setMetric] = useState<'euclidean' | 'manhattan'>('euclidean')

  // Compute the cell ownership grid.
  const cells = useMemo(() => {
    const cellW = SIZE / GRID
    const cellH = SIZE / GRID
    const out: { x: number; y: number; w: number; h: number; owner: number }[] = []
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const cx = (i + 0.5) * cellW
        const cy = (j + 0.5) * cellH
        let best = 0
        let bestD = Infinity
        for (let k = 0; k < seeds.length; k++) {
          const dx = seeds[k].x - cx
          const dy = seeds[k].y - cy
          const d =
            metric === 'euclidean' ? dx * dx + dy * dy : Math.abs(dx) + Math.abs(dy)
          if (d < bestD) {
            bestD = d
            best = k
          }
        }
        out.push({
          x: i * cellW,
          y: j * cellH,
          w: cellW + 0.4,
          h: cellH + 0.4,
          owner: best,
        })
      }
    }
    return out
  }, [seeds, metric])

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[560px] aspect-square cursor-crosshair"
        onClick={(e) => {
          const svg = e.currentTarget
          const rect = svg.getBoundingClientRect()
          const sx = ((e.clientX - rect.left) / rect.width) * SIZE
          const sy = ((e.clientY - rect.top) / rect.height) * SIZE
          setSeeds((s) => [
            ...s,
            { id: `s-${Date.now().toString(36)}-${s.length}`, x: sx, y: sy },
          ])
        }}
      >
        {seeds.length === 0 ? (
          <rect x={0} y={0} width={SIZE} height={SIZE} fill={T.lineSoft} />
        ) : (
          cells.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              fill={PALETTE[c.owner % PALETTE.length]}
              shapeRendering="crispEdges"
            />
          ))
        )}

        {/* seeds */}
        {seeds.map((s, idx) => (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r={5.5} fill="white" stroke={T.ink} strokeWidth={1.5} />
            <text
              x={s.x}
              y={s.y + 3}
              textAnchor="middle"
              fontSize={9}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fill={T.inkSoft}
            >
              {idx + 1}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 text-[11.5px] text-[#666] tracking-tight text-center">
        Click anywhere to drop a seed.
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
      <div>
        <Label>Distance</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(['euclidean', 'manhattan'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                metric === m
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {m === 'euclidean' ? 'Euclidean (L²)' : 'Manhattan (L¹)'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Random seed count</Label>
          <span className="text-[11px] font-mono text-[#666] tabular-nums">{seeds.length}</span>
        </div>
        <Slider
          value={seeds.length}
          min={2}
          max={32}
          step={1}
          onChange={(n) => setSeeds(randomSeeds(n, SIZE, SIZE))}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <GhostButton onClick={() => setSeeds(randomSeeds(seeds.length, SIZE, SIZE))} className="justify-center">
          <Shuffle size={13} strokeWidth={1.6} /> Reroll
        </GhostButton>
        <GhostButton onClick={() => setSeeds([])} className="justify-center" disabled={seeds.length === 0}>
          <Trash2 size={13} strokeWidth={1.6} /> Clear
        </GhostButton>
      </div>

      <button
        onClick={() =>
          setSeeds((s) => [
            ...s,
            {
              id: `s-${Date.now().toString(36)}-${s.length}`,
              x: Math.random() * SIZE,
              y: Math.random() * SIZE,
            },
          ])
        }
        className="h-9 inline-flex items-center justify-center gap-1.5 text-[12.5px] rounded-md bg-[#222] text-white border border-[#222] hover:bg-black"
      >
        <Plus size={13} strokeWidth={2} /> Add random seed
      </button>
    </div>
  )

  const logic = (
    <LogicBox
      title="Voronoi Diagram"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="font-mono text-[12.5px] text-[#222]">
            cell(p) = {'{ x : d(x, p) ≤ d(x, q) for all q ≠ p }'}
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            Each cell is the region of space closer to one seed than to any other. Switching
            from Euclidean to Manhattan distance produces a different (axis-aligned) tiling.
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E5E5] text-[11.5px] text-[#666] leading-relaxed">
            Used in nearest-neighbour search, mesh generation, biological-cell packing, and
            spatial weather models.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
