import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery, useIsMobile, useIsTabletOrSmaller, useIsSmallMobile, useIsTouchDevice } from './useMediaQuery'

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>
  let addEventListenerMock: ReturnType<typeof vi.fn>
  let removeEventListenerMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    addEventListenerMock = vi.fn()
    removeEventListenerMock = vi.fn()

    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useMediaQuery hook', () => {
    it('returns initial match state', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: true,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))

      expect(result.current).toBe(true)
    })

    it('returns false when media query does not match', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))

      expect(result.current).toBe(false)
    })

    it('adds event listener on mount', () => {
      renderHook(() => useMediaQuery('(max-width: 767px)'))

      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('removes event listener on unmount', () => {
      const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'))

      unmount()

      expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('updates when media query changes', () => {
      let changeHandler: (event: { matches: boolean }) => void = () => {}

      matchMediaMock.mockImplementation(() => ({
        matches: false,
        addEventListener: (_event: string, handler: typeof changeHandler) => {
          changeHandler = handler
        },
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))

      expect(result.current).toBe(false)

      act(() => {
        changeHandler({ matches: true })
      })

      expect(result.current).toBe(true)
    })
  })

  describe('useIsMobile hook', () => {
    it('uses correct breakpoint query', () => {
      renderHook(() => useIsMobile())

      expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 767px)')
    })

    it('returns true for mobile viewport', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: true,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    it('returns false for desktop viewport', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })
  })

  describe('useIsTabletOrSmaller hook', () => {
    it('uses correct breakpoint query', () => {
      renderHook(() => useIsTabletOrSmaller())

      expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 1023px)')
    })

    it('returns true for tablet viewport', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: true,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useIsTabletOrSmaller())

      expect(result.current).toBe(true)
    })
  })

  describe('useIsSmallMobile hook', () => {
    it('uses correct breakpoint query', () => {
      renderHook(() => useIsSmallMobile())

      expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 639px)')
    })

    it('returns true for small mobile viewport', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: true,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useIsSmallMobile())

      expect(result.current).toBe(true)
    })

    it('returns false for larger viewports', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useIsSmallMobile())

      expect(result.current).toBe(false)
    })
  })

  describe('useIsTouchDevice hook', () => {
    let originalOntouchstart: PropertyDescriptor | undefined
    let originalMaxTouchPoints: PropertyDescriptor | undefined

    beforeEach(() => {
      originalOntouchstart = Object.getOwnPropertyDescriptor(window, 'ontouchstart')
      originalMaxTouchPoints = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints')
    })

    afterEach(() => {
      if (originalOntouchstart) {
        Object.defineProperty(window, 'ontouchstart', originalOntouchstart)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).ontouchstart
      }
      if (originalMaxTouchPoints) {
        Object.defineProperty(navigator, 'maxTouchPoints', originalMaxTouchPoints)
      }
      document.documentElement.classList.remove('touch-device')
    })

    it('returns true when pointer is coarse (touch device)', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === '(pointer: coarse)',
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      const { result } = renderHook(() => useIsTouchDevice())

      expect(result.current).toBe(true)
    })

    it('returns true when ontouchstart is available', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      Object.defineProperty(window, 'ontouchstart', {
        value: null,
        configurable: true,
      })

      const { result } = renderHook(() => useIsTouchDevice())

      expect(result.current).toBe(true)
    })

    it('returns true when maxTouchPoints > 0', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      })

      const { result } = renderHook(() => useIsTouchDevice())

      expect(result.current).toBe(true)
    })

    it('returns false for non-touch device', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).ontouchstart

      const { result } = renderHook(() => useIsTouchDevice())

      expect(result.current).toBe(false)
    })

    it('adds touch-device class to document when touch is detected', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === '(pointer: coarse)',
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      renderHook(() => useIsTouchDevice())

      expect(document.documentElement.classList.contains('touch-device')).toBe(true)
    })

    it('detects touch on touchstart event', () => {
      matchMediaMock.mockImplementation(() => ({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }))

      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).ontouchstart

      const { result } = renderHook(() => useIsTouchDevice())

      expect(result.current).toBe(false)

      // Simulate touchstart event
      act(() => {
        window.dispatchEvent(new Event('touchstart'))
      })

      expect(result.current).toBe(true)
      expect(document.documentElement.classList.contains('touch-device')).toBe(true)
    })
  })
})
