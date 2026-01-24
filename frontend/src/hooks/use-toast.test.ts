import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useToast, reducer, toast } from './use-toast'

describe('use-toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  describe('reducer', () => {
    it('adds toast with ADD_TOAST action', () => {
      const state = { toasts: [] }
      const newState = reducer(state, {
        type: 'ADD_TOAST',
        toast: { id: '1', title: 'Test', duration: 5000, open: true },
      })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0].id).toBe('1')
      expect(newState.toasts[0].duration).toBe(5000)
    })

    it('updates toast with UPDATE_TOAST action', () => {
      const state = {
        toasts: [{ id: '1', title: 'Original', duration: 5000, open: true }],
      }
      const newState = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      })

      expect(newState.toasts[0].title).toBe('Updated')
      expect(newState.toasts[0].duration).toBe(5000)
    })

    it('limits toasts to TOAST_LIMIT (1)', () => {
      const state = { toasts: [] }
      let newState = reducer(state, {
        type: 'ADD_TOAST',
        toast: { id: '1', title: 'First', open: true },
      })
      newState = reducer(newState, {
        type: 'ADD_TOAST',
        toast: { id: '2', title: 'Second', open: true },
      })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0].id).toBe('2')
    })

    it('dismisses toast with DISMISS_TOAST action', () => {
      const state = {
        toasts: [{ id: '1', title: 'Test', open: true }],
      }
      const newState = reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      })

      expect(newState.toasts[0].open).toBe(false)
    })

    it('removes toast with REMOVE_TOAST action', () => {
      const state = {
        toasts: [{ id: '1', title: 'Test', open: true }],
      }
      const newState = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      })

      expect(newState.toasts).toHaveLength(0)
    })

    it('removes all toasts when REMOVE_TOAST has no toastId', () => {
      const state = {
        toasts: [
          { id: '1', title: 'Test1', open: true },
        ],
      }
      const newState = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: undefined,
      })

      expect(newState.toasts).toHaveLength(0)
    })

    it('preserves duration when updating toast', () => {
      const state = {
        toasts: [{ id: '1', title: 'Original', duration: 3000, open: true }],
      }
      const newState = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', description: 'New description' },
      })

      expect(newState.toasts[0].duration).toBe(3000)
      expect(newState.toasts[0].description).toBe('New description')
    })
  })

  describe('toast function', () => {
    it('creates toast with default duration of 5000ms', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Test' })
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].duration).toBe(5000)

      // Clean up
      act(() => {
        result.current.dismiss()
      })
    })

    it('creates toast with custom duration', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Test', duration: 3000 })
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].duration).toBe(3000)

      // Clean up
      act(() => {
        result.current.dismiss()
      })
    })

    it('creates toast with title and description', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Title', description: 'Description' })
      })

      expect(result.current.toasts[0].title).toBe('Title')
      expect(result.current.toasts[0].description).toBe('Description')

      // Clean up
      act(() => {
        result.current.dismiss()
      })
    })

    it('returns toast controls with id, dismiss, and update', () => {
      let toastControls: ReturnType<typeof toast> | undefined

      act(() => {
        toastControls = toast({ title: 'Test' })
      })

      expect(toastControls).toHaveProperty('id')
      expect(toastControls).toHaveProperty('dismiss')
      expect(toastControls).toHaveProperty('update')

      // Clean up
      act(() => {
        toastControls?.dismiss()
      })
    })
  })

  describe('useToast hook', () => {
    it('provides toast function', () => {
      const { result } = renderHook(() => useToast())
      expect(result.current.toast).toBeDefined()
      expect(typeof result.current.toast).toBe('function')
    })

    it('provides dismiss function', () => {
      const { result } = renderHook(() => useToast())
      expect(result.current.dismiss).toBeDefined()
      expect(typeof result.current.dismiss).toBe('function')
    })

    it('provides toasts array', () => {
      const { result } = renderHook(() => useToast())
      expect(Array.isArray(result.current.toasts)).toBe(true)
    })

    it('can dismiss a specific toast', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Test' })
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].open).toBe(true)

      act(() => {
        result.current.dismiss(result.current.toasts[0].id)
      })

      expect(result.current.toasts[0].open).toBe(false)
    })
  })
})
