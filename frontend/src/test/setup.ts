import '@testing-library/jest-dom'

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock navigator.vibrate for haptic feedback tests
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  configurable: true,
  value: () => true,
});
