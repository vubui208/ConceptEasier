import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GhostButton, IconButton, Label, LogicBox, ModuleLayout } from '../shared/atoms'
import { T } from '../shared/tokens'

/**
 * Königsberg-style bridge graph. Nodes are land masses, edges are bridges.
 * Standard Königsberg has 4 nodes and 7 edges, all 4 nodes of odd degree —
 * which Euler proved means no Eulerian walk exists.
 */
type NodeId = 'A' | 'B' | 'C' | 'D'
type Edge = { id: string; a: NodeId; b: NodeId }

const NODES: { id: NodeId; x: number; y: number; label: string }[] = [
  { id: 'A', x: 280, y: 100, label: 'North bank' },
  { id: 'B', x: 100, y: 300, label: 'West island' },
  { id: 'C', x: 460, y: 300, label: 'East island' },
  { id: 'D', x: 280, y: 480, label: 'South bank' },
]

const KONIGSBERG_EDGES: Edge[] = [
  { id: 'e1', a: 'A', b: 'B' },
  { id: 'e2', a: 'A', b: 'B' }, // double bridge
  { id: 'e3', a: 'A', b: 'C' },
  { id: 'e4', a: 'A', b: 'D' },
  { id: 'e5', a: 'B', b: 'D' },
  { id: 'e6', a: 'C', b: 'D' },
  { id: 'e7', a: 'B', b: 'C' },
]

const FIXED_EDGES: Edge[] = [
  // Remove one of the parallel A–B bridges to leave 6 edges. Now A and B
  // have even degree; only C and D are odd → Eulerian path exists.
  { id: 'e1', a: 'A', b: 'B' },
  { id: 'e3', a: 'A', b: 'C' },
  { id: 'e4', a: 'A', b: 'D' },
  { id: 'e5', a: 'B', b: 'D' },
  { id: 'e6', a: 'C', b: 'D' },
  { id: 'e7', a: 'B', b: 'C' },
]

const SIZE = 560

function nodeById(id: NodeId) {
  return NODES.find((n) => n.id === id)!
}

function degree(edges: Edge[], id: NodeId) {
  let d = 0
  for (const e of edges) {
    if (e.a === id) d++
    if (e.b === id) d++
  }
  return d
}

export function GraphTheoryModule() {
  const [mode, setMode] = useState<'konigsberg' | 'fixed'>('konigsberg')
  const edges = mode === 'konigsberg' ? KONIGSBERG_EDGES : FIXED_EDGES
  const [walked, setWalked] = useState<string[]>([]) // edge ids in order
  const [current, setCurrent] = useState<NodeId | null>(null)

  // Reset when mode changes
  const switchMode = (m: 'konigsberg' | 'fixed') => {
    setMode(m)
    setWalked([])
    setCurrent(null)
  }

  // Compute available edges from current node (those not yet walked, incident to current).
  const availableEdges = useMemo(() => {
    if (current === null) return edges
    return edges.filter(
      (e) => !walked.includes(e.id) && (e.a === current || e.b === current),
    )
  }, [current, walked, edges])

  const onClickNode = (id: NodeId) => {
    if (current === null) {
      setCurrent(id)
      setWalked([])
      return
    }
    // Find an unused edge between current and id; use it
    const candidate = edges.find(
      (e) => !walked.includes(e.id) && ((e.a === current && e.b === id) || (e.b === current && e.a === id)),
    )
    if (!candidate) return
    setWalked([...walked, candidate.id])
    setCurrent(id)
  }

  const reset = () => {
    setWalked([])
    setCurrent(null)
  }

  // Curve offsets for parallel edges (so they don't overlap visually).
  // Group edges by (a,b) pair (unordered) and assign each duplicate an offset.
  const edgeRender: { e: Edge; curveOffset: number }[] = []
  const edgeGroups = new Map<string, Edge[]>()
  for (const e of edges) {
    const key = [e.a, e.b].sort().join('-')
    const arr = edgeGroups.get(key) ?? []
    arr.push(e)
    edgeGroups.set(key, arr)
  }
  for (const [, group] of edgeGroups) {
    const n = group.length
    group.forEach((e, idx) => {
      const offset = n === 1 ? 0 : (idx - (n - 1) / 2) * 36
      edgeRender.push({ e, curveOffset: offset })
    })
  }

  // Determine adjacency suggestion from the current node.
  const adjacent = current === null ? [] : availableEdges.flatMap((e) => (e.a === current ? [e.b] : [e.a]))

  const allEdgesUsed = walked.length === edges.length
  const stuck = current !== null && !allEdgesUsed && availableEdges.length === 0

  // Degrees for each node
  const degs = NODES.map((n) => ({ id: n.id, d: degree(edges, n.id) }))
  const oddCount = degs.filter((d) => d.d % 2 === 1).length

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[560px] aspect-square">
        {/* Edges */}
        {edgeRender.map(({ e, curveOffset }) => {
          const A = nodeById(e.a)
          const B = nodeById(e.b)
          const used = walked.includes(e.id)
          // Quadratic curve via control point offset perpendicular to segment.
          const mx = (A.x + B.x) / 2
          const my = (A.y + B.y) / 2
          const dx = B.x - A.x
          const dy = B.y - A.y
          const len = Math.hypot(dx, dy)
          const px = -dy / len // perpendicular unit
          const py = dx / len
          const cx = mx + px * curveOffset
          const cy = my + py * curveOffset
          const path = `M ${A.x} ${A.y} Q ${cx} ${cy}, ${B.x} ${B.y}`
          return (
            <motion.path
              key={e.id}
              d={path}
              fill="none"
              animate={{
                stroke: used ? T.red : T.ink,
                strokeOpacity: used ? 0.95 : 0.55,
                strokeWidth: used ? 3.5 : 2,
              }}
              transition={{ duration: 0.18 }}
            />
          )
        })}

        {/* Nodes */}
        {NODES.map((n) => {
          const isCurrent = current === n.id
          const isAdj = adjacent.includes(n.id)
          return (
            <g
              key={n.id}
              onClick={() => onClickNode(n.id)}
              style={{ cursor: current === null ? 'pointer' : isAdj ? 'pointer' : 'default' }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={28}
                fill={isCurrent ? T.ink : 'white'}
                stroke={isCurrent ? T.ink : isAdj ? T.green : T.ink}
                strokeWidth={isCurrent || isAdj ? 2.2 : 1.6}
              />
              <text
                x={n.x}
                y={n.y + 6}
                textAnchor="middle"
                fontSize={18}
                fontWeight={500}
                fill={isCurrent ? 'white' : T.ink}
              >
                {n.id}
              </text>
              <text x={n.x} y={n.y + 50} textAnchor="middle" fontSize={11} fill="#999">
                {n.label}
              </text>
              <text x={n.x} y={n.y - 36} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={degs.find((d) => d.id === n.id)!.d % 2 === 1 ? T.red : T.green}>
                deg = {degs.find((d) => d.id === n.id)!.d}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 text-[12px] text-[#666] tracking-tight text-center max-w-[640px] min-h-[1.4em]">
        {current === null
          ? 'Pick any node to start your walk.'
          : allEdgesUsed
          ? `Eulerian walk completed — all ${edges.length} bridges crossed.`
          : stuck
          ? `Stuck at ${current}. Bridges crossed: ${walked.length}/${edges.length}.`
          : `At ${current}. Bridges crossed: ${walked.length}/${edges.length}.`}
      </div>
    </div>
  )

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
      <div>
        <Label>Configuration</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(['konigsberg', 'fixed'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                mode === m
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {m === 'konigsberg' ? '7 bridges (1736)' : 'Remove 1 bridge'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton onClick={reset} label="Reset walk">
          <RotateCcw size={13} strokeWidth={1.6} />
        </IconButton>
        <GhostButton onClick={reset} disabled={walked.length === 0} className="flex-1 justify-center">
          Reset walk
        </GhostButton>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums pt-2 border-t border-[#E5E5E5]">
        <span className="text-[#999]">edges</span>
        <span className="text-right">{edges.length}</span>
        <span className="text-[#999]">odd-degree nodes</span>
        <span className={['text-right', oddCount === 0 || oddCount === 2 ? 'text-[#5CB85C]' : 'text-[#D9534F]'].join(' ')}>
          {oddCount}
        </span>
        <span className="text-[#999]">walked</span>
        <span className="text-right text-[#222]">{walked.length}</span>
      </div>
    </div>
  )

  const logic = (
    <LogicBox
      title="Eulerian Paths"
      formula={
        <div className="flex flex-col gap-2 text-[12.5px] text-[#666] leading-relaxed">
          <div className="text-[12px] text-[#222]">
            <span className="font-medium">Euler's theorem (1736).</span> A connected graph has an
            Eulerian walk that crosses every edge exactly once if and only if it has{' '}
            <span className="font-mono">0 or 2</span> vertices of odd degree.
          </div>
          <div className="text-[11.5px] text-[#999] mt-1 leading-relaxed">
            Königsberg has 4 odd-degree vertices, so no walk exists — Euler proved it without
            ever trying. Switch to "Remove 1 bridge" to drop the count to 2 and try again.
          </div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
