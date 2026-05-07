import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  ControlPanel,
  GhostButton,
  LogicBox,
  ModuleLayout,
  NumberInputRow,
} from '../shared/atoms'
import { type Frame, useTimeline } from '../shared/timeline'
import { SPRING, T } from '../shared/tokens'

type HeapFrame = {
  arr: number[]
  activeIdx: number | null
  comparingIdx: number | null
  swapped: boolean
}

const HEAP_PSEUDOCODE = [
  'insert(x):',
  '  arr.push(x)',
  '  siftUp(len-1)            // O(log n)',
  '',
  'extractMax():',
  '  m = arr[0]',
  '  arr[0] = arr.pop()',
  '  siftDown(0)              // O(log n)',
  '  return m',
]

function heapLayout(n: number) {
  const LEVEL_H = 70
  const NODE = 40
  const rows: { idx: number }[][] = []
  for (let i = 0; i < n; i++) {
    const depth = Math.floor(Math.log2(i + 1))
    if (!rows[depth]) rows[depth] = []
    rows[depth].push({ idx: i })
  }
  const layout: { x: number; y: number }[] = new Array(n)
  const CANVAS_W = 540
  const PAD_Y = 30
  for (let d = 0; d < rows.length; d++) {
    const slots = Math.pow(2, d)
    const spacing = CANVAS_W / (slots + 1)
    rows[d].forEach((cell) => {
      const slotInLevel = cell.idx - (Math.pow(2, d) - 1)
      const x = spacing * (slotInLevel + 1) - NODE / 2
      const y = PAD_Y + d * LEVEL_H
      layout[cell.idx] = { x, y }
    })
  }
  return { layout, NODE, height: PAD_Y + rows.length * LEVEL_H }
}

export function HeapModule() {
  const [arr, setArr] = useState<number[]>([])
  const [pendingValue, setPendingValue] = useState('')
  const [frames, setFrames] = useState<Frame<HeapFrame>[]>([
    {
      state: { arr: [], activeIdx: null, comparingIdx: null, swapped: false },
      description: 'Empty heap.',
    },
  ])
  const tl = useTimeline(frames, { autoplayOnChange: true, defaultSpeed: 1.4 })

  const insertAnim = (current: number[], v: number): Frame<HeapFrame>[] => {
    const fr: Frame<HeapFrame>[] = []
    const a = [...current, v]
    let i = a.length - 1
    fr.push({
      state: { arr: [...a], activeIdx: i, comparingIdx: null, swapped: false },
      description: `Append ${v} at index ${i} (next leaf).`,
      activeLine: 1,
    })
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2)
      fr.push({
        state: { arr: [...a], activeIdx: i, comparingIdx: parent, swapped: false },
        description: `Compare child ${a[i]} with parent ${a[parent]}.`,
        activeLine: 2,
      })
      if (a[i] > a[parent]) {
        const tmp = a[i]
        a[i] = a[parent]
        a[parent] = tmp
        fr.push({
          state: { arr: [...a], activeIdx: parent, comparingIdx: i, swapped: true },
          description: `${a[parent]} > ${a[i]} → sift up.`,
          activeLine: 2,
        })
        i = parent
      } else {
        fr.push({
          state: { arr: [...a], activeIdx: i, comparingIdx: null, swapped: false },
          description: `${a[i]} ≤ ${a[parent]}; heap property satisfied.`,
          activeLine: 2,
        })
        break
      }
    }
    fr.push({
      state: { arr: [...a], activeIdx: null, comparingIdx: null, swapped: false },
      description: `Inserted. Heap size ${a.length}.`,
    })
    return fr
  }

  const extractAnim = (current: number[]): Frame<HeapFrame>[] => {
    const fr: Frame<HeapFrame>[] = []
    if (current.length === 0) {
      fr.push({
        state: { arr: [], activeIdx: null, comparingIdx: null, swapped: false },
        description: 'Heap is empty.',
      })
      return fr
    }
    let a = current.slice()
    const max = a[0]
    fr.push({
      state: { arr: a.slice(), activeIdx: 0, comparingIdx: null, swapped: false },
      description: `Take root: max = ${max}.`,
      activeLine: 5,
    })
    if (a.length === 1) {
      fr.push({
        state: { arr: [], activeIdx: null, comparingIdx: null, swapped: false },
        description: `Heap is now empty.`,
        activeLine: 6,
      })
      return fr
    }
    const last = a[a.length - 1]
    a = [last, ...a.slice(1, -1)]
    fr.push({
      state: { arr: a.slice(), activeIdx: 0, comparingIdx: null, swapped: true },
      description: `Move last leaf (${last}) to the root.`,
      activeLine: 6,
    })
    let i = 0
    while (true) {
      const left = 2 * i + 1
      const right = 2 * i + 2
      let largest = i
      if (left < a.length && a[left] > a[largest]) largest = left
      if (right < a.length && a[right] > a[largest]) largest = right
      if (largest === i) {
        fr.push({
          state: { arr: a.slice(), activeIdx: i, comparingIdx: null, swapped: false },
          description: `arr[${i}] is ≥ children; sift-down done.`,
          activeLine: 7,
        })
        break
      }
      fr.push({
        state: { arr: a.slice(), activeIdx: i, comparingIdx: largest, swapped: false },
        description: `Swap arr[${i}]=${a[i]} with larger child arr[${largest}]=${a[largest]}.`,
        activeLine: 7,
      })
      const next = a.slice()
      const tmp = next[i]
      next[i] = next[largest]
      next[largest] = tmp
      a = next
      fr.push({
        state: { arr: a.slice(), activeIdx: largest, comparingIdx: i, swapped: true },
        description: `After swap.`,
        activeLine: 7,
      })
      i = largest
    }
    fr.push({
      state: { arr: a.slice(), activeIdx: null, comparingIdx: null, swapped: false },
      description: `Extracted ${max}. Size ${a.length}.`,
    })
    return fr
  }

  const onInsert = () => {
    const v = parseInt(pendingValue, 10)
    if (isNaN(v)) return
    setFrames(insertAnim(arr, v))
    const a = [...arr, v]
    let i = a.length - 1
    while (i > 0) {
      const p = Math.floor((i - 1) / 2)
      if (a[i] > a[p]) {
        const tmp = a[i]
        a[i] = a[p]
        a[p] = tmp
        i = p
      } else break
    }
    setArr(a)
    setPendingValue('')
  }
  const onExtract = () => {
    if (arr.length === 0) return
    setFrames(extractAnim(arr))
    const a = [...arr]
    a[0] = a[a.length - 1]
    a.pop()
    let i = 0
    while (true) {
      const l = 2 * i + 1
      const r = 2 * i + 2
      let largest = i
      if (l < a.length && a[l] > a[largest]) largest = l
      if (r < a.length && a[r] > a[largest]) largest = r
      if (largest === i) break
      const tmp = a[i]
      a[i] = a[largest]
      a[largest] = tmp
      i = largest
    }
    setArr(a)
  }
  const onClear = () => {
    setArr([])
    setFrames([
      {
        state: { arr: [], activeIdx: null, comparingIdx: null, swapped: false },
        description: 'Cleared.',
      },
    ])
  }

  const state = tl.frame.state
  const { layout, NODE, height } = heapLayout(state.arr.length)

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 py-8">
      <div
        className="relative rounded-lg border border-[#EFEFEF] bg-white overflow-hidden"
        style={{ width: 540, height: Math.max(440, height + 60) }}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          width={540}
          height={Math.max(440, height + 60)}
        >
          {state.arr.map((_, i) => {
            if (i === 0) return null
            const parent = Math.floor((i - 1) / 2)
            const a = layout[parent]
            const b = layout[i]
            return (
              <line
                key={`e-${i}`}
                x1={a.x + NODE / 2}
                y1={a.y + NODE / 2}
                x2={b.x + NODE / 2}
                y2={b.y + NODE / 2}
                stroke={T.line}
                strokeWidth={1}
              />
            )
          })}
        </svg>
        <AnimatePresence>
          {state.arr.map((v, i) => {
            const p = layout[i]
            const isActive = state.activeIdx === i
            const isComparing = state.comparingIdx === i
            return (
              <motion.div
                key={`heap-${i}-${v}`}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: isComparing && !isActive ? 0.85 : 1,
                  scale: 1,
                  x: p.x,
                  y: p.y,
                  backgroundColor: isActive
                    ? T.ink
                    : isComparing
                    ? '#444'
                    : '#FFFFFF',
                  color: isActive || isComparing ? '#FFFFFF' : T.ink,
                  borderColor: isActive || isComparing ? T.ink : '#D8D8D8',
                }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={SPRING}
                className="absolute flex items-center justify-center rounded-full border font-mono text-[12px] tabular-nums"
                style={{ left: 0, top: 0, width: NODE, height: NODE }}
              >
                {v}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      <div className="mt-4 flex flex-wrap gap-1 justify-center max-w-[640px]">
        {state.arr.map((v, i) => (
          <div
            key={`arr-${i}-${v}`}
            className={[
              'min-w-[34px] h-7 px-2 inline-flex items-center justify-center text-[11px] font-mono tabular-nums rounded border',
              state.activeIdx === i
                ? 'bg-[#222] text-white border-[#222]'
                : state.comparingIdx === i
                ? 'border-[#222]'
                : 'border-[#E5E5E5] text-[#666]',
            ].join(' ')}
          >
            {v}
          </div>
        ))}
      </div>
      <div className="mt-4 text-[12px] text-[#666] tracking-tight text-center min-h-[1.4em] px-4">
        {tl.frame.description}
      </div>
    </div>
  )

  const controls = (
    <div className="flex flex-col">
      <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
        <NumberInputRow
          label="Insert value"
          value={pendingValue}
          onChange={setPendingValue}
          onSubmit={onInsert}
          placeholder="42"
          buttonLabel="Insert"
          buttonIcon={<Plus size={13} strokeWidth={2} />}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <GhostButton
            onClick={onExtract}
            disabled={arr.length === 0}
            className="justify-center"
          >
            Extract max
          </GhostButton>
          <GhostButton
            onClick={onClear}
            disabled={arr.length === 0}
            className="justify-center"
          >
            <Trash2 size={13} strokeWidth={1.6} /> Clear
          </GhostButton>
        </div>
        <div className="text-[11px] text-[#666] flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
          <span>Size</span>
          <span className="font-mono tabular-nums text-[#222]">
            {arr.length}
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
      title="Pseudocode · Max-Heap"
      pseudocode={{ lines: HEAP_PSEUDOCODE }}
      activeLine={tl.frame.activeLine}
      description="Array-backed binary heap. Parent of i = (i−1)/2; children = 2i+1, 2i+2. Insert/extract are O(log n)."
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
