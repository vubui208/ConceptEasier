import { motion } from 'framer-motion'
import { ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'

export function IconButton({
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

export function GhostButton({
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

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.16em] text-[#999] font-medium">
      {children}
    </span>
  )
}

export function Slider({
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

export function ModuleLayout({
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

export function ControlPanel({
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

export function LogicBox({
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

export function NumberInputRow({
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
