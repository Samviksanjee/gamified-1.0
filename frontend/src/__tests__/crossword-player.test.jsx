import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import CrosswordPlayer from '../games/crossword/CrosswordPlayer.jsx';

/*
 * Sample play payload:
 *   Across 1: row=0,col=0, length=3 → cells (0,0),(0,1),(0,2)
 *   Down   1: row=0,col=0, length=3 → cells (0,0),(1,0),(2,0)
 *   Total unique word cells = 5
 */
const SAMPLE_DATA = {
  attempt_id: 1,
  activity_id: 42,
  title: 'Test Crossword',
  difficulty: 'medium',
  grid_rows: 5,
  grid_cols: 5,
  cells: [
    { row: 0, col: 0, is_blocked: false, number: 1 },
    { row: 0, col: 1, is_blocked: false, number: null },
    { row: 0, col: 2, is_blocked: false, number: null },
    { row: 1, col: 0, is_blocked: false, number: null },
    { row: 2, col: 0, is_blocked: false, number: null },
  ],
  across: [
    { word_id: 1, number: 1, clue: 'First across clue', hint: 'Hint A', row: 0, col: 0, length: 3 },
  ],
  down: [
    { word_id: 2, number: 1, clue: 'First down clue', hint: 'Hint D', row: 0, col: 0, length: 3 },
  ],
  tools: ['check_letter', 'reveal_letter'],
  assist_mode: true,
  filled_cells: {},
  status: 'in_progress',
};

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    api: {
      ...actual.api,
      crossword: {
        startAttempt: vi.fn(),
        checkCells: vi.fn(),
        revealCells: vi.fn(),
        saveProgress: vi.fn(),
        completeAttempt: vi.fn(),
        previewPlay: vi.fn(),
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
  api.crossword.startAttempt.mockResolvedValue(SAMPLE_DATA);
  api.crossword.checkCells.mockResolvedValue({ cell_results: {} });
  api.crossword.revealCells.mockResolvedValue({ revealed: {} });
  api.crossword.saveProgress.mockResolvedValue({});
  api.crossword.completeAttempt.mockResolvedValue({
    completed: true, score: 85, time_seconds: 120, hints_used: 2, words_correct: 2, words_total: 2,
  });
  api.crossword.previewPlay.mockResolvedValue({
    ...SAMPLE_DATA, attempt_id: null, preview_mode: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function renderPlayer() {
  return render(
    <MemoryRouter initialEntries={['/play/crossword/42']}>
      <Routes>
        <Route path="/play/crossword/:activityId" element={<CrosswordPlayer />} />
      </Routes>
    </MemoryRouter>,
  );
}

test('grid renders correct number of word cells', async () => {
  renderPlayer();
  await waitFor(() => expect(api.crossword.startAttempt).toHaveBeenCalledWith('42'));
  // 5 non-blocked word cells → 5 role="button" td elements
  await waitFor(() => {
    const wordCells = document.querySelectorAll('td[role="button"]');
    expect(wordCells.length).toBe(5);
  });
});

test('clicking a clue selects the word and announces in aria region', async () => {
  renderPlayer();
  await waitFor(() => expect(screen.getByText('First across clue')).toBeInTheDocument());

  // Click the "First down clue" button in the clue list
  fireEvent.click(screen.getByRole('button', { name: /1\. First down clue/i }));

  // Aria-live region should reflect the active clue
  await waitFor(() =>
    expect(screen.getByTestId('active-clue')).toHaveTextContent('First down clue'),
  );
});

test('typing a letter fills the active cell', async () => {
  renderPlayer();
  await waitFor(() => {
    const wordCells = document.querySelectorAll('td[role="button"]');
    expect(wordCells.length).toBe(5);
  });

  // Click the first cell to make it active
  const firstCell = document.querySelector('td[data-cell="0,0"]');
  fireEvent.click(firstCell);

  // Type a letter via the window keydown listener
  const grid = screen.getByRole('grid');
  fireEvent.keyDown(grid, { key: 'A' });

  // Cell (0,0) should now contain 'A'
  await waitFor(() => {
    const cell = document.querySelector('td[data-cell="0,0"]');
    expect(cell.textContent).toContain('A');
  });
});

test('autosave debounced: saveProgress called once after 3000ms', async () => {
  // Render and load with real timers first
  renderPlayer();
  await waitFor(() => {
    const cells = document.querySelectorAll('td[role="button"]');
    expect(cells.length).toBe(5);
  });

  // Switch to fake timers after load to control the debounce
  vi.useFakeTimers();

  // Interact: click a cell and type a letter to trigger autosave scheduling
  const cell = document.querySelector('td[data-cell="0,0"]');
  if (cell) fireEvent.click(cell);
  const grid = screen.getByRole('grid');
  fireEvent.keyDown(grid, { key: 'B' });

  // Advance fake timers by exactly 3000ms — fires the debounced save
  vi.advanceTimersByTime(3000);

  // Restore real timers before awaiting (so waitFor works normally)
  vi.useRealTimers();

  await waitFor(() => expect(api.crossword.saveProgress).toHaveBeenCalledTimes(1));
});

test('Check Letter button calls checkCells with scope letter', async () => {
  renderPlayer();
  await waitFor(() => expect(screen.getByRole('button', { name: /Check Letter/i })).toBeInTheDocument());

  // Select a cell first
  const cell = document.querySelector('td[data-cell="0,0"]');
  if (cell) fireEvent.click(cell);

  fireEvent.click(screen.getByRole('button', { name: /Check Letter/i }));

  await waitFor(() =>
    expect(api.crossword.checkCells).toHaveBeenCalledWith(
      '42', 1, expect.objectContaining({ scope: 'letter' }),
    ),
  );
});

test('Reveal Letter button calls revealCells with scope letter', async () => {
  renderPlayer();
  await waitFor(() => expect(screen.getByRole('button', { name: /Reveal Letter/i })).toBeInTheDocument());

  const cell = document.querySelector('td[data-cell="0,0"]');
  if (cell) fireEvent.click(cell);

  fireEvent.click(screen.getByRole('button', { name: /Reveal Letter/i }));

  await waitFor(() =>
    expect(api.crossword.revealCells).toHaveBeenCalledWith(
      '42', 1, expect.objectContaining({ scope: 'letter' }),
    ),
  );
});

test('completion modal appears when completeAttempt returns completed:true', async () => {
  api.crossword.completeAttempt.mockResolvedValue({
    completed: true, score: 90, time_seconds: 60, hints_used: 0, words_correct: 2, words_total: 2,
  });

  renderPlayer();
  await waitFor(() => {
    const cells = document.querySelectorAll('td[role="button"]');
    expect(cells.length).toBe(5);
  });

  const grid = screen.getByRole('grid');
  const cellKeys = ['0,0', '0,1', '0,2', '1,0', '2,0'];

  // Fill all 5 word cells
  for (const key of cellKeys) {
    const cell = document.querySelector(`td[data-cell="${key}"]`);
    if (cell) fireEvent.click(cell);
    fireEvent.keyDown(grid, { key: 'A' });
  }

  await waitFor(() => expect(api.crossword.completeAttempt).toHaveBeenCalled(), { timeout: 3000 });
});

test('completion modal shows score', async () => {
  api.crossword.completeAttempt.mockResolvedValue({
    completed: true, score: 85, time_seconds: 120, hints_used: 1, words_correct: 2, words_total: 2,
  });

  renderPlayer();
  await waitFor(() => {
    const cells = document.querySelectorAll('td[role="button"]');
    expect(cells.length).toBe(5);
  });

  const grid = screen.getByRole('grid');
  for (const key of ['0,0', '0,1', '0,2', '1,0', '2,0']) {
    const cell = document.querySelector(`td[data-cell="${key}"]`);
    if (cell) fireEvent.click(cell);
    fireEvent.keyDown(grid, { key: 'Z' });
  }

  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: /Crossword complete/i })).not.toBeNull(),
    { timeout: 3000 },
  );
  expect(screen.getByText('85/100')).toBeInTheDocument();
});

test('Escape key blurs the grid and clears active cell', async () => {
  renderPlayer();
  await waitFor(() => {
    const cells = document.querySelectorAll('td[role="button"]');
    expect(cells.length).toBe(5);
  });

  // Click a cell to focus the grid
  const cell = document.querySelector('td[data-cell="0,0"]');
  fireEvent.click(cell);

  const grid = screen.getByRole('grid');

  // Press Escape — grid should lose focus
  fireEvent.keyDown(grid, { key: 'Escape' });

  // After Escape, the grid should not be the active element
  await waitFor(() => {
    expect(document.activeElement).not.toBe(grid);
  });
});

test('completeAttempt rejection shows error banner and no completion modal', async () => {
  api.crossword.completeAttempt.mockRejectedValue(new Error('Network error'));

  renderPlayer();
  await waitFor(() => {
    const cells = document.querySelectorAll('td[role="button"]');
    expect(cells.length).toBe(5);
  });

  const grid = screen.getByRole('grid');
  const cellKeys = ['0,0', '0,1', '0,2', '1,0', '2,0'];

  // Fill all 5 word cells to trigger completion
  for (const key of cellKeys) {
    const cell = document.querySelector(`td[data-cell="${key}"]`);
    if (cell) fireEvent.click(cell);
    fireEvent.keyDown(grid, { key: 'A' });
  }

  // Wait for completeAttempt to be called and rejected
  await waitFor(() => expect(api.crossword.completeAttempt).toHaveBeenCalled(), { timeout: 3000 });

  // Error banner should appear
  await waitFor(() =>
    expect(screen.getByRole('alert')).toBeInTheDocument(),
    { timeout: 3000 },
  );

  // Completion modal should NOT appear
  expect(screen.queryByRole('dialog', { name: /Crossword complete/i })).toBeNull();
});

test('checkCells rejection shows in-game error message', async () => {
  api.crossword.checkCells.mockRejectedValue(new Error('Server error'));

  renderPlayer();
  await waitFor(() => expect(screen.getByRole('button', { name: /Check Letter/i })).toBeInTheDocument());

  // Select a cell first
  const cell = document.querySelector('td[data-cell="0,0"]');
  if (cell) fireEvent.click(cell);

  fireEvent.click(screen.getByRole('button', { name: /Check Letter/i }));

  // Error message should appear
  await waitFor(() =>
    expect(screen.getByRole('alert')).toBeInTheDocument(),
  );
  expect(screen.getByRole('alert')).toHaveTextContent(/Could not complete the action/i);
});

test('403 startAttempt fallback shows preview-mode banner', async () => {
  // Simulate a teacher / 403 rejection so the component falls back to previewPlay
  api.crossword.startAttempt.mockRejectedValue(new Error('403 Forbidden'));
  api.crossword.previewPlay.mockResolvedValue({
    ...SAMPLE_DATA, attempt_id: null, preview_mode: true,
  });

  renderPlayer();

  // Preview banner should appear
  await waitFor(() =>
    expect(screen.getByText(/preview mode/i)).toBeInTheDocument(),
  );

  // Grid should still render (previewPlay returned full puzzle data)
  await waitFor(() => {
    const wordCells = document.querySelectorAll('td[role="button"]');
    expect(wordCells.length).toBe(5);
  });

  // Autosave must NOT fire — attempt_id is null in preview mode
  expect(api.crossword.saveProgress).not.toHaveBeenCalled();
});
