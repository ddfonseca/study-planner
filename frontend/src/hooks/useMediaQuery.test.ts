import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery, useIsMobile, useIsTabletOrSmaller, useIsSmallMobile } from './useMediaQuery'

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
})
