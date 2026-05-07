/**
 * ConceptEasier — interactive visualizations for Math, Algorithms, and Data Structures.
 *
 * One file. Three modules driven by a shared step-based timeline engine.
 *   - LinearTransformModule  matrix sliders → animated grid + basis vectors
 *   - SortingModule          bubble sort with frame-by-frame bar swaps
 *   - BSTModule              binary search tree insertion with path highlighting
 */

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Calculator,
  BarChart3,
  GitBranch,
  Shuffle,
  ChevronRight,
  Layers,
  ArrowRightLeft,
  Link2,
  Hash,
  TreePine,
  Trash2,
} from 'lucide-react'

/* ------------------------------------------------------------------ *
 * Design tokens — kept in one place for visual consistency.
 * ------------------------------------------------------------------ */
const T = {
  bg: '#FBFBFB',
  ink: '#222222',
  inkSoft: '#666666',
  inkSofter: '#999999',
  line: '#E5E5E5',
  lineSoft: '#F0F0F0',
  red: '#D9534F',
  green: '#5CB85C',
} as const

const SPRING = { type: 'spring' as const, stiffness: 220, damping: 26, mass: 0.6 }
const SOFT_SPRING = { type: 'spring' as const, stiffness: 130, damping: 20 }

/* ------------------------------------------------------------------ *
 * Timeline engine — the heart of the step-based playback model.
 * Every algorithm visualization captures its execution into Frame[],
 * then this hook drives a currentStep across that array.
 * ------------------------------------------------------------------ */
type Frame<S> = {
  state: S
  description: string
  activeLine?: number
}

type TimelineOptions = {
  autoplayOnChange?: boolean
  defaultSpeed?: number
}

function useTimeline<S>(frames: Frame<S>[], options: TimelineOptions = {}) {
  const { autoplayOnChange = false, defaultSpeed = 1 } = options
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(defaultSpeed)
  const isFirstRun = useRef(true)

  // When frames change (e.g. user shuffles or inserts), rewind & maybe autoplay.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    setStep(0)
    setIsPlaying(autoplayOnChange && frames.length > 1)
  }, [frames, autoplayOnChange])

  // Advance the playhead while playing. Auto-pauses at end of timeline.
  useEffect(() => {
    if (!isPlaying) return
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= frames.length - 1) {
          setIsPlaying(false)
          return s
        }
        return s + 1
      })
    }, Math.max(80, 600 / speed))
    return () => window.clearInterval(id)
  }, [isPlaying, speed, frames.length])

  const safeStep = Math.min(step, Math.max(frames.length - 1, 0))
  const frame = frames[safeStep] ?? frames[0]

  return {
    step: safeStep,
    frame,
    total: frames.length,
    isPlaying,
    speed,
    play: () => {
      if (step >= frames.length - 1) setStep(0)
      setIsPlaying(true)
    },
    pause: () => setIsPlaying(false),
    toggle: () => {
      if (!isPlaying && step >= frames.length - 1) {
        setStep(0)
        setIsPlaying(true)
      } else {
        setIsPlaying((p) => !p)
      }
    },
    reset: () => {
      setStep(0)
      setIsPlaying(false)
    },
    setStep,
    setSpeed,
  }
}

/* ------------------------------------------------------------------ *
 * UI atoms — small, monochrome, reusable.
 * ------------------------------------------------------------------ */
function IconButton({
  onClick,
  disabled,
  children,
  label,
  primary = false,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  label: string
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        'h-9 w-9 grid place-items-center rounded-md border transition-all duration-150',
        primary
          ? 'bg-[#222] text-white border-[#222] hover:bg-black'
          : 'bg-transparent text-[#222] border-[#E5E5E5] hover:bg-[#222]/[0.04]',
        'disabled:opacity-25 disabled:cursor-not-allowed',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function GhostButton({
  onClick,
  disabled,
  children,
  className = '',
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'h-9 px-3 inline-flex items-center gap-1.5 text-[12.5px] tracking-tight rounded-md',
        'border border-[#E5E5E5] hover:bg-[#222]/[0.04] transition-all duration-150',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.16em] text-[#999] font-medium">
      {children}
    </span>
  )
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full"
    />
  )
}

/* ------------------------------------------------------------------ *
 * Sidebar — module switcher.
 * ------------------------------------------------------------------ */
type ModuleId =
  | 'linear'
  | 'sort'
  | 'bst'
  | 'stack'
  | 'queue'
  | 'list'
  | 'heap'
  | 'hash'

type Category = 'Math' | 'Sorting' | 'Linear DS' | 'Trees' | 'Hashing'

const MODULES: ReadonlyArray<{
  id: ModuleId
  label: string
  category: Category
  icon: typeof Calculator
}> = [
  { id: 'linear', label: 'Linear Transformations', category: 'Math', icon: Calculator },
  { id: 'sort', label: 'Sorting', category: 'Sorting', icon: BarChart3 },
  { id: 'stack', label: 'Stack', category: 'Linear DS', icon: Layers },
  { id: 'queue', label: 'Queue', category: 'Linear DS', icon: ArrowRightLeft },
  { id: 'list', label: 'Linked List', category: 'Linear DS', icon: Link2 },
  { id: 'bst', label: 'Binary Search Tree', category: 'Trees', icon: GitBranch },
  { id: 'heap', label: 'Max-Heap', category: 'Trees', icon: TreePine },
  { id: 'hash', label: 'Hash Table', category: 'Hashing', icon: Hash },
]

const CATEGORY_ORDER: Category[] = [
  'Math',
  'Sorting',
  'Linear DS',
  'Trees',
  'Hashing',
]

function Sidebar({
  active,
  onSelect,
}: {
  active: ModuleId
  onSelect: (m: ModuleId) => void
}) {
  return (
    <aside className="w-64 shrink-0 border-r border-[#E5E5E5] flex flex-col">
      <div className="px-6 pt-7 pb-8">
        <div className="text-[18px] font-semibold tracking-tight text-[#222]">
          ConceptEasier<span className="text-[#999]">.</span>
        </div>
        <div className="text-[11px] text-[#999] tracking-tight mt-1.5">
          Visualize the math. See the code.
        </div>
      </div>

      <nav className="px-3 flex flex-col gap-0.5 overflow-y-auto">
        {CATEGORY_ORDER.map((category) => {
          const items = MODULES.filter((m) => m.category === category)
          if (items.length === 0) return null
          return (
            <div key={category} className="flex flex-col gap-0.5 mb-3">
              <div className="px-3 mb-1.5 mt-1">
                <Label>{category}</Label>
              </div>
              {items.map((m) => {
                const Icon = m.icon
                const isActive = m.id === active
                return (
                  <button
                    key={m.id}
                    onClick={() => onSelect(m.id)}
                    className={[
                      'group relative flex items-center gap-3 px-3 py-2 rounded-md text-left',
                      'transition-colors duration-150',
                      isActive ? 'bg-[#222]/[0.05]' : 'hover:bg-[#222]/[0.025]',
                    ].join(' ')}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#222] rounded-full"
                        transition={SOFT_SPRING}
                      />
                    )}
                    <Icon
                      size={14}
                      strokeWidth={1.5}
                      className="text-[#222] shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-[12.5px] font-medium leading-tight tracking-tight">
                      {m.label}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto px-6 pb-6 pt-8">
        <div className="border-t border-[#E5E5E5] pt-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#999] font-medium">
            About
          </div>
          <p className="text-[11.5px] text-[#666] leading-relaxed mt-2">
            A teaching prototype. Each module captures execution into a
            timeline of frames you can scrub through.
          </p>
        </div>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ *
 * Module layout — center stage + right panel (controls + logic).
 * ------------------------------------------------------------------ */
function ModuleLayout({
  stage,
  controls,
  logic,
}: {
  stage: ReactNode
  controls: ReactNode
  logic: ReactNode
}) {
  return (
    <>
      <section className="flex-1 flex flex-col items-center justify-center min-w-0 relative overflow-hidden">
        {stage}
      </section>
      <aside className="w-[340px] shrink-0 border-l border-[#E5E5E5] flex flex-col bg-[#FBFBFB]">
        {controls}
        {logic}
      </aside>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * ControlPanel — Play / Pause / Reset / Speed / Step scrub.
 * Reused by Sorting and BST modules.
 * ------------------------------------------------------------------ */
function ControlPanel({
  isPlaying,
  onPlayToggle,
  onReset,
  step,
  total,
  onScrub,
  speed,
  onSpeedChange,
  hideSpeed = false,
  extra,
}: {
  isPlaying: boolean
  onPlayToggle: () => void
  onReset: () => void
  step: number
  total: number
  onScrub: (s: number) => void
  speed: number
  onSpeedChange: (s: number) => void
  hideSpeed?: boolean
  extra?: ReactNode
}) {
  const lastIdx = Math.max(total - 1, 0)
  return (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <IconButton
          onClick={onPlayToggle}
          disabled={total <= 1}
          label={isPlaying ? 'Pause' : 'Play'}
          primary
        >
          {isPlaying ? (
            <Pause size={13} strokeWidth={2} />
          ) : (
            <Play size={13} strokeWidth={2} className="ml-[1px]" />
          )}
        </IconButton>
        <IconButton onClick={onReset} label="Reset">
          <RotateCcw size={13} strokeWidth={1.6} />
        </IconButton>
        <div className="ml-auto text-[11px] text-[#666] font-mono tabular-nums">
          {String(step).padStart(3, '0')}
          <span className="text-[#bbb] mx-0.5">/</span>
          {String(lastIdx).padStart(3, '0')}
        </div>
      </div>

      <div>
        <Label>Step</Label>
        <input
          type="range"
          value={step}
          min={0}
          max={lastIdx}
          step={1}
          onChange={(e) => onScrub(parseInt(e.target.value, 10))}
          className="w-full mt-1.5"
        />
      </div>

      {!hideSpeed && (
        <div>
          <div className="flex items-center justify-between">
            <Label>Speed</Label>
            <span className="text-[11px] font-mono text-[#666] tabular-nums">
              {speed.toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            value={speed}
            min={0.25}
            max={3}
            step={0.05}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full mt-1.5"
          />
        </div>
      )}

      {extra}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * LogicBox — formula or pseudocode with active-line highlight.
 * ------------------------------------------------------------------ */
function LogicBox({
  title,
  formula,
  pseudocode,
  activeLine,
  description,
}: {
  title: string
  formula?: ReactNode
  pseudocode?: { lines: string[] }
  activeLine?: number
  description?: string
}) {
  return (
    <div className="flex-1 flex flex-col px-5 py-5 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <Label>{title}</Label>
      </div>

      {formula && (
        <div className="mb-4 px-4 py-4 bg-white border border-[#E5E5E5] rounded-md">
          {formula}
        </div>
      )}

      {pseudocode && (
        <div className="font-mono text-[12px] leading-[1.7] flex-1 overflow-auto">
          {pseudocode.lines.map((line, i) => {
            const isActive = i === activeLine
            return (
              <motion.div
                key={i}
                animate={{
                  backgroundColor: isActive
                    ? 'rgba(34,34,34,0.06)'
                    : 'rgba(34,34,34,0)',
                }}
                transition={{ duration: 0.18 }}
                className={[
                  'flex items-start -mx-2 px-2 rounded',
                  isActive ? 'text-[#222]' : 'text-[#666]',
                ].join(' ')}
              >
                <span className="select-none w-5 mr-2 text-right text-[#bbb] text-[10px] pt-[3px]">
                  {String(i + 1).padStart(2, ' ')}
                </span>
                <code className="flex-1 whitespace-pre relative pl-3.5">
                  {isActive && (
                    <ChevronRight
                      size={10}
                      strokeWidth={2.4}
                      className="absolute left-0 top-[4px]"
                    />
                  )}
                  {line}
                </code>
              </motion.div>
            )
          })}
        </div>
      )}

      {description && (
        <div className="mt-3 pt-3 border-t border-[#E5E5E5] text-[11.5px] text-[#666] leading-relaxed">
          {description}
        </div>
      )}
    </div>
  )
}

/* ================================================================== *
 * MODULE 1 — Linear Transformations
 * ================================================================== */
type Mat2 = [[number, number], [number, number]]

const MATRIX_PRESETS: { label: string; m: Mat2 }[] = [
  { label: 'Identity', m: [[1, 0], [0, 1]] },
  {
    label: 'Rotate 45°',
    m: [
      [Math.SQRT1_2, -Math.SQRT1_2],
      [Math.SQRT1_2, Math.SQRT1_2],
    ],
  },
  { label: 'Shear x', m: [[1, 1], [0, 1]] },
  { label: 'Scale 2×', m: [[2, 0], [0, 2]] },
  { label: 'Reflect x', m: [[-1, 0], [0, 1]] },
  { label: 'Squish', m: [[1, 0.5], [0.5, 0.4]] },
]

function LinearTransformModule() {
  const [matrix, setMatrix] = useState<Mat2>([[1, 0], [0, 1]])
  const a = matrix[0][0]
  const b = matrix[0][1]
  const c = matrix[1][0]
  const d = matrix[1][1]
  const det = a * d - b * c

  const setEntry = (i: 0 | 1, j: 0 | 1, v: number) => {
    setMatrix((prev) => {
      const next: Mat2 = [
        [prev[0][0], prev[0][1]],
        [prev[1][0], prev[1][1]],
      ]
      next[i][j] = v
      return next
    })
  }

  // Canvas geometry — math-space → screen-space mapping.
  const SIZE = 580
  const HALF = SIZE / 2
  const SCALE = 50
  const RANGE = 6

  const project = useCallback(
    (x: number, y: number) => {
      const mx = a * x + b * y
      const my = c * x + d * y
      return [HALF + mx * SCALE, HALF - my * SCALE] as const
    },
    [a, b, c, d],
  )

  // Static reference grid (untransformed background).
  const refLines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = -RANGE; i <= RANGE; i++) {
    refLines.push({ x1: HALF + i * SCALE, y1: 0, x2: HALF + i * SCALE, y2: SIZE })
    refLines.push({ x1: 0, y1: HALF + i * SCALE, x2: SIZE, y2: HALF + i * SCALE })
  }

  // Transformed grid (springs to current matrix).
  const transformedV: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  const transformedH: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  for (let i = -RANGE; i <= RANGE; i++) {
    const a1 = project(i, -RANGE)
    const a2 = project(i, RANGE)
    transformedV.push({ x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], key: `v${i}` })
    const b1 = project(-RANGE, i)
    const b2 = project(RANGE, i)
    transformedH.push({ x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1], key: `h${i}` })
  }

  const origin = project(0, 0)
  const iHat = project(1, 0)
  const jHat = project(0, 1)
  const ijSum = project(1, 1)
  const detPoly = `${origin[0]},${origin[1]} ${iHat[0]},${iHat[1]} ${ijSum[0]},${ijSum[1]} ${jHat[0]},${jHat[1]}`
  const detFill = det < 0 ? T.red : T.ink
  const detOpacity = Math.min(0.07 + Math.min(Math.abs(det), 4) * 0.025, 0.18)

  const stage = (
    <div className="flex flex-col items-center justify-center w-full h-full p-8">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[580px] aspect-square"
      >
        {refLines.map((ln, idx) => (
          <line
            key={idx}
            x1={ln.x1}
            y1={ln.y1}
            x2={ln.x2}
            y2={ln.y2}
            stroke={T.line}
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
        <line x1={0} y1={HALF} x2={SIZE} y2={HALF} stroke={T.line} strokeWidth={1.5} />
        <line x1={HALF} y1={0} x2={HALF} y2={SIZE} stroke={T.line} strokeWidth={1.5} />

        <motion.polygon
          animate={{ points: detPoly, fill: detFill, fillOpacity: detOpacity }}
          transition={SOFT_SPRING}
          stroke="none"
        />

        {transformedV.map((s) => (
          <motion.line
            key={s.key}
            animate={{ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }}
            transition={SOFT_SPRING}
            stroke={T.ink}
            strokeOpacity={0.18}
            strokeWidth={1}
            initial={false}
          />
        ))}
        {transformedH.map((s) => (
          <motion.line
            key={s.key}
            animate={{ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }}
            transition={SOFT_SPRING}
            stroke={T.ink}
            strokeOpacity={0.18}
            strokeWidth={1}
            initial={false}
          />
        ))}

        {/* Transformed axes — slightly heavier */}
        <motion.line
          animate={{
            x1: project(-RANGE, 0)[0],
            y1: project(-RANGE, 0)[1],
            x2: project(RANGE, 0)[0],
            y2: project(RANGE, 0)[1],
          }}
          transition={SOFT_SPRING}
          stroke={T.ink}
          strokeOpacity={0.5}
          strokeWidth={1.4}
          initial={false}
        />
        <motion.line
          animate={{
            x1: project(0, -RANGE)[0],
            y1: project(0, -RANGE)[1],
            x2: project(0, RANGE)[0],
            y2: project(0, RANGE)[1],
          }}
          transition={SOFT_SPRING}
          stroke={T.ink}
          strokeOpacity={0.5}
          strokeWidth={1.4}
          initial={false}
        />

        {/* î basis vector (red) */}
        <motion.line
          animate={{ x2: iHat[0], y2: iHat[1] }}
          transition={SOFT_SPRING}
          x1={origin[0]}
          y1={origin[1]}
          stroke={T.red}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={false}
        />
        <motion.circle
          animate={{ cx: iHat[0], cy: iHat[1] }}
          transition={SOFT_SPRING}
          r={4.5}
          fill={T.red}
          initial={false}
        />
        {/* ĵ basis vector (green) */}
        <motion.line
          animate={{ x2: jHat[0], y2: jHat[1] }}
          transition={SOFT_SPRING}
          x1={origin[0]}
          y1={origin[1]}
          stroke={T.green}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={false}
        />
        <motion.circle
          animate={{ cx: jHat[0], cy: jHat[1] }}
          transition={SOFT_SPRING}
          r={4.5}
          fill={T.green}
          initial={false}
        />
      </svg>

      <div className="mt-4 flex items-center gap-5 text-[11px]">
        <span className="inline-flex items-center gap-2 text-[#666]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: T.red }}
          />
          î = ({a.toFixed(2)}, {c.toFixed(2)})
        </span>
        <span className="inline-flex items-center gap-2 text-[#666]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: T.green }}
          />
          ĵ = ({b.toFixed(2)}, {d.toFixed(2)})
        </span>
      </div>
    </div>
  )

  const ENTRIES: { name: string; i: 0 | 1; j: 0 | 1 }[] = [
    { name: 'a', i: 0, j: 0 },
    { name: 'b', i: 0, j: 1 },
    { name: 'c', i: 1, j: 0 },
    { name: 'd', i: 1, j: 1 },
  ]

  const controls = (
    <div className="px-5 py-5 border-b border-[#E5E5E5] flex flex-col gap-5">
      <div>
        <Label>Matrix Entries</Label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2.5">
          {ENTRIES.map((e) => {
            const v = matrix[e.i][e.j]
            return (
              <div key={e.name}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[12px] italic text-[#666]">{e.name}</span>
                  <span className="text-[11px] font-mono tabular-nums text-[#222]">
                    {v >= 0 ? ' ' : ''}
                    {v.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={v}
                  min={-3}
                  max={3}
                  step={0.05}
                  onChange={(nv) => setEntry(e.i, e.j, nv)}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <Label>Presets</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-2.5">
          {MATRIX_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setMatrix(p.m)}
              className="h-8 text-[11px] tracking-tight rounded-md border border-[#E5E5E5] hover:bg-[#222]/[0.04] transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const interp =
    det === 0
      ? 'Singular — space collapses onto a line. Inverse does not exist.'
      : det < 0
      ? 'Negative — orientation has been flipped (mirror).'
      : det > 1
      ? `Areas are scaled up by ${det.toFixed(2)}×.`
      : det < 1
      ? `Areas are scaled down by ${det.toFixed(2)}×.`
      : 'Areas are preserved.'

  const logic = (
    <LogicBox
      title="Formula"
      formula={
        <div className="flex flex-col gap-3">
          <div className="text-[12px] text-[#666] leading-relaxed">
            A 2×2 matrix transforms space by relocating the basis vectors î
            and ĵ. The columns of the matrix are the new positions.
          </div>
          <div className="flex items-center gap-2 font-mono text-[14px] mt-1">
            <span className="text-[#666]">
              T(<span className="italic">v</span>) =
            </span>
            <div className="flex items-stretch gap-0">
              <span className="block w-[3px] my-1 border-l border-t border-b border-[#222]" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 px-2 py-1 tabular-nums text-right">
                <span>{a.toFixed(2)}</span>
                <span>{b.toFixed(2)}</span>
                <span>{c.toFixed(2)}</span>
                <span>{d.toFixed(2)}</span>
              </div>
              <span className="block w-[3px] my-1 border-r border-t border-b border-[#222]" />
            </div>
            <span className="italic text-[#666]">v</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
            <Label>Determinant (ad − bc)</Label>
            <motion.span
              key={det.toFixed(2)}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={[
                'text-[14px] font-mono tabular-nums font-medium',
                det < 0 ? 'text-[#D9534F]' : 'text-[#222]',
              ].join(' ')}
            >
              {det.toFixed(2)}
            </motion.span>
          </div>
          <div className="text-[11px] text-[#999] leading-relaxed">{interp}</div>
        </div>
      }
    />
  )

  return <ModuleLayout stage={stage} controls={controls} logic={logic} />
}

/* ================================================================== *
 * MODULE 2 — Sorting (Bubble · Selection · Insertion)
 * ================================================================== */
type SortItem = { id: string; value: number }
type SortState = {
  items: SortItem[]
  comparing: [number, number] | null
  swapped: boolean
  sortedFrom: number
  sortedUpTo: number // inclusive boundary growing left→right (insertion/selection)
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
    state: {
      items: snap(),
      comparing: null,
      swapped: false,
      sortedFrom: n,
      sortedUpTo: -1,
    },
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
    state: {
      items: snap(),
      comparing: null,
      swapped: false,
      sortedFrom: 0,
      sortedUpTo: n - 1,
    },
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
    state: {
      items: snap(),
      comparing: null,
      swapped: false,
      sortedFrom: n,
      sortedUpTo: -1,
    },
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
    state: {
      items: snap(),
      comparing: null,
      swapped: false,
      sortedFrom: 0,
      sortedUpTo: n - 1,
    },
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
    state: {
      items: snap(),
      comparing: null,
      swapped: false,
      sortedFrom: n,
      sortedUpTo: 0,
    },
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
    state: {
      items: snap(),
      comparing: null,
      swapped: false,
      sortedFrom: 0,
      sortedUpTo: n - 1,
    },
    description: 'Sorted.',
    activeLine: 6,
  })
  return frames
}

function buildSortFrames(algo: SortAlgo, items: SortItem[]): Frame<SortState>[] {
  if (items.length === 0) return [{ state: emptySortState(items), description: 'Empty array.' }]
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

function SortingModule() {
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
          const isSorted =
            idx >= state.sortedFrom || idx <= state.sortedUpTo
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

/* ================================================================== *
 * MODULE 3 — Binary Search Tree
 * ================================================================== */
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

  // Immutable insert: clone, then walk down on the clone.
  const newTree = cloneTree(tree)!
  let current: TreeNode = newTree
  const visitedPath: string[] = []

  // Snapshot the working tree at each frame push — frames must be immutable
  // because we mutate `newTree` later when inserting the new node. Without
  // cloning, replaying the timeline shows the inserted node from step 0.
  const snap = () => cloneTree(newTree)!

  frames.push({
    state: { tree: snap(), visitedPath: [], comparingId: current.id, newNodeId: null },
    description: `Start at root (${current.value}). Compare with ${value}.`,
    activeLine: 0,
  })

  // Loop until we either descend into null (insert) or find a duplicate.
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

/**
 * In-order x-position layout: each node's x is its in-order index.
 * Guarantees no overlap regardless of tree shape.
 */
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

function BSTModule() {
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
    // Build a small balanced-ish demo tree from a fixed sequence.
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
                      stroke:
                        isComparing || isVisited || isNew ? T.ink : T.line,
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


/* ================================================================== *
 * Shared atoms for the new modules: number input + action panel
 * ================================================================== */

function NumberInputRow({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  buttonLabel,
  buttonIcon,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder?: string
  buttonLabel: string
  buttonIcon?: ReactNode
  disabled?: boolean
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
          }}
          placeholder={placeholder}
          className="flex-1 h-9 px-3 text-[13px] tabular-nums rounded-md border border-[#E5E5E5] focus:outline-none focus:border-[#222] transition-colors bg-white"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || value === ''}
          className="h-9 px-3 inline-flex items-center gap-1.5 text-[12.5px] rounded-md bg-[#222] text-white border border-[#222] hover:bg-black disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        >
          {buttonIcon}
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}

/* ================================================================== *
 * MODULE 4 — Stack (LIFO)
 * ================================================================== */
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

function StackModule() {
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
        {/* base line */}
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

/* ================================================================== *
 * MODULE 5 — Queue (FIFO)
 * ================================================================== */
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

function QueueModule() {
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
        {/* head/tail markers */}
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

/* ================================================================== *
 * MODULE 6 — Linked List
 * ================================================================== */
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

function LinkedListModule() {
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
          {/* terminator */}
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
        {/* head label */}
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

/* ================================================================== *
 * MODULE 7 — Max-Heap
 * ================================================================== */
type HeapFrame = {
  arr: number[] // 1-indexed conceptually, we use 0-indexed
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
  // Returns {x, y} for each index (0..n-1) in a near-complete binary tree.
  // We pre-compute level widths to keep horizontal spacing balanced.
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
  // Use position of each node based on 2^depth slots.
  for (let d = 0; d < rows.length; d++) {
    const slots = Math.pow(2, d)
    const spacing = CANVAS_W / (slots + 1)
    rows[d].forEach((cell) => {
      const slotInLevel = cell.idx - (Math.pow(2, d) - 1) // 0..slots-1
      const x = spacing * (slotInLevel + 1) - NODE / 2
      const y = PAD_Y + d * LEVEL_H
      layout[cell.idx] = { x, y }
    })
  }
  return { layout, NODE, height: PAD_Y + rows.length * LEVEL_H }
}

function HeapModule() {
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
        state: {
          arr: [...a],
          activeIdx: i,
          comparingIdx: parent,
          swapped: false,
        },
        description: `Compare child ${a[i]} with parent ${a[parent]}.`,
        activeLine: 2,
      })
      if (a[i] > a[parent]) {
        const tmp = a[i]
        a[i] = a[parent]
        a[parent] = tmp
        fr.push({
          state: {
            arr: [...a],
            activeIdx: parent,
            comparingIdx: i,
            swapped: true,
          },
          description: `${a[parent]} > ${a[i]} → sift up.`,
          activeLine: 2,
        })
        i = parent
      } else {
        fr.push({
          state: {
            arr: [...a],
            activeIdx: i,
            comparingIdx: null,
            swapped: false,
          },
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
          state: {
            arr: a.slice(),
            activeIdx: i,
            comparingIdx: null,
            swapped: false,
          },
          description: `arr[${i}] is ≥ children; sift-down done.`,
          activeLine: 7,
        })
        break
      }
      fr.push({
        state: {
          arr: a.slice(),
          activeIdx: i,
          comparingIdx: largest,
          swapped: false,
        },
        description: `Swap arr[${i}]=${a[i]} with larger child arr[${largest}]=${a[largest]}.`,
        activeLine: 7,
      })
      const next = a.slice()
      const tmp = next[i]
      next[i] = next[largest]
      next[largest] = tmp
      a = next
      fr.push({
        state: {
          arr: a.slice(),
          activeIdx: largest,
          comparingIdx: i,
          swapped: true,
        },
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
    // compute final state for ground-truth
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
      {/* array view */}
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

/* ================================================================== *
 * MODULE 8 — Hash Table (open addressing, linear probing)
 * ================================================================== */
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

function HashTableModule() {
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
      state: {
        table: t.slice(),
        activeIdx: i,
        probedIdxs: [...probed],
        status: 'probing',
      },
      description: `hash(${key}) mod ${m} = ${start}.`,
      activeLine: 1,
    })
    let attempts = 0
    while (t[i] !== null && attempts < m) {
      probed.push(i)
      if (t[i]!.key === key) {
        t[i] = { key, value }
        fr.push({
          state: {
            table: t.slice(),
            activeIdx: i,
            probedIdxs: [...probed],
            status: 'placed',
          },
          description: `Key ${key} already exists; updated value.`,
          activeLine: 4,
        })
        return fr
      }
      fr.push({
        state: {
          table: t.slice(),
          activeIdx: i,
          probedIdxs: [...probed],
          status: 'collision',
        },
        description: `Slot ${i} is taken (key ${t[i]!.key}). Probe forward.`,
        activeLine: 5,
      })
      i = (i + 1) % m
      attempts++
    }
    if (attempts >= m) {
      fr.push({
        state: {
          table: t.slice(),
          activeIdx: null,
          probedIdxs: [...probed],
          status: 'collision',
        },
        description: `Table full — would resize in a real impl.`,
      })
      return fr
    }
    t[i] = { key, value }
    fr.push({
      state: {
        table: t.slice(),
        activeIdx: i,
        probedIdxs: [...probed],
        status: 'placed',
      },
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
      state: {
        table: current,
        activeIdx: i,
        probedIdxs: [...probed],
        status: 'probing',
      },
      description: `Lookup ${key}: hash mod ${m} = ${start}.`,
    })
    let attempts = 0
    while (current[i] !== null && attempts < m) {
      probed.push(i)
      if (current[i]!.key === key) {
        fr.push({
          state: {
            table: current,
            activeIdx: i,
            probedIdxs: [...probed],
            status: 'found',
          },
          description: `Found ${key} at slot ${i} → value ${current[i]!.value}.`,
        })
        return fr
      }
      fr.push({
        state: {
          table: current,
          activeIdx: i,
          probedIdxs: [...probed],
          status: 'collision',
        },
        description: `Slot ${i} has ${current[i]!.key}; probe forward.`,
      })
      i = (i + 1) % m
      attempts++
    }
    fr.push({
      state: {
        table: current,
        activeIdx: null,
        probedIdxs: [...probed],
        status: 'not-found',
      },
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
    // commit: replay locally
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
        state: {
          table: empty,
          activeIdx: null,
          probedIdxs: [],
          status: 'idle',
        },
        description: 'Cleared.',
      },
    ])
  }

  const state = tl.frame.state
  const SLOT_W = 44
  const SLOT_H = 60
  const total = SLOT_W * HASH_TABLE_SIZE + (HASH_TABLE_SIZE - 1) * 2
  const startX = (540 - total) / 2
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
                style={{
                  left: x,
                  top: baseY,
                  width: SLOT_W,
                  height: SLOT_H,
                }}
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
        {/* legend */}
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

/* ================================================================== *
 * Root — composes sidebar + active module.
 * ================================================================== */
export default function ConceptEasier() {
  const [activeModule, setActiveModule] = useState<ModuleId>('linear')

  return (
    <div className="flex h-screen w-screen bg-[#FBFBFB] text-[#222] overflow-hidden">
      <Sidebar active={activeModule} onSelect={setActiveModule} />
      <main className="flex-1 flex min-w-0">
        {activeModule === 'linear' && <LinearTransformModule />}
        {activeModule === 'sort' && <SortingModule />}
        {activeModule === 'stack' && <StackModule />}
        {activeModule === 'queue' && <QueueModule />}
        {activeModule === 'list' && <LinkedListModule />}
        {activeModule === 'bst' && <BSTModule />}
        {activeModule === 'heap' && <HeapModule />}
        {activeModule === 'hash' && <HashTableModule />}
      </main>
    </div>
  )
}
