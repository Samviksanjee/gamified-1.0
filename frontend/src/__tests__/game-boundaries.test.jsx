import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, vi, beforeEach } from 'vitest';
import PuzzlePlayer from '../games/puzzle/PuzzlePlayer.jsx';
import CrosswordPlayer from '../games/crossword/CrosswordPlayer.jsx';

// Mock the api module so players do not hit the real network
vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    api: {
      ...actual.api,
      puzzle: {
        ...(actual.api.puzzle || {}),
        start: vi.fn().mockRejectedValue(new Error('Puzzle not available')),
        list: vi.fn().mockResolvedValue({ puzzles: [] }),
        saveProgress: vi.fn().mockResolvedValue({}),
        verify: vi.fn().mockResolvedValue({ is_correct: false, correct_pieces: 0, total_pieces: 9, score: null }),
        getReview: vi.fn().mockResolvedValue({ pieces: [], image: null, version_history_count: 0, max_regenerations: 5 }),
      },
      crossword: {
        startAttempt: vi.fn().mockRejectedValue(new Error('Crossword not available')),
      },
    },
  };
});

beforeEach(() => { vi.clearAllMocks(); });

test('PuzzlePlayer renders loading then error state when API unavailable; CrosswordPlayer calls startAttempt on mount', async () => {
  // PuzzlePlayer now has a real game UI — it calls api.puzzle.start which we mock to reject.
  render(
    <MemoryRouter initialEntries={['/play/puzzle/42']}>
      <Routes>
        <Route path="/play/puzzle/:activityId" element={<PuzzlePlayer />} />
      </Routes>
    </MemoryRouter>,
  );

  // Initial loading state
  expect(screen.getByText(/Loading puzzle/i)).toBeInTheDocument();

  // After API rejects, error state shown
  await waitFor(() =>
    expect(screen.getByText(/Could not load puzzle/i)).toBeInTheDocument(),
  );

  // A retry button is shown
  expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();

  // CrosswordPlayer (real player) calls startAttempt on mount
  const { api } = await import('../api.js');
  render(
    <MemoryRouter initialEntries={['/play/crossword/42']}>
      <Routes>
        <Route path="/play/crossword/:activityId" element={<CrosswordPlayer />} />
      </Routes>
    </MemoryRouter>,
  );

  await waitFor(() => expect(api.crossword.startAttempt).toHaveBeenCalledWith('42'));
});

test('CrosswordPlayer calls startAttempt on mount and shows error when service unavailable', async () => {
  const { api } = await import('../api.js');

  render(
    <MemoryRouter initialEntries={['/play/crossword/99']}>
      <Routes>
        <Route path="/play/crossword/:activityId" element={<CrosswordPlayer />} />
      </Routes>
    </MemoryRouter>,
  );

  // startAttempt is called on mount
  await waitFor(() => expect(api.crossword.startAttempt).toHaveBeenCalledWith('99'));

  // Error state appears after the rejected promise
  await waitFor(() =>
    expect(screen.getByText(/Crossword not available/i)).toBeInTheDocument(),
  );
});
