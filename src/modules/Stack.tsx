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

type StackOp = 'init' | 'push' | 'pop' | 'clear'
type StackFrame = { items: number[]; activeIdx: number | null; op: StackOp }

const STACK_PSEUDOCODE = [
  'class Stack:',
  '  push(x):',
  '    items.append(x)         // O(1)',
  '  pop():',
  '    if isEmpty(): error',
  '    return items.removeLast() // O(1)',
  '  peek(): return items[-1]',
]

export function StackModule() {
  const [items, setItems] = useState<number[]>([])
  const [pendingValue, setPendingValue] = useState('')
  const [frames, setFrames] = useState<Frame<StackFrame>[]>([
    { state: { items: [], activeIdx: null, op: 'init' }, description: 'Empty stack.' },
  ])
  const tl = useTimeline(frames, { autoplayOnChange: true, defaultSpeed: 1.5 })

  const pushAnim = (current: number[], v: number): Frame<StackFrame>[] => {
    const target = [...current, v]
    return [
      {
        state: { items: current, activeIdx: null, op: 'push' },
        description: `push(${v}) — element falls in from above`,
        activeLine: 2,
      },
      {
        state: { items: target, activeIdx: target.length - 1, op: 'push' },
        description: `${v} placed on top.`,
        activeLine: 2,
      },
      {
        state: { items: target, activeIdx: null, op: 'push' },
        description: `Stack size: ${target.length}.`,
      },
    ]
  }

  const popAnim = (current: number[]): Frame<StackFrame>[] => {
    if (current.length === 0) return frames
    const top = current[current.length - 1]
    const after = current.slice(0, -1)
    return [
      {
        state: { items: current, activeIdx: current.length - 1, op: 'pop' },
        description: `pop() — top element is ${top}.`,
        activeLine: 5,
      },
      {
        state: { items: after, activeIdx: null, op: 'pop' },
        description: `Removed ${top}. Size: ${after.length}.`,
        activeLine: 5,
      },
    ]
  }

  const handlePush = () => {
    const v = parseInt(pendingValue, 10)
    if (isNaN(v)) return
    const next = [...items, v]
    setFrames(pushAnim(items, v))
    setItems(next)
    setPendingValue('')
  }

  const handlePop = () => {
    if (items.length === 0) return
    setFrames(popAnim(items))
    setItems(items.slice(0, -1))
  }

  const handleClear = () => {
    setFrames([
      {
        state: { items: [], activeIdx: null, op: 'clear' },
        description: 'Cleared.',
      },
    ])
    setItems([])
  }

  const state = tl.frame.state
  const W = 80
  const H = 36
  const GAP = 6
  const BASE_Y = 380
  const CANVAS_H = 440
  const cx = (540 - W) / 2

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 py-8">
      <div
        className="relative rounded-lg border border-[#EFEFEF] bg-white"
        style={{ width: 540, height: CANVAS_H }}
      >
        <AnimatePresence>
          {state.items.map((v, idx) => {
            const targetY = BASE_Y - idx * (H + GAP)
            const isActive = state.activeIdx === idx
            return (
              <motion.div
                key={`${idx}-${v}`}
                initial={{ opacity: 0, y: -80, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: targetY,
                  scale: 1,
                  backgroundColor: isActive ? T.ink : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : T.ink,
                  borderColor: isActive ? T.ink : '#D8D8D8',
                }}
                exit={{ opacity: 0, y: -80, scale: 0.9 }}
                transition={SPRING}
                className="absolute flex items-center justify-center font-mono text-[13px] tabular-nums border rounded-md"
                style={{ left: cx, top: 0, width: W, height: H }}
              >
                {v}
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div
          className="absolute"
          style={{
            left: cx - 12,
            width: W + 24,
            top: BASE_Y + H + 4,
            height: 1,
            background: T.line,
          }}
        />
        <div
          className="absolute text-[10px] uppercase tracking-[0.16em] text-[#bbb]"
          style={{ left: cx - 12, top: BASE_Y + H + 8 }}
        >
          base
        </div>
      </div>

      <div className="mt-6 text-[12px] text-[#666] tracking-tight max-w-[640px] text-center min-h-[1.4em] px-4">
        {tl.frame.description}
      </div>
    </div>
  )

  const controls = (
    <div className="flex flex-col">
      <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
        <NumberInputRow
          label="Push value"
          value={pendingValue}
          onChange={setPendingValue}
          onSubmit={handlePush}
          placeholder="42"
          buttonLabel="Push"
          buttonIcon={<Plus size={13} strokeWidth={2} />}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <GhostButton
            onClick={handlePop}
            disabled={items.length === 0}
            className="justify-center"
          >
            <Minus size={13} strokeWidth={1.8} /> Pop
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
      title="Pseudocode · Stack"
      pseudocode={{ lines: STACK_PSEUDOCODE }}
      activeLine={tl.frame.activeLine}
      description="LIFO. push, pop, peek are all O(1). Common backing: dynamic array or singly-linked list."
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
