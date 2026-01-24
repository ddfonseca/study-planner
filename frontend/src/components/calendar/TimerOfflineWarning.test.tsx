import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { TimerOfflineWarning } from './TimerOfflineWarning'

describe('TimerOfflineWarning', () => {
  let originalNavigatorOnLine: boolean

  beforeEach(() => {
    originalNavigatorOnLine = navigator.onLine
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      writable: true,
      configurable: true,
    })
  })

  describe('when online', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      })
    })

    it('does not render when online', () => {
      render(<TimerOfflineWarning />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('when offline', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })
    })

    it('renders when offline', () => {
      render(<TimerOfflineWarning />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('displays default message', () => {
      render(<TimerOfflineWarning />)
      expect(screen.getByText('Você está offline. A sessão será salva quando a conexão voltar.')).toBeInTheDocument()
    })

    it('displays custom message when provided', () => {
      render(<TimerOfflineWarning message="Sem conexão com a internet" />)
      expect(screen.getByText('Sem conexão com a internet')).toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
      render(<TimerOfflineWarning />)
      const warning = screen.getByRole('alert')
      expect(warning).toHaveAttribute('aria-live', 'polite')
    })

    it('contains WifiOff icon hidden from screen readers', () => {
      render(<TimerOfflineWarning />)
      const warning = screen.getByRole('alert')
      const icon = warning.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('accepts custom className', () => {
      render(<TimerOfflineWarning className="custom-class" />)
      const warning = screen.getByRole('alert')
      expect(warning).toHaveClass('custom-class')
    })

    it('has inline styling for timer context', () => {
      render(<TimerOfflineWarning />)
      const warning = screen.getByRole('alert')
      expect(warning).toHaveClass('rounded-md')
      expect(warning).toHaveClass('text-xs')
    })
  })

  describe('connectivity changes', () => {
    it('shows warning when going offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      })

      render(<TimerOfflineWarning />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('hides warning when going online', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })

      render(<TimerOfflineWarning />)
      expect(screen.getByRole('alert')).toBeInTheDocument()

      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
