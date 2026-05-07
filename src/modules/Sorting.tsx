import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  ControlPanel,
  GhostButton,
  Label,
  LogicBox,
  ModuleLayout,
} from '../shared/atoms'
import { type Frame, useTimeline } from '../shared/timeline'
import { SPRING, T } from '../shared/tokens'

type SortItem = { id: string; value: number }
type SortState = {
  items: SortItem[]
  comparing: [number, number] | null
  swapped: boolean
  sortedFrom: number
  sortedUpTo: number
}

type SortAlgo = 'bubble' | 'selection' | 'insertion'

const SORT_LABELS: Record<SortAlgo, string> = {
  bubble: 'Bubble',
  selection: 'Selection',
  insertion: 'Insertion',
}

const SORT_PSEUDOCODE: Record<SortAlgo, string[]> = {
  bubble: [
    'function bubbleSort(arr):',
    '  n = length(arr)',
    '  for i from 0 to n-1:',
    '    for j from 0 to n-i-2:',
    '      if arr[j] > arr[j+1]:',
    '        swap(arr[j], arr[j+1])',
    '  return arr',
  ],
  selection: [
    'function selectionSort(arr):',
    '  n = length(arr)',
    '  for i from 0 to n-1:',
    '    minIdx = i',
    '    for j from i+1 to n-1:',
    '      if arr[j] < arr[minIdx]:',
    '        minIdx = j',
    '    swap(arr[i], arr[minIdx])',
    '  return arr',
  ],
  insertion: [
    'function insertionSort(arr):',
    '  for i from 1 to n-1:',
    '    j = i',
    '    while j > 0 and arr[j-1] > arr[j]:',
    '      swap(arr[j-1], arr[j])',
    '      j = j - 1',
    '  return arr',
  ],
}

const SORT_DESC: Record<SortAlgo, string> = {
  bubble:
    'Time O(n²) · Space O(1) · Stable. Each pass bubbles the next-largest element to its final position.',
  selection:
    'Time O(n²) · Space O(1) · Not stable. Each pass selects the minimum of the remaining slice and swaps it into place.',
  insertion:
    'Time O(n²) · Space O(1) · Stable. Best on nearly-sorted input — O(n) when already sorted.',
}

function emptySortState(arr: SortItem[]): SortState {
  return {
    items: arr.map((it) => ({ ...it })),
    comparing: null,
    swapped: false,
    sortedFrom: arr.length,
    sortedUpTo: -1,
  }
}

function buildBubbleSortFrames(initial: SortItem[]): Frame<SortState>[] {
  const frames: Frame<SortState>[] = []
  const arr = initial.map((it) => ({ ...it }))
  const n = arr.length
  const snap = (): SortItem[] => arr.map((it) => ({ ...it }))

  frames.push({
    state: { items: snap(), comparing: null, swapped: false, sortedFrom: n, sortedUpTo: -1 },
    description: `Initial array of ${n} elements.`,
    activeLine: 0,
  })
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      frames.push({
        state: {
          items: snap(),
          comparing: [j, j + 1],
          swapped: false,
          sortedFrom: n - i,
          sortedUpTo: -1,
        },
        description: `Compare ${arr[j].value} and ${arr[j + 1].value}.`,
        activeLine: 4,
      })
      if (arr[j].value > arr[j + 1].value) {
        const tmp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = tmp
        frames.push({
          state: {
            items: snap(),
            comparing: [j, j + 1],
            swapped: true,
            sortedFrom: n - i,
            sortedUpTo: -1,
          },
          description: `Swap ${arr[j].value} ↔ ${arr[j + 1].value}.`,
          activeLine: 5,
        })
      }
    }
  }
  frames.push({
    state: { items: snap(), comparing: null, swapped: false, sortedFrom: 0, sortedUpTo: n - 1 },
    description: 'Sorted.',
    activeLine: 6,
  })
  return frames
}

function buildSelectionSortFrames(initial: SortItem[]): Frame<SortState>[] {
  const frames: Frame<SortState>[] = []
  const arr = initial.map((it) => ({ ...it }))
  const n = arr.length
  const snap = (): SortItem[] => arr.map((it) => ({ ...it }))

  frames.push({
    state: { items: snap(), comparing: null, swapped: false, sortedFrom: n, sortedUpTo: -1 },
    description: `Initial array of ${n} elements.`,
    activeLine: 0,
  })
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    frames.push({
      state: {
        items: snap(),
        comparing: [i, minIdx],
        swapped: false,
        sortedFrom: n,
        sortedUpTo: i - 1,
      },
      description: `Pass ${i + 1}: assume index ${i} (${arr[i].value}) is the minimum.`,
      activeLine: 3,
    })
    for (let j = i + 1; j < n; j++) {
      frames.push({
        state: {
          items: snap(),
          comparing: [j, minIdx],
          swapped: false,
          sortedFrom: n,
          sortedUpTo: i - 1,
        },
        description: `Compare ${arr[j].value} (idx ${j}) with current min ${arr[minIdx].value}.`,
        activeLine: 5,
      })
      if (arr[j].value < arr[minIdx].value) {
        minIdx = j
        frames.push({
          state: {
            items: snap(),
            comparing: [i, minIdx],
            swapped: false,
            sortedFrom: n,
            sortedUpTo: i - 1,
          },
          description: `New minimum: ${arr[minIdx].value} at index ${minIdx}.`,
          activeLine: 6,
        })
      }
    }
    if (minIdx !== i) {
      const tmp = arr[i]
      arr[i] = arr[minIdx]
      arr[minIdx] = tmp
      frames.push({
        state: {
          items: snap(),
          comparing: [i, minIdx],
          swapped: true,
          sortedFrom: n,
          sortedUpTo: i,
        },
        description: `Swap minimum into position ${i}.`,
        activeLine: 7,
      })
    } else {
      frames.push({
        state: {
          items: snap(),
          comparing: null,
          swapped: false,
          sortedFrom: n,
          sortedUpTo: i,
        },
        description: `${arr[i].value} already in place.`,
        activeLine: 7,
      })
    }
  }
  frames.push({
    state: { items: snap(), comparing: null, swapped: false, sortedFrom: 0, sortedUpTo: n - 1 },
    description: 'Sorted.',
    activeLine: 8,
  })
  return frames
}

function buildInsertionSortFrames(initial: SortItem[]): Frame<SortState>[] {
  const frames: Frame<SortState>[] = []
  const arr = initial.map((it) => ({ ...it }))
  const n = arr.length
  const snap = (): SortItem[] => arr.map((it) => ({ ...it }))

  frames.push({
    state: { items: snap(), comparing: null, swapped: false, sortedFrom: n, sortedUpTo: 0 },
    description: `Initial array of ${n} elements (first element is trivially sorted).`,
    activeLine: 0,
  })
  for (let i = 1; i < n; i++) {
    let j = i
    frames.push({
      state: {
        items: snap(),
        comparing: [j, j],
        swapped: false,
        sortedFrom: n,
        sortedUpTo: i - 1,
      },
      description: `Pick arr[${i}] = ${arr[i].value} and slide it left.`,
      activeLine: 2,
    })
    while (j > 0 && arr[j - 1].value > arr[j].value) {
      frames.push({
        state: {
          items: snap(),
          comparing: [j - 1, j],
          swapped: false,
          sortedFrom: n,
          sortedUpTo: i,
        },
        description: `${arr[j - 1].value} > ${arr[j].value} → swap.`,
        activeLine: 3,
      })
      const tmp = arr[j - 1]
      arr[j - 1] = arr[j]
      arr[j] = tmp
      frames.push({
        state: {
          items: snap(),
          comparing: [j - 1, j],
          swapped: true,
          sortedFrom: n,
          sortedUpTo: i,
        },
        description: `After swap.`,
        activeLine: 4,
      })
      j--
    }
    frames.push({
      state: {
        items: snap(),
        comparing: null,
        swapped: false,
        sortedFrom: n,
        sortedUpTo: i,
      },
      description: `${arr[j].value} is in its place; sorted prefix grows to ${i + 1}.`,
      activeLine: 5,
    })
  }
  frames.push({
    state: { items: snap(), comparing: null, swapped: false, sortedFrom: 0, sortedUpTo: n - 1 },
    description: 'Sorted.',
    activeLine: 6,
  })
  return frames
}

function buildSortFrames(algo: SortAlgo, items: SortItem[]): Frame<SortState>[] {
  if (items.length === 0)
    return [{ state: emptySortState(items), description: 'Empty array.' }]
  switch (algo) {
    case 'bubble':
      return buildBubbleSortFrames(items)
    case 'selection':
      return buildSelectionSortFrames(items)
    case 'insertion':
      return buildInsertionSortFrames(items)
  }
}

function makeRandomArray(n = 12): SortItem[] {
  return Array.from({ length: n }, (_, idx) => ({
    id: `bar-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    value: Math.floor(Math.random() * 88) + 10,
  }))
}

export function SortingModule() {
  const [algo, setAlgo] = useState<SortAlgo>('bubble')
  const [seed, setSeed] = useState<SortItem[]>(() => makeRandomArray(12))
  const frames = useMemo(() => buildSortFrames(algo, seed), [algo, seed])
  const tl = useTimeline(frames)
  const state = tl.frame.state

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 py-8">
      <div
        className="w-full max-w-[640px] flex justify-center items-stretch gap-1.5"
        style={{ height: 440 }}
      >
        {state.items.map((it, idx) => {
          const isComparing =
            state.comparing &&
            (state.comparing[0] === idx || state.comparing[1] === idx)
          const isSorted = idx >= state.sortedFrom || idx <= state.sortedUpTo
          const barH = Math.round(40 + (it.value / 100) * 340)
          return (
            <motion.div
              key={it.id}
              layout
              transition={SPRING}
              className="flex-1 max-w-[44px] flex flex-col justify-end items-center"
            >
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: barH,
                  opacity: 1,
                  backgroundColor: isComparing
                    ? T.ink
                    : isSorted
                    ? '#FAFAFA'
                    : '#FFFFFF',
                  borderColor: isComparing
                    ? T.ink
                    : isSorted
                    ? T.line
                    : '#D8D8D8',
                }}
                transition={{
                  height: { duration: 0.22, ease: 'easeOut' },
                  backgroundColor: { duration: 0.18 },
                  borderColor: { duration: 0.18 },
                }}
                className="w-full rounded-sm border"
                style={{ minHeight: 4 }}
              />
              <div className="mt-2 text-[10px] tabular-nums text-[#999] font-mono">
                {it.value}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-8 text-[12px] text-[#666] tracking-tight max-w-[640px] text-center min-h-[1.4em] px-4">
        {tl.frame.description}
      </div>
    </div>
  )

  const controls = (
    <div className="flex flex-col">
      <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-3">
        <Label>Algorithm</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['bubble', 'selection', 'insertion'] as SortAlgo[]).map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={[
                'h-8 text-[11.5px] tracking-tight rounded-md border transition-all',
                algo === a
                  ? 'bg-[#222] text-white border-[#222]'
                  : 'border-[#E5E5E5] hover:bg-[#222]/[0.04]',
              ].join(' ')}
            >
              {SORT_LABELS[a]}
            </button>
          ))}
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
        extra={
          <GhostButton
            onClick={() => setSeed(makeRandomArray(12))}
            className="w-full justify-center"
          >
            <Shuffle size={13} strokeWidth={1.6} /> Shuffle Array
          </GhostButton>
        }
      />
    </div>
  )

  const logic = (
    <LogicBox
      title={`Pseudocode · ${SORT_LABELS[algo]} Sort`}
      pseudocode={{ lines: SORT_PSEUDOCODE[algo] }}
      activeLine={tl.frame.activeLine}
      description={SORT_DESC[algo]}
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}
