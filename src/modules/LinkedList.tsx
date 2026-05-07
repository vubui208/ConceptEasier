import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import {
  ControlPanel,
  GhostButton,
  Label,
  LogicBox,
  ModuleLayout,
} from '../shared/atoms'
import { type Frame, useTimeline } from '../shared/timeline'
import { SPRING, T } from '../shared/tokens'

type LinkedNode = { id: string; value: number }
type LinkedFrame = {
  nodes: LinkedNode[]
  activeId: string | null
  visitedIds: string[]
}

const LIST_PSEUDOCODE = [
  'class LinkedList:',
  '  prepend(x):',
  '    head = Node(x, head)       // O(1)',
  '  append(x):',
  '    walk to last; last.next = Node(x) // O(n)',
  '  removeHead():',
  '    head = head.next           // O(1)',
  '  traverse(): walk head → null',
]

export function LinkedListModule() {
  const [nodes, setNodes] = useState<LinkedNode[]>([])
  const [pendingValue, setPendingValue] = useState('')
  const [frames, setFrames] = useState<Frame<LinkedFrame>[]>([
    {
      state: { nodes: [], activeId: null, visitedIds: [] },
      description: 'Empty list. Prepend / append to begin.',
    },
  ])
  const tl = useTimeline(frames, { autoplayOnChange: true, defaultSpeed: 1.5 })

  const newNode = (v: number): LinkedNode => ({
    id: `n-${v}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    value: v,
  })

  const prependAnim = (cur: LinkedNode[], v: number): Frame<LinkedFrame>[] => {
    const node = newNode(v)
    const target = [node, ...cur]
    return [
      {
        state: { nodes: target, activeId: node.id, visitedIds: [] },
        description: `New node ${v} created and linked at head.`,
        activeLine: 2,
      },
      {
        state: { nodes: target, activeId: null, visitedIds: [] },
        description: `Head is now ${v}. List length ${target.length}.`,
      },
    ]
  }

  const appendAnim = (cur: LinkedNode[], v: number): Frame<LinkedFrame>[] => {
    const node = newNode(v)
    const target = [...cur, node]
    const fr: Frame<LinkedFrame>[] = []
    const visited: string[] = []
    cur.forEach((n) => {
      visited.push(n.id)
      fr.push({
        state: { nodes: cur, activeId: n.id, visitedIds: [...visited] },
        description: `Walk to ${n.value}.`,
        activeLine: 4,
      })
    })
    fr.push({
      state: { nodes: target, activeId: node.id, visitedIds: visited },
      description: `Append ${v} after the tail.`,
      activeLine: 4,
    })
    fr.push({
      state: { nodes: target, activeId: null, visitedIds: [] },
      description: `Length ${target.length}.`,
    })
    return fr
  }

  const removeHeadAnim = (cur: LinkedNode[]): Frame<LinkedFrame>[] => {
    if (cur.length === 0) return frames
    const head = cur[0]
    return [
      {
        state: { nodes: cur, activeId: head.id, visitedIds: [] },
        description: `Head node ${head.value} marked for removal.`,
        activeLine: 6,
      },
      {
        state: { nodes: cur.slice(1), activeId: null, visitedIds: [] },
        description: `Removed ${head.value}.`,
        activeLine: 6,
      },
    ]
  }

  const traverseAnim = (cur: LinkedNode[]): Frame<LinkedFrame>[] => {
    if (cur.length === 0) return frames
    const fr: Frame<LinkedFrame>[] = []
    const visited: string[] = []
    cur.forEach((n) => {
      visited.push(n.id)
      fr.push({
        state: { nodes: cur, activeId: n.id, visitedIds: [...visited] },
        description: `Visit ${n.value}.`,
        activeLine: 7,
      })
    })
    fr.push({
      state: { nodes: cur, activeId: null, visitedIds: visited },
      description: 'Traversal complete.',
      activeLine: 7,
    })
    return fr
  }

  const onPrepend = () => {
    const v = parseInt(pendingValue, 10)
    if (isNaN(v)) return
    setFrames(prependAnim(nodes, v))
    const node = newNode(v)
    setNodes([node, ...nodes])
    setPendingValue('')
  }
  const onAppend = () => {
    const v = parseInt(pendingValue, 10)
    if (isNaN(v)) return
    setFrames(appendAnim(nodes, v))
    const node = newNode(v)
    setNodes([...nodes, node])
    setPendingValue('')
  }
  const onRemoveHead = () => {
    if (nodes.length === 0) return
    setFrames(removeHeadAnim(nodes))
    setNodes(nodes.slice(1))
  }
  const onTraverse = () => {
    setFrames(traverseAnim(nodes))
  }

  const state = tl.frame.state
  const W = 50
  const H = 40
  const GAP = 28

  const total = state.nodes.length * W + Math.max(0, state.nodes.length - 1) * GAP
  const startX = Math.max(40, (540 - total) / 2)
  const baseY = (440 - H) / 2 - 20

  const positions = state.nodes.map((_, idx) => ({
    x: startX + idx * (W + GAP),
    y: baseY,
  }))

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 py-8">
      <div
        className="relative rounded-lg border border-[#EFEFEF] bg-white overflow-hidden"
        style={{ width: 540, height: 440 }}
      >
        <svg className="absolute inset-0 pointer-events-none" width={540} height={440}>
          <defs>
            <marker
              id="ll-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={T.line} />
            </marker>
            <marker
              id="ll-arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={T.ink} />
            </marker>
          </defs>
          {state.nodes.map((n, idx) => {
            if (idx === state.nodes.length - 1) return null
            const from = positions[idx]
            const to = positions[idx + 1]
            const isOnPath =
              state.visitedIds.includes(n.id) &&
              state.visitedIds.includes(state.nodes[idx + 1].id)
            return (
              <motion.line
                key={`edge-${n.id}-${state.nodes[idx + 1].id}`}
                x1={from.x + W}
                y1={from.y + H / 2}
                x2={to.x - 6}
                y2={to.y + H / 2}
                stroke={isOnPath ? T.ink : T.line}
                strokeWidth={isOnPath ? 1.6 : 1}
                markerEnd={`url(#${isOnPath ? 'll-arrow-active' : 'll-arrow'})`}
              />
            )
          })}
          {state.nodes.length > 0 && (
            <text
              x={positions[positions.length - 1].x + W + 12}
              y={positions[positions.length - 1].y + H / 2 + 4}
              fontSize={11}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fill="#bbb"
            >
              ⌀
            </text>
          )}
        </svg>
        <AnimatePresence>
          {state.nodes.map((n, idx) => {
            const isActive = state.activeId === n.id
            const isVisited = state.visitedIds.includes(n.id)
            const p = positions[idx]
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: p.x,
                  y: p.y,
                  backgroundColor: isActive ? T.ink : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : T.ink,
                  borderColor: isActive || isVisited ? T.ink : '#D8D8D8',
                }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={SPRING}
                className="absolute flex items-center justify-center font-mono text-[13px] tabular-nums border rounded-md"
                style={{ left: 0, top: 0, width: W, height: H }}
              >
                {n.value}
              </motion.div>
            )
          })}
        </AnimatePresence>
        {state.nodes.length > 0 && (
          <div
            className="absolute text-[10px] uppercase tracking-[0.16em] text-[#bbb]"
            style={{ left: positions[0].x, top: baseY - 22 }}
          >
            head
          </div>
        )}
      </div>
      <div className="mt-6 text-[12px] text-[#666] tracking-tight text-center min-h-[1.4em] px-4">
        {tl.frame.description}
      </div>
    </div>
  )

  const controls = (
    <div className="flex flex-col">
      <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
        <div>
          <Label>Value</Label>
          <input
            type="number"
            value={pendingValue}
            onChange={(e) => setPendingValue(e.target.value)}
            placeholder="42"
            className="w-full mt-2 h-9 px-3 text-[13px] tabular-nums rounded-md border border-[#E5E5E5] focus:outline-none focus:border-[#222] bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onPrepend}
            disabled={pendingValue === ''}
            className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-[12px] rounded-md bg-[#222] text-white border border-[#222] hover:bg-black disabled:opacity-25 transition-all"
          >
            Prepend
          </button>
          <button
            onClick={onAppend}
            disabled={pendingValue === ''}
            className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-[12px] rounded-md bg-[#222] text-white border border-[#222] hover:bg-black disabled:opacity-25 transition-all"
          >
            Append
          </button>
          <GhostButton
            onClick={onRemoveHead}
            disabled={nodes.length === 0}
            className="justify-center"
          >
            Remove head
          </GhostButton>
          <GhostButton
            onClick={onTraverse}
            disabled={nodes.length === 0}
            className="justify-center"
          >
            Traverse
          </GhostButton>
        </div>
        <div className="text-[11px] text-[#666] flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
          <span>Length</span>
          <span className="font-mono tabular-nums text-[#222]">
            {nodes.length}
          </span>
        </div>
      </div>
      <ControlPanel
        isPlaying={tl.isPlaying}
        onPlayToggle={tl.toggle}
        onReset={tl.reset}
        step={tl.step}
        total={tl.total}
        onScrub={(s) => {
          tl.pause()
          tl.setStep(s)
        }}
        speed={tl.speed}
        onSpeedChange={tl.setSpeed}
      />
    </div>
  )

  const logic = (
    <LogicBox
      title="Pseudocode · Singly Linked List"
      pseudocode={{ lines: LIST_PSEUDOCODE }}
      activeLine={tl.frame.activeLine}
      description="Prepend O(1), append O(n) for singly linked (O(1) with tail pointer). Random access is O(n)."
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
