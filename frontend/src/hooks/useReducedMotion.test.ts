import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion, useAnimationDuration, useEasing } from './useReducedMotion'

describe('useReducedMotion', () => {
  let matchMediaMock: {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    matchMediaMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => matchMediaMock),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when user does not prefer reduced motion', () => {
    matchMediaMock.matches = false
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when user prefers reduced motion', () => {
    matchMediaMock.matches = true
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('queries the correct media query', () => {
    renderHook(() => useReducedMotion())
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('adds event listener for preference changes', () => {
    renderHook(() => useReducedMotion())
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes event listener on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion())
    unmount()
    expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('updates when preference changes', () => {
    matchMediaMock.matches = false
    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)

    // Simulate preference change
    act(() => {
      const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1]
      changeHandler({ matches: true })
    })

    expect(result.current).toBe(true)
  })
})

describe('useAnimationDuration', () => {
  let matchMediaMock: {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    matchMediaMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => matchMediaMock),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns normal duration when reduced motion is not preferred', () => {
    matchMediaMock.matches = false
    const { result } = renderHook(() => useAnimationDuration(500))
    expect(result.current).toBe(500)
  })

  it('returns 0 by default when reduced motion is preferred', () => {
    matchMediaMock.matches = true
    const { result } = renderHook(() => useAnimationDuration(500))
    expect(result.current).toBe(0)
  })

  it('returns custom reduced duration when specified', () => {
    matchMediaMock.matches = true
    const { result } = renderHook(() => useAnimationDuration(500, 50))
    expect(result.current).toBe(50)
  })
})

describe('useEasing', () => {
  let matchMediaMock: {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    matchMediaMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => matchMediaMock),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns ease-out cubic function when animations are enabled', () => {
    matchMediaMock.matches = false
    const { result } = renderHook(() => useEasing())

    // Ease-out cubic: at progress 0.5, the eased value should be ~0.875
    const eased = result.current(0.5)
    expect(eased).toBeCloseTo(0.875, 2)
  })

  it('returns linear function when reduced motion is preferred', () => {
    matchMediaMock.matches = true
    const { result } = renderHook(() => useEasing())

    // Linear: progress should equal eased value
    expect(result.current(0)).toBe(0)
    expect(result.current(0.5)).toBe(0.5)
    expect(result.current(1)).toBe(1)
  })

  it('ease-out cubic starts at 0 and ends at 1', () => {
    matchMediaMock.matches = false
    const { result } = renderHook(() => useEasing())

    expect(result.current(0)).toBe(0)
    expect(result.current(1)).toBe(1)
  })
})
