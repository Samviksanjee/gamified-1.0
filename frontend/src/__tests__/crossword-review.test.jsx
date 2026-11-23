import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import CrosswordReview from '../games/crossword/CrosswordReview.jsx';

const SAMPLE_DRAFT = {
  id: 1,
  topic: 'Solar System',
  title: 'Solar System Crossword',
  status: 'draft',
  difficulty: 'medium',
  grade_level: 5,
  grid_rows: 5,
  grid_cols: 5,
  assist_mode: true,
  regen_count: 1,
  regen_limit: 5,
  classroom_ids: [],
  words: [
    { id: 1, number: 1, answer: 'SUN', clue: 'The star at the centre', hint: 'Our closest star', direction: 'across', row: 0, col: 0 },
    { id: 2, number: 1, answer: 'SKY', clue: 'Above the clouds', hint: 'Look up', direction: 'down', row: 0, col: 0 },
  ],
};

const SAMPLE_PUBLISHED = { ...SAMPLE_DRAFT, status: 'published' };

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    api: {
      ...actual.api,
      crossword: {
        get: vi.fn(),
        editWord: vi.fn(),
        deleteWord: vi.fn(),
        addWord: vi.fn(),
        regenerate: vi.fn(),
        relayout: vi.fn(),
        approve: vi.fn(),
        publish: vi.fn(),
        unpublish: vi.fn(),
        delete: vi.fn(),
        classrooms: vi.fn(),
      },
      classrooms: vi.fn().mockResolvedValue([]),
    },
  };
});

let api;
beforeEach(async () => {
  cleanup();
  vi.clearAllMocks();
  const mod = await import('../api.js');
  api = mod.api;
  api.crossword.get.mockResolvedValue(SAMPLE_DRAFT);
  api.crossword.editWord.mockResolvedValue({});
  api.crossword.deleteWord.mockResolvedValue({});
  api.crossword.approve.mockResolvedValue({});
  api.classrooms.mockResolvedValue([]);
});

function renderReview(props = {}) {
  render(
    <MemoryRouter>
      <CrosswordReview activityId="1" onRefresh={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

test('grid renders cells for word positions', async () => {
  renderReview();
  await waitFor(() => expect(api.crossword.get).toHaveBeenCalledWith('1'));
  // Grid should be rendered
  expect(document.querySelector('[aria-label="Crossword grid preview"]')).toBeTruthy();
});

test('word list shows number, clue, and answer', async () => {
  renderReview();
  await waitFor(() => expect(screen.getByText('The star at the centre')).toBeInTheDocument());
  expect(screen.getByText('SUN')).toBeInTheDocument();
  expect(screen.getByText('Above the clouds')).toBeInTheDocument();
  expect(screen.getByText('SKY')).toBeInTheDocument();
  // Numbers appear
  expect(screen.getAllByText('1').length).toBeGreaterThan(0);
});

test('clicking edit clue shows an inline input', async () => {
  renderReview();
  await waitFor(() => expect(screen.getByText('The star at the centre')).toBeInTheDocument());

  const editButtons = screen.getAllByRole('button', { name: /Edit clue/i });
  fireEvent.click(editButtons[0]);

  // Inline input should appear with the current clue value
  await waitFor(() =>
    expect(screen.getByDisplayValue('The star at the centre')).toBeInTheDocument(),
  );
});

test('saving clue edit calls api.crossword.editWord', async () => {
  renderReview();
  await waitFor(() => expect(screen.getByText('The star at the centre')).toBeInTheDocument());

  fireEvent.click(screen.getAllByRole('button', { name: /Edit clue/i })[0]);
  const input = screen.getByDisplayValue('The star at the centre');
  fireEvent.change(input, { target: { value: 'Our nearest star' } });
  fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

  await waitFor(() =>
    expect(api.crossword.editWord).toHaveBeenCalledWith('1', 1, { clue: 'Our nearest star' }),
  );
});

test('delete with confirm calls api.crossword.deleteWord', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  renderReview();
  await waitFor(() => expect(screen.getByText('SUN')).toBeInTheDocument());

  const deleteBtn = screen.getAllByRole('button', { name: /Delete word/i })[0];
  fireEvent.click(deleteBtn);

  await waitFor(() => expect(api.crossword.deleteWord).toHaveBeenCalledWith('1', 1));
  vi.restoreAllMocks();
});

test('approve button calls api.crossword.approve', async () => {
  renderReview();
  await waitFor(() => expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /Approve/i }));
  await waitFor(() => expect(api.crossword.approve).toHaveBeenCalledWith('1'));
});

test('published notice appears when status is published', async () => {
  api.crossword.get.mockResolvedValue(SAMPLE_PUBLISHED);
  renderReview();
  await waitFor(() =>
    expect(screen.getByText(/This crossword is published/i)).toBeInTheDocument(),
  );
});

test('edit buttons are disabled when status is published', async () => {
  api.crossword.get.mockResolvedValue(SAMPLE_PUBLISHED);
  renderReview();
  await waitFor(() => expect(screen.getByText('SUN')).toBeInTheDocument());
  // No edit clue buttons in published state
  expect(screen.queryByRole('button', { name: /Edit clue/i })).not.toBeInTheDocument();
});

// F5 — Additional coverage for stateful paths
test('Regenerate All button calls api.crossword.regenerate and shows updated word list', async () => {
  const updatedData = {
    ...SAMPLE_DRAFT,
    words: [
      { id: 3, number: 1, answer: 'MOON', clue: 'Orbits the Earth', hint: 'Glows at night', direction: 'across', row: 0, col: 0 },
    ],
  };
  api.crossword.regenerate.mockResolvedValue(updatedData);
  // Second get() after refresh returns the updated data
  api.crossword.get.mockResolvedValueOnce(SAMPLE_DRAFT).mockResolvedValue(updatedData);

  renderReview();
  await waitFor(() => expect(screen.getByRole('button', { name: /Regenerate All/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: /Regenerate All/i }));

  await waitFor(() => expect(api.crossword.regenerate).toHaveBeenCalledWith('1', {}));
  // Updated word list appears after refresh
  await waitFor(() => expect(screen.getByText('Orbits the Earth')).toBeInTheDocument());
});

test('Re-layout button calls api.crossword.relayout', async () => {
  api.crossword.relayout.mockResolvedValue(SAMPLE_DRAFT);
  api.crossword.get.mockResolvedValue(SAMPLE_DRAFT);

  renderReview();
  await waitFor(() => expect(screen.getByRole('button', { name: /Re-layout/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: /Re-layout/i }));

  await waitFor(() => expect(api.crossword.relayout).toHaveBeenCalledWith('1'));
});

test('add word form submits and calls api.crossword.addWord', async () => {
  api.crossword.addWord.mockResolvedValue(SAMPLE_DRAFT);
  api.crossword.get.mockResolvedValue(SAMPLE_DRAFT);

  renderReview();
  await waitFor(() => expect(screen.getByLabelText(/New word answer/i)).toBeInTheDocument());

  fireEvent.change(screen.getByLabelText(/New word answer/i), { target: { value: 'MARS' } });
  fireEvent.change(screen.getByLabelText(/New word clue/i), { target: { value: 'Red planet' } });
  fireEvent.click(screen.getByRole('button', { name: /\+ Add/i }));

  await waitFor(() =>
    expect(api.crossword.addWord).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ answer: 'MARS', clue: 'Red planet' }),
    ),
  );
});

test('publish button opens modal and confirm calls api.crossword.publish', async () => {
  const approvedData = { ...SAMPLE_DRAFT, status: 'approved' };
  api.crossword.get.mockResolvedValue(approvedData);
  api.crossword.publish.mockResolvedValue({ ok: true });
  api.classrooms.mockResolvedValue([{ id: 1, name: 'Class A' }]);
  // After publish, get returns published state
  api.crossword.get.mockResolvedValueOnce(approvedData).mockResolvedValue({ ...approvedData, status: 'published' });

  renderReview();
  await waitFor(() => expect(screen.getByRole('button', { name: /🚀 Publish/i })).toBeInTheDocument());

  // Click the page-level publish button to open the modal
  fireEvent.click(screen.getByRole('button', { name: /🚀 Publish/i }));

  // Modal should open
  const dialog = await waitFor(() => screen.getByRole('dialog'));
  expect(dialog).toBeInTheDocument();

  // Select a classroom checkbox inside the modal
  await waitFor(() => expect(screen.getByLabelText('Class A')).toBeInTheDocument());
  fireEvent.click(screen.getByLabelText('Class A'));

  // Click the "🚀 Publish" confirm button that lives inside the dialog
  const publishButtons = screen.getAllByRole('button', { name: /🚀 Publish/i });
  const modalPublishBtn = publishButtons.find((btn) => dialog.contains(btn));
  fireEvent.click(modalPublishBtn);

  await waitFor(() =>
    expect(api.crossword.publish).toHaveBeenCalledWith('1', expect.objectContaining({ classroom_ids: [1] })),
  );
});

test('unpublish button calls api.crossword.unpublish', async () => {
  api.crossword.get.mockResolvedValue(SAMPLE_PUBLISHED);
  api.crossword.unpublish.mockResolvedValue({ ok: true });
  // After unpublish, get returns draft state
  api.crossword.get.mockResolvedValueOnce(SAMPLE_PUBLISHED).mockResolvedValue(SAMPLE_DRAFT);

  renderReview();
  await waitFor(() => expect(screen.getByRole('button', { name: /Unpublish/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: /⏸ Unpublish/i }));

  await waitFor(() => expect(api.crossword.unpublish).toHaveBeenCalledWith('1'));
});
