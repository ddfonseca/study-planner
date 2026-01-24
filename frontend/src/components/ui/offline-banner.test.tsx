import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { OfflineBanner } from './offline-banner'

describe('OfflineBanner', () => {
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
      render(<OfflineBanner />)
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
      render(<OfflineBanner />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('displays default message', () => {
      render(<OfflineBanner />)
      expect(screen.getByText('Você está offline')).toBeInTheDocument()
    })

    it('displays custom message when provided', () => {
      render(<OfflineBanner message="Sem conexão" />)
      expect(screen.getByText('Sem conexão')).toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
      render(<OfflineBanner />)
      const banner = screen.getByRole('alert')
      expect(banner).toHaveAttribute('aria-live', 'assertive')
    })

    it('contains WifiOff icon hidden from screen readers', () => {
      render(<OfflineBanner />)
      const banner = screen.getByRole('alert')
      const icon = banner.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('accepts custom className', () => {
      render(<OfflineBanner className="custom-class" />)
      const banner = screen.getByRole('alert')
      expect(banner).toHaveClass('custom-class')
    })

    it('has fixed positioning and styling', () => {
      render(<OfflineBanner />)
      const banner = screen.getByRole('alert')
      expect(banner).toHaveClass('fixed')
      expect(banner).toHaveClass('top-0')
      expect(banner).toHaveClass('z-50')
    })
  })

  describe('connectivity changes', () => {
    it('shows banner when going offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      })

      render(<OfflineBanner />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('hides banner when going online', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })

      render(<OfflineBanner />)
      expect(screen.getByRole('alert')).toBeInTheDocument()

      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
