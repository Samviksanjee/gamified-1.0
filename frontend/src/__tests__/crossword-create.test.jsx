import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import CrosswordCreateForm from '../games/crossword/CrosswordCreateForm.jsx';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    api: {
      ...actual.api,
      crossword: {
        generate: vi.fn(),
      },
    },
  };
});

// Import AFTER mock so we get the mocked version
let api;
beforeEach(async () => {
  cleanup();
  vi.clearAllMocks();
  const mod = await import('../api.js');
  api = mod.api;
  api.crossword.generate.mockResolvedValue({ id: 42 });
});

function renderForm(overrides = {}) {
  const props = {
    selectedGameType: 'crossword',
    onStatus: vi.fn(),
    onError: vi.fn(),
    onNotice: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <CrosswordCreateForm {...props} />
    </MemoryRouter>,
  );
  return props;
}

test('renders topic, difficulty, grade, and assist mode fields', () => {
  renderForm();
  expect(document.querySelector('[data-game-form="crossword"]')).toBeTruthy();
  expect(screen.getByRole('textbox', { name: /crossword topic/i })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /difficulty/i })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /grade level/i })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /assist mode/i })).toBeInTheDocument();
});

test('Generate button calls api.crossword.generate with correct body', async () => {
  const { onStatus, onError } = renderForm();

  fireEvent.change(screen.getByRole('textbox', { name: /crossword topic/i }), {
    target: { value: 'Solar System' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: /difficulty/i }), {
    target: { value: 'hard' },
  });

  fireEvent.click(screen.getByRole('button', { name: /Generate Crossword/i }));

  await waitFor(() =>
    expect(api.crossword.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        game_type: 'crossword',
        topic: 'Solar System',
        difficulty: 'hard',
        assist_mode: true,
      }),
    ),
  );
});

test('shows loading state while request is in flight', async () => {
  // Make generate hang until we resolve manually
  let resolve;
  api.crossword.generate.mockReturnValue(new Promise((r) => { resolve = r; }));

  renderForm();
  fireEvent.change(screen.getByRole('textbox', { name: /crossword topic/i }), {
    target: { value: 'Volcanoes' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Generate Crossword/i }));

  expect(screen.getByRole('button', { name: /Generating crossword/i })).toBeDisabled();

  // Resolve to clean up
  resolve({ id: 99 });
});

test('calls onStatus({state:"ready", draftId}) on success', async () => {
  const { onStatus } = renderForm();
  api.crossword.generate.mockResolvedValue({ id: 77 });

  fireEvent.change(screen.getByRole('textbox', { name: /crossword topic/i }), {
    target: { value: 'Ancient Rome' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Generate Crossword/i }));

  await waitFor(() =>
    expect(onStatus).toHaveBeenCalledWith({ state: 'ready', draftId: 77 }),
  );
});

test('calls onStatus({state:"error"}) and onError on failure', async () => {
  const { onStatus, onError } = renderForm();
  api.crossword.generate.mockRejectedValue(new Error('AI service unavailable'));

  fireEvent.change(screen.getByRole('textbox', { name: /crossword topic/i }), {
    target: { value: 'Ecosystems' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Generate Crossword/i }));

  await waitFor(() =>
    expect(onStatus).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'error' }),
    ),
  );
  expect(onError).toHaveBeenCalledWith('AI service unavailable');
});
