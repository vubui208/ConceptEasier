import { AnimatePresence, motion } from 'framer-motion'
import { Plus, RotateCcw } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  ControlPanel,
  GhostButton,
  Label,
  LogicBox,
  ModuleLayout,
} from '../shared/atoms'
import { type Frame, useTimeline } from '../shared/timeline'
import { SPRING, T } from '../shared/tokens'

type TreeNode = {
  id: string
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

type BSTState = {
  tree: TreeNode | null
  visitedPath: string[]
  comparingId: string | null
  newNodeId: string | null
}

const BST_PSEUDOCODE = [
  'function insert(node, value):',
  '  if node is null:',
  '    return new Node(value)',
  '  if value < node.value:',
  '    node.left = insert(node.left, value)',
  '  else if value > node.value:',
  '    node.right = insert(node.right, value)',
  '  return node',
]

function cloneTree(n: TreeNode | null): TreeNode | null {
  if (!n) return null
  return { ...n, left: cloneTree(n.left), right: cloneTree(n.right) }
}

function buildInsertFrames(
  tree: TreeNode | null,
  value: number,
): { frames: Frame<BSTState>[]; finalTree: TreeNode } {
  const frames: Frame<BSTState>[] = []
  const newId = `n-${value}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`

  if (!tree) {
    const newTree: TreeNode = { id: newId, value, left: null, right: null }
    frames.push({
      state: { tree: null, visitedPath: [], comparingId: null, newNodeId: null },
      description: `Tree is empty. ${value} becomes the root.`,
      activeLine: 1,
    })
    frames.push({
      state: { tree: cloneTree(newTree)!, visitedPath: [], comparingId: null, newNodeId: newId },
      description: `Inserted ${value} as the root.`,
      activeLine: 2,
    })
    return { frames, finalTree: newTree }
  }

  const newTree = cloneTree(tree)!
  let current: TreeNode = newTree
  const visitedPath: string[] = []
  const snap = () => cloneTree(newTree)!

  frames.push({
    state: { tree: snap(), visitedPath: [], comparingId: current.id, newNodeId: null },
    description: `Start at root (${current.value}). Compare with ${value}.`,
    activeLine: 0,
  })

  while (true) {
    visitedPath.push(current.id)
    if (value < current.value) {
      frames.push({
        state: {
          tree: snap(),
          visitedPath: [...visitedPath],
          comparingId: current.id,
          newNodeId: null,
        },
        description: `${value} < ${current.value} → go left.`,
        activeLine: 3,
      })
      if (!current.left) {
        const newNode: TreeNode = { id: newId, value, left: null, right: null }
        current.left = newNode
        frames.push({
          state: {
            tree: snap(),
            visitedPath: [...visitedPath],
            comparingId: null,
            newNodeId: newId,
          },
          description: `Left child is empty. Insert ${value} here.`,
          activeLine: 4,
        })
        break
      }
      current = current.left
      frames.push({
        state: {
          tree: snap(),
          visitedPath: [...visitedPath],
          comparingId: current.id,
          newNodeId: null,
        },
        description: `Now at ${current.value}. Compare with ${value}.`,
        activeLine: 4,
      })
    } else if (value > current.value) {
      frames.push({
        state: {
          tree: snap(),
          visitedPath: [...visitedPath],
          comparingId: current.id,
          newNodeId: null,
        },
        description: `${value} > ${current.value} → go right.`,
        activeLine: 5,
      })
      if (!current.right) {
        const newNode: TreeNode = { id: newId, value, left: null, right: null }
        current.right = newNode
        frames.push({
          state: {
            tree: snap(),
            visitedPath: [...visitedPath],
            comparingId: null,
            newNodeId: newId,
          },
          description: `Right child is empty. Insert ${value} here.`,
          activeLine: 6,
        })
        break
      }
      current = current.right
      frames.push({
        state: {
          tree: snap(),
          visitedPath: [...visitedPath],
          comparingId: current.id,
          newNodeId: null,
        },
        description: `Now at ${current.value}. Compare with ${value}.`,
        activeLine: 6,
      })
    } else {
      frames.push({
        state: {
          tree: snap(),
          visitedPath: [...visitedPath],
          comparingId: null,
          newNodeId: null,
        },
        description: `${value} already exists in the tree. No insertion.`,
        activeLine: 7,
      })
      break
    }
  }

  return { frames, finalTree: newTree }
}

type LayoutNode = { node: TreeNode; x: number; y: number }
type LayoutResult = { nodes: LayoutNode[]; width: number; height: number }

function layoutTree(root: TreeNode | null): LayoutResult {
  if (!root) return { nodes: [], width: 0, height: 0 }
  const COL_W = 56
  const ROW_H = 72
  const PAD = 32
  const nodes: LayoutNode[] = []
  let counter = 0
  let maxDepth = 0

  function go(n: TreeNode, depth: number) {
    if (n.left) go(n.left, depth + 1)
    const x = PAD + counter * COL_W + COL_W / 2
    const y = PAD + depth * ROW_H
    nodes.push({ node: n, x, y })
    counter++
    if (depth > maxDepth) maxDepth = depth
    if (n.right) go(n.right, depth + 1)
  }
  go(root, 0)
  return {
    nodes,
    width: PAD * 2 + counter * COL_W,
    height: PAD * 2 + maxDepth * ROW_H,
  }
}

function getEdges(layout: LayoutNode[]) {
  const byId = new Map(layout.map((l) => [l.node.id, l]))
  const edges: {
    fromId: string
    toId: string
    x1: number
    y1: number
    x2: number
    y2: number
  }[] = []
  for (const ln of layout) {
    if (ln.node.left) {
      const c = byId.get(ln.node.left.id)
      if (c)
        edges.push({
          fromId: ln.node.id,
          toId: c.node.id,
          x1: ln.x,
          y1: ln.y,
          x2: c.x,
          y2: c.y,
        })
    }
    if (ln.node.right) {
      const c = byId.get(ln.node.right.id)
      if (c)
        edges.push({
          fromId: ln.node.id,
          toId: c.node.id,
          x1: ln.x,
          y1: ln.y,
          x2: c.x,
          y2: c.y,
        })
    }
  }
  return edges
}

const EMPTY_BST_FRAMES: Frame<BSTState>[] = [
  {
    state: { tree: null, visitedPath: [], comparingId: null, newNodeId: null },
    description: 'Empty tree. Insert a number to begin.',
  },
]

export function BSTModule() {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [pendingValue, setPendingValue] = useState<string>('')
  const [frames, setFrames] = useState<Frame<BSTState>[]>(EMPTY_BST_FRAMES)
  const tl = useTimeline(frames, { autoplayOnChange: true })

  const handleInsert = useCallback(() => {
    const v = parseInt(pendingValue, 10)
    if (isNaN(v) || v < -999 || v > 999) return
    const { frames: nextFrames, finalTree } = buildInsertFrames(tree, v)
    setFrames(nextFrames)
    setTree(finalTree)
    setPendingValue('')
  }, [pendingValue, tree])

  const handleResetTree = () => {
    setTree(null)
    setFrames(EMPTY_BST_FRAMES)
    setPendingValue('')
  }

  const handleQuickFill = () => {
    let t: TreeNode | null = null
    for (const v of [50, 30, 70, 20, 40, 60, 80]) {
      const { finalTree } = buildInsertFrames(t, v)
      t = finalTree
    }
    setTree(t)
    setFrames([
      {
        state: { tree: t, visitedPath: [], comparingId: null, newNodeId: null },
        description: 'Demo tree loaded: 50, 30, 70, 20, 40, 60, 80.',
      },
    ])
  }

  const layout = layoutTree(tl.frame.state.tree)
  const edges = getEdges(layout.nodes)
  const SVG_W = Math.max(layout.width, 480)
  const SVG_H = Math.max(layout.height + 40, 360)

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 py-8">
      <div className="w-full max-w-[700px] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ maxHeight: 460 }}
        >
          {edges.map((e) => {
            const onPath =
              tl.frame.state.visitedPath.includes(e.fromId) &&
              (tl.frame.state.visitedPath.includes(e.toId) ||
                tl.frame.state.newNodeId === e.toId)
            return (
              <motion.line
                key={`${e.fromId}-${e.toId}`}
                animate={{
                  x1: e.x1,
                  y1: e.y1,
                  x2: e.x2,
                  y2: e.y2,
                  stroke: onPath ? T.ink : T.line,
                  strokeWidth: onPath ? 1.6 : 1,
                }}
                transition={SPRING}
                initial={false}
              />
            )
          })}
          <AnimatePresence>
            {layout.nodes.map((ln) => {
              const isVisited = tl.frame.state.visitedPath.includes(ln.node.id)
              const isComparing = tl.frame.state.comparingId === ln.node.id
              const isNew = tl.frame.state.newNodeId === ln.node.id
              return (
                <motion.g
                  key={ln.node.id}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={SPRING}
                >
                  <motion.circle
                    animate={{
                      cx: ln.x,
                      cy: ln.y,
                      fill: isComparing ? T.ink : '#FFFFFF',
                      stroke: isComparing || isVisited || isNew ? T.ink : T.line,
                      strokeWidth: isComparing ? 2 : 1.2,
                    }}
                    transition={SPRING}
                    r={20}
                    initial={false}
                  />
                  <motion.text
                    animate={{
                      x: ln.x,
                      y: ln.y,
                      fill: isComparing ? '#FFFFFF' : T.ink,
                    }}
                    transition={SPRING}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={13}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontWeight={500}
                    initial={false}
                    style={{ userSelect: 'none' }}
                  >
                    {ln.node.value}
                  </motion.text>
                </motion.g>
              )
            })}
          </AnimatePresence>
        </svg>
      </div>

      <div className="mt-4 text-[12px] text-[#666] tracking-tight text-center max-w-[640px] min-h-[1.4em] px-4">
        {tl.frame.description}
      </div>
    </div>
  )

  const controls = (
    <div className="flex flex-col">
      <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
        <div>
          <Label>Insert Value</Label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              value={pendingValue}
              onChange={(e) => setPendingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInsert()
              }}
              placeholder="42"
              className="flex-1 h-9 px-3 text-[13px] tabular-nums rounded-md border border-[#E5E5E5] focus:outline-none focus:border-[#222] transition-colors bg-white"
            />
            <button
              onClick={handleInsert}
              disabled={pendingValue === ''}
              className="h-9 px-3 inline-flex items-center gap-1.5 text-[12.5px] rounded-md bg-[#222] text-white border border-[#222] hover:bg-black disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={13} strokeWidth={2} /> Insert
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <GhostButton onClick={handleQuickFill} className="justify-center">
            Demo Fill
          </GhostButton>
          <GhostButton onClick={handleResetTree} className="justify-center">
            <RotateCcw size={13} strokeWidth={1.6} /> Reset Tree
          </GhostButton>
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
      title="Pseudocode · BST Insert"
      pseudocode={{ lines: BST_PSEUDOCODE }}
      activeLine={tl.frame.activeLine}
      description="Average O(log n), worst O(n). Tree shape depends on insertion order — try inserting a sorted sequence to see degeneracy."
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
