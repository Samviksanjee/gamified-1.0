import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// react-confetti uses HTMLCanvasElement.getContext which jsdom doesn't implement.
// Mock the entire module in the test environment so tests are not affected.
vi.mock('react-confetti', () => ({ default: () => null }));

// react-confetti also reads window.innerWidth / innerHeight
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'innerWidth',  { writable: true, configurable: true, value: 1280 });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
}
