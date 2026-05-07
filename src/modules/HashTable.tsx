import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  ControlPanel,
  GhostButton,
  Label,
  LogicBox,
  ModuleLayout,
} from '../shared/atoms'
import { type Frame, useTimeline } from '../shared/timeline'
import { T } from '../shared/tokens'

type HashSlot = { key: number; value: number } | null
type HashFrame = {
  table: HashSlot[]
  activeIdx: number | null
  probedIdxs: number[]
  status: 'idle' | 'probing' | 'placed' | 'collision' | 'found' | 'not-found'
}

const HASH_PSEUDOCODE = [
  'function insert(key, value):',
  '  i = hash(key) mod m',
  '  while table[i] is not empty:',
  '    if table[i].key == key:',
  '      table[i].value = value; return',
  '    i = (i + 1) mod m       // linear probe',
  '  table[i] = (key, value)',
]

const HASH_TABLE_SIZE = 11

export function HashTableModule() {
  const [table, setTable] = useState<HashSlot[]>(() =>
    new Array(HASH_TABLE_SIZE).fill(null),
  )
  const [pendingKey, setPendingKey] = useState('')
  const [pendingValue, setPendingValue] = useState('')
  const [frames, setFrames] = useState<Frame<HashFrame>[]>([
    {
      state: {
        table: new Array(HASH_TABLE_SIZE).fill(null),
        activeIdx: null,
        probedIdxs: [],
        status: 'idle',
      },
      description: `Empty table (m = ${HASH_TABLE_SIZE}).`,
    },
  ])
  const tl = useTimeline(frames, { autoplayOnChange: true, defaultSpeed: 1.5 })

  const insertAnim = (
    current: HashSlot[],
    key: number,
    value: number,
  ): Frame<HashFrame>[] => {
    const fr: Frame<HashFrame>[] = []
    const m = current.length
    const t = current.slice()
    const start = ((key % m) + m) % m
    const probed: number[] = []
    let i = start
    fr.push({
      state: { table: t.slice(), activeIdx: i, probedIdxs: [...probed], status: 'probing' },
      description: `hash(${key}) mod ${m} = ${start}.`,
      activeLine: 1,
    })
    let attempts = 0
    while (t[i] !== null && attempts < m) {
      probed.push(i)
      if (t[i]!.key === key) {
        t[i] = { key, value }
        fr.push({
          state: { table: t.slice(), activeIdx: i, probedIdxs: [...probed], status: 'placed' },
          description: `Key ${key} already exists; updated value.`,
          activeLine: 4,
        })
        return fr
      }
      fr.push({
        state: { table: t.slice(), activeIdx: i, probedIdxs: [...probed], status: 'collision' },
        description: `Slot ${i} is taken (key ${t[i]!.key}). Probe forward.`,
        activeLine: 5,
      })
      i = (i + 1) % m
      attempts++
    }
    if (attempts >= m) {
      fr.push({
        state: { table: t.slice(), activeIdx: null, probedIdxs: [...probed], status: 'collision' },
        description: `Table full — would resize in a real impl.`,
      })
      return fr
    }
    t[i] = { key, value }
    fr.push({
      state: { table: t.slice(), activeIdx: i, probedIdxs: [...probed], status: 'placed' },
      description: `Place (${key} → ${value}) at slot ${i}.`,
      activeLine: 6,
    })
    return fr
  }

  const lookupAnim = (current: HashSlot[], key: number): Frame<HashFrame>[] => {
    const fr: Frame<HashFrame>[] = []
    const m = current.length
    const start = ((key % m) + m) % m
    const probed: number[] = []
    let i = start
    fr.push({
      state: { table: current, activeIdx: i, probedIdxs: [...probed], status: 'probing' },
      description: `Lookup ${key}: hash mod ${m} = ${start}.`,
    })
    let attempts = 0
    while (current[i] !== null && attempts < m) {
      probed.push(i)
      if (current[i]!.key === key) {
        fr.push({
          state: { table: current, activeIdx: i, probedIdxs: [...probed], status: 'found' },
          description: `Found ${key} at slot ${i} → value ${current[i]!.value}.`,
        })
        return fr
      }
      fr.push({
        state: { table: current, activeIdx: i, probedIdxs: [...probed], status: 'collision' },
        description: `Slot ${i} has ${current[i]!.key}; probe forward.`,
      })
      i = (i + 1) % m
      attempts++
    }
    fr.push({
      state: { table: current, activeIdx: null, probedIdxs: [...probed], status: 'not-found' },
      description: `${key} not in table.`,
    })
    return fr
  }

  const onInsert = () => {
    const k = parseInt(pendingKey, 10)
    const v = pendingValue === '' ? k : parseInt(pendingValue, 10)
    if (isNaN(k) || isNaN(v)) return
    const next = table.slice()
    const fr = insertAnim(table, k, v)
    setFrames(fr)
    const m = next.length
    let i = ((k % m) + m) % m
    let attempts = 0
    while (next[i] !== null && attempts < m) {
      if (next[i]!.key === k) {
        next[i] = { key: k, value: v }
        setTable(next)
        setPendingKey('')
        setPendingValue('')
        return
      }
      i = (i + 1) % m
      attempts++
    }
    if (attempts < m) next[i] = { key: k, value: v }
    setTable(next)
    setPendingKey('')
    setPendingValue('')
  }

  const onLookup = () => {
    const k = parseInt(pendingKey, 10)
    if (isNaN(k)) return
    setFrames(lookupAnim(table, k))
  }

  const onClear = () => {
    const empty: HashSlot[] = new Array(HASH_TABLE_SIZE).fill(null)
    setTable(empty)
    setFrames([
      {
        state: { table: empty, activeIdx: null, probedIdxs: [], status: 'idle' },
        description: 'Cleared.',
      },
    ])
  }

  const state = tl.frame.state
  const SLOT_W = 44
  const SLOT_H = 60
  const totalW = SLOT_W * HASH_TABLE_SIZE + (HASH_TABLE_SIZE - 1) * 2
  const startX = (540 - totalW) / 2
  const baseY = (440 - SLOT_H) / 2

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 py-8">
      <div
        className="relative rounded-lg border border-[#EFEFEF] bg-white overflow-hidden"
        style={{ width: 540, height: 440 }}
      >
        {state.table.map((slot, i) => {
          const isActive = state.activeIdx === i
          const wasProbed = state.probedIdxs.includes(i)
          const x = startX + i * (SLOT_W + 2)
          return (
            <div key={`slot-${i}`}>
              <div
                className="absolute text-[10px] font-mono text-[#bbb]"
                style={{ left: x, top: baseY - 18, width: SLOT_W, textAlign: 'center' }}
              >
                {i}
              </div>
              <motion.div
                animate={{
                  backgroundColor: isActive
                    ? T.ink
                    : wasProbed
                    ? '#FAFAFA'
                    : '#FFFFFF',
                  borderColor: isActive ? T.ink : wasProbed ? '#bbb' : '#D8D8D8',
                  color: isActive ? '#FFFFFF' : T.ink,
                }}
                transition={{ duration: 0.18 }}
                className="absolute border rounded-md flex flex-col items-center justify-center font-mono text-[11px] tabular-nums"
                style={{ left: x, top: baseY, width: SLOT_W, height: SLOT_H }}
              >
                {slot ? (
                  <>
                    <span className="text-[12px] font-medium">{slot.key}</span>
                    <span className="text-[10px] opacity-70">→ {slot.value}</span>
                  </>
                ) : (
                  <span className="text-[#bbb] text-[12px]">·</span>
                )}
              </motion.div>
            </div>
          )
        })}
        <div className="absolute bottom-3 left-3 text-[10px] text-[#999] flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: T.ink }}
            />{' '}
            active
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#FAFAFA] border border-[#bbb]" />{' '}
            probed
          </span>
        </div>
      </div>
      <div className="mt-4 text-[12px] text-[#666] tracking-tight text-center min-h-[1.4em] px-4">
        {tl.frame.description}
      </div>
    </div>
  )

  const controls = (
    <div className="flex flex-col">
      <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-3">
        <Label>Insert / Lookup</Label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={pendingKey}
            onChange={(e) => setPendingKey(e.target.value)}
            placeholder="key"
            className="h-9 px-3 text-[13px] tabular-nums rounded-md border border-[#E5E5E5] focus:outline-none focus:border-[#222] bg-white"
          />
          <input
            type="number"
            value={pendingValue}
            onChange={(e) => setPendingValue(e.target.value)}
            placeholder="value"
            className="h-9 px-3 text-[13px] tabular-nums rounded-md border border-[#E5E5E5] focus:outline-none focus:border-[#222] bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onInsert}
            disabled={pendingKey === ''}
            className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-[12px] rounded-md bg-[#222] text-white border border-[#222] hover:bg-black disabled:opacity-25 transition-all"
          >
            <Plus size={13} strokeWidth={2} /> Insert
          </button>
          <GhostButton
            onClick={onLookup}
            disabled={pendingKey === ''}
            className="justify-center"
          >
            Lookup
          </GhostButton>
        </div>
        <GhostButton
          onClick={onClear}
          disabled={table.every((s) => s === null)}
          className="w-full justify-center"
        >
          <Trash2 size={13} strokeWidth={1.6} /> Clear table
        </GhostButton>
        <div className="text-[11px] text-[#666] flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
          <span>Load factor</span>
          <span className="font-mono tabular-nums text-[#222]">
            {(table.filter((s) => s !== null).length / HASH_TABLE_SIZE).toFixed(2)}
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
      title="Pseudocode · Open Addressing (linear probing)"
      pseudocode={{ lines: HASH_PSEUDOCODE }}
      activeLine={tl.frame.activeLine}
      description={`m = ${HASH_TABLE_SIZE}. Insert/lookup are O(1) amortised when load factor is low; degrade as the table fills (clustering).`}
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
