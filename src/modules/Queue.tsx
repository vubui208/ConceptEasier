import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Trash2 } from 'lucide-react'
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

type QueueFrame = { items: number[]; activeIdx: number | null }

const QUEUE_PSEUDOCODE = [
  'class Queue:',
  '  enqueue(x):',
  '    items.append(x)        // tail',
  '  dequeue():',
  '    if isEmpty(): error',
  '    return items.removeFirst() // head',
  '  front(): return items[0]',
]

export function QueueModule() {
  const [items, setItems] = useState<number[]>([])
  const [pendingValue, setPendingValue] = useState('')
  const [frames, setFrames] = useState<Frame<QueueFrame>[]>([
    { state: { items: [], activeIdx: null }, description: 'Empty queue.' },
  ])
  const tl = useTimeline(frames, { autoplayOnChange: true, defaultSpeed: 1.5 })

  const enqueueAnim = (current: number[], v: number): Frame<QueueFrame>[] => {
    const target = [...current, v]
    return [
      {
        state: { items: current, activeIdx: null },
        description: `enqueue(${v}) — element approaches the tail`,
        activeLine: 2,
      },
      {
        state: { items: target, activeIdx: target.length - 1 },
        description: `${v} joins the back.`,
        activeLine: 2,
      },
      {
        state: { items: target, activeIdx: null },
        description: `Queue size: ${target.length}.`,
      },
    ]
  }

  const dequeueAnim = (current: number[]): Frame<QueueFrame>[] => {
    if (current.length === 0) return frames
    const head = current[0]
    const after = current.slice(1)
    return [
      {
        state: { items: current, activeIdx: 0 },
        description: `dequeue() — head is ${head}.`,
        activeLine: 5,
      },
      {
        state: { items: after, activeIdx: null },
        description: `Removed ${head}. Remaining ${after.length}.`,
        activeLine: 5,
      },
    ]
  }

  const handleEnqueue = () => {
    const v = parseInt(pendingValue, 10)
    if (isNaN(v)) return
    setFrames(enqueueAnim(items, v))
    setItems([...items, v])
    setPendingValue('')
  }

  const handleDequeue = () => {
    if (items.length === 0) return
    setFrames(dequeueAnim(items))
    setItems(items.slice(1))
  }

  const handleClear = () => {
    setFrames([{ state: { items: [], activeIdx: null }, description: 'Cleared.' }])
    setItems([])
  }

  const state = tl.frame.state
  const W = 56
  const H = 40
  const GAP = 8
  const baseY = (440 - H) / 2

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 py-8">
      <div
        className="relative rounded-lg border border-[#EFEFEF] bg-white"
        style={{ width: 540, height: 440 }}
      >
        {state.items.length > 0 && (
          <>
            <div
              className="absolute text-[10px] uppercase tracking-[0.16em] text-[#bbb]"
              style={{ left: 40, top: baseY - 22 }}
            >
              head →
            </div>
            <div
              className="absolute text-[10px] uppercase tracking-[0.16em] text-[#bbb]"
              style={{
                right: 40,
                top: baseY + H + 6,
              }}
            >
              ← tail
            </div>
          </>
        )}
        <AnimatePresence>
          {state.items.map((v, idx) => {
            const targetX = 40 + idx * (W + GAP)
            const isActive = state.activeIdx === idx
            return (
              <motion.div
                key={`${idx}-${v}`}
                initial={{ opacity: 0, x: 540 + 40, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  x: targetX,
                  y: baseY,
                  scale: 1,
                  backgroundColor: isActive ? T.ink : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : T.ink,
                  borderColor: isActive ? T.ink : '#D8D8D8',
                }}
                exit={{ opacity: 0, x: -80, scale: 0.9 }}
                transition={SPRING}
                className="absolute flex items-center justify-center font-mono text-[13px] tabular-nums border rounded-md"
                style={{ left: 0, top: 0, width: W, height: H }}
              >
                {v}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      <div className="mt-6 text-[12px] text-[#666] tracking-tight text-center min-h-[1.4em] px-4">
        {tl.frame.description}
      </div>
    </div>
  )

  const controls = (
    <div className="flex flex-col">
      <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
        <NumberInputRow
          label="Enqueue value"
          value={pendingValue}
          onChange={setPendingValue}
          onSubmit={handleEnqueue}
          placeholder="42"
          buttonLabel="Enqueue"
          buttonIcon={<Plus size={13} strokeWidth={2} />}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <GhostButton
            onClick={handleDequeue}
            disabled={items.length === 0}
            className="justify-center"
          >
            <Minus size={13} strokeWidth={1.8} /> Dequeue
          </GhostButton>
          <GhostButton
            onClick={handleClear}
            disabled={items.length === 0}
            className="justify-center"
          >
            <Trash2 size={13} strokeWidth={1.6} /> Clear
          </GhostButton>
        </div>
        <div className="text-[11px] text-[#666] flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
          <span>Size</span>
          <span className="font-mono tabular-nums text-[#222]">
            {items.length}
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
      title="Pseudocode · Queue"
      pseudocode={{ lines: QUEUE_PSEUDOCODE }}
      activeLine={tl.frame.activeLine}
      description="FIFO. enqueue at tail, dequeue at head — both O(1) amortised with deque or doubly-linked list."
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
