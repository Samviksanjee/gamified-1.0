import { fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import TimerReminder, { timerSettings } from '../components/TimerReminder.jsx';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('preserves the existing 30-second quiz reminder when no config exists', () => {
  expect(timerSettings(null, 'quiz')).toEqual({ enabled: true, duration_seconds: 30, reminder_at_seconds: 0 });
  expect(timerSettings(null, 'matching')).toEqual({ enabled: false });
});

test('counts down and shows a dismissible textual squirrel reminder without answer data', () => {
  render(<TimerReminder gameType="matching" config={{ enabled: true, duration_seconds: 5, reminder_at_seconds: 0 }} timerKey="question-1" />);
  expect(screen.getByLabelText('5 seconds remaining')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('status')).toHaveTextContent(/answer|thinking|time|clock|explorer|snack/i);
  expect(screen.queryByText(/correct answer|correct_order|correct_option_id/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss squirrel reminder' }));
  expect(screen.queryByRole('button', { name: 'Dismiss squirrel reminder' })).not.toBeInTheDocument();
});
