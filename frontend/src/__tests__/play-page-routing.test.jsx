/**
 * PlayPage routing tests.
 *
 * Verifies that PlayPage correctly redirects to game-specific players when
 * the general /student/attempts endpoint throws (e.g. 501 for crossword).
 *
 * F4-test-gap: exercises the crossword routing path that was missing coverage.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import PlayPage from '../pages/PlayPage.jsx';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    api: {
      ...actual.api,
      startAttempt: vi.fn(),
      crossword: {
        ...(actual.api.crossword || {}),
        startAttempt: vi.fn(),
      },
    },
  };
});

let api;
beforeEach(async () => {
  cleanup();
  vi.clearAllMocks();
  const mod = await import('../api.js');
  api = mod.api;
  // Crossword player — returns minimal valid payload to prevent component crash
  api.crossword.startAttempt.mockResolvedValue({
    attempt_id: 1,
    title: 'Test Crossword',
    difficulty: 'medium',
    grid_rows: 3,
    grid_cols: 3,
    cells: [],
    across: [],
    down: [],
    tools: [],
    filled_cells: {},
  });
});

afterEach(() => cleanup());

test('PlayPage redirects to /play/crossword/:id when startAttempt throws with crossword message', async () => {
  // The general /student/attempts endpoint returns 501 for crossword:
  // "Crossword player is not available yet"
  api.startAttempt.mockRejectedValue(
    new Error('Crossword player is not available yet'),
  );

  render(
    <MemoryRouter initialEntries={['/play/a/42']}>
      <Routes>
        <Route
          path="/play/a/:activityId"
          element={<PlayPage user={{ name: 'Learner' }} onSignOut={vi.fn()} />}
        />
        {/* Stub the crossword route so we can verify navigation succeeded */}
        <Route
          path="/play/crossword/:activityId"
          element={<div data-testid="crossword-player-stub" />}
        />
      </Routes>
    </MemoryRouter>,
  );

  // After the redirect, the crossword route should be rendered
  await waitFor(() =>
    expect(screen.getByTestId('crossword-player-stub')).toBeInTheDocument(),
  );
});
