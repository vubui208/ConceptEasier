import { useEffect, useRef, useState } from 'react'

export type Frame<S> = {
  state: S
  description: string
  activeLine?: number
}

type TimelineOptions = {
  autoplayOnChange?: boolean
  defaultSpeed?: number
}

export function useTimeline<S>(
  frames: Frame<S>[],
  options: TimelineOptions = {},
) {
  const { autoplayOnChange = false, defaultSpeed = 1 } = options
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(defaultSpeed)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    setStep(0)
    setIsPlaying(autoplayOnChange && frames.length > 1)
  }, [frames, autoplayOnChange])

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
