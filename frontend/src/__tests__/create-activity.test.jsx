import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import CreateActivityPage from '../pages/CreateActivityPage.jsx';
import { api } from '../api.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    api: {
      ...actual.api,
      quiz:       { createTopic: vi.fn(), generate: vi.fn() },
      matching:   { createTopic: vi.fn(), generate: vi.fn() },
      sequencing: { uploadMaterial: vi.fn(), generate: vi.fn() },
      puzzle:     { create: vi.fn() },
      crossword:  { generate: vi.fn() },
    },
  };
});

function page() {
  return render(
    <MemoryRouter initialEntries={['/create']}>
      <Routes>
        <Route path="/create" element={<CreateActivityPage user={{ name: 'Teacher' }} onSignOut={vi.fn()} />} />
        <Route path="/review/:activityId" element={<div>Review draft</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  api.quiz.createTopic.mockResolvedValue({ id: 12 });
  api.quiz.generate.mockResolvedValue({ id: 44 });
  api.matching.createTopic.mockResolvedValue({ id: 13 });
  api.matching.generate.mockResolvedValue({ id: 45 });
  api.sequencing.generate.mockResolvedValue({ activity_id: 55 });
  api.puzzle.create.mockResolvedValue({ activity_id: 99, puzzle_image_id: 1, total_pieces: 9, status: 'ready' });
});

test('selecting Quiz renders only its independent form', () => {
  page();
  expect(document.querySelector('[data-game-form="quiz"]')).toBeTruthy();
  expect(screen.queryByLabelText('Items per question')).not.toBeInTheDocument();
  expect(screen.queryByText('Pair topic')).not.toBeInTheDocument();
});

test('quiz response opens a quiz draft without sequencing fields or requests', async () => {
  page();
  fireEvent.change(screen.getByLabelText('2. Topic / learning objective'), { target: { value: 'Water cycle' } });
  fireEvent.click(screen.getByRole('button', { name: /Generate Quiz draft/ }));
  await waitFor(() => expect(api.quiz.generate).toHaveBeenCalledWith(12, { game_type: 'quiz', difficulty: 'medium', questions_per_activity: 8 }));
  expect(api.sequencing.generate).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Items per question')).not.toBeInTheDocument();
  expect(await screen.findByRole('dialog', { name: /questions are ready/i })).toBeInTheDocument();
});

test('a reported quiz shortfall stays in the error modal instead of claiming the draft is ready', async () => {
  api.quiz.generate.mockResolvedValue({ id: 44, requested_count: 5, generated_count: 4, rejected_count: 2 });
  page();
  fireEvent.change(screen.getByLabelText('2. Topic / learning objective'), { target: { value: 'Water cycle' } });
  fireEvent.click(screen.getByRole('button', { name: /Generate Quiz draft/ }));
  expect(await screen.findByRole('dialog', { name: /generation failed/i })).toHaveTextContent('requested=5, valid=4, rejected=2, missing=1');
  expect(screen.queryByRole('button', { name: /View AI Drafts/i })).not.toBeInTheDocument();
});

test('restores the original quiz setup fields and keeps quiz material out of sequencing upload', async () => {
  page();
  expect(screen.getByLabelText('1. Choose class (optional)')).toBeDisabled();
  expect(screen.getByLabelText('2. Grade')).toHaveValue('5');
  expect(screen.getByLabelText('3. Subject')).toHaveValue('Science');
  expect(screen.getByLabelText('4. Difficulty')).toHaveValue('medium');
  expect(screen.getByLabelText('5. Number of questions')).toHaveValue('8');
  expect(Array.from(screen.getByLabelText('5. Number of questions').options).map((o) => o.value)).toEqual(['5', '8', '10', '15', '20']);
  expect(screen.getByText('What the AI prepares')).toBeInTheDocument();
  expect(screen.getByText('Teacher approval checklist')).toBeInTheDocument();
  expect(screen.getByText('Prototype note')).toBeInTheDocument();
  const file = new File(['lesson notes'], 'water-cycle.pdf', { type: 'application/pdf' });
  fireEvent.change(screen.getByLabelText('8. Add teaching material (optional)'), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText('2. Topic / learning objective'), { target: { value: 'Water cycle' } });
  fireEvent.click(screen.getByRole('button', { name: /Generate Quiz draft/ }));
  await waitFor(() => expect(api.quiz.createTopic).toHaveBeenCalledWith(expect.objectContaining({ reference_material: 'water-cycle.pdf' })));
  expect(api.sequencing.uploadMaterial).not.toHaveBeenCalled();
});

test('sequencing uses only its three-source contract', async () => {
  page();
  fireEvent.click(screen.getByRole('radio', { name: /Sequencing/ }));
  fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Plant growth' } });
  fireEvent.click(screen.getByRole('button', { name: /Generate sequencing draft/ }));
  await waitFor(() => expect(api.sequencing.generate).toHaveBeenCalledWith(
    expect.objectContaining({ game_type: 'sequencing', source_method: 'topic', topic: 'Plant growth', sequence_item_count: 4 }),
  ));
  expect(api.quiz.generate).not.toHaveBeenCalled();
});

test('Puzzle renders its own form; Crossword shows unavailable; neither uses quiz/sequencing contracts', async () => {
  page();

  // Matching still works
  fireEvent.click(screen.getByRole('radio', { name: /Matching/ }));
  fireEvent.change(screen.getByLabelText('2. Pair topic'), { target: { value: 'Habitats' } });
  fireEvent.click(screen.getByRole('button', { name: /Generate Matching draft/ }));
  await waitFor(() => expect(api.matching.generate).toHaveBeenCalledWith(13, expect.objectContaining({ game_type: 'matching' })));

  // Switch to Puzzle — must show the real Puzzle form, not a coming-soon placeholder
  fireEvent.click(screen.getByRole('radio', { name: /Puzzle/ }));
  expect(document.querySelector('[data-game-form="puzzle"]')).toBeTruthy();
  // Placeholder text from PuzzleCreateForm topic input
  expect(screen.getByPlaceholderText(/Solar System/)).toBeInTheDocument();
  // Generate button
  expect(screen.getByRole('button', { name: /Generate Puzzle/i })).toBeInTheDocument();
  // No quiz/sequencing endpoints were called
  expect(api.quiz.generate).not.toHaveBeenCalled();
  expect(api.sequencing.generate).not.toHaveBeenCalled();

  // Crossword now has a real form — confirm the real CrosswordCreateForm renders
  fireEvent.click(screen.getByRole('radio', { name: /Crossword/ }));
  expect(document.querySelector('[data-game-form="crossword"]')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Generate Crossword/i })).toBeInTheDocument();
});

test('Puzzle form submits correct payload and opens success modal', async () => {
  page();
  fireEvent.click(screen.getByRole('radio', { name: /Puzzle/ }));
  // Fill in topic via placeholder-identified input
  const topicInput = screen.getByPlaceholderText(/Solar System/);
  fireEvent.change(topicInput, { target: { value: 'Ancient Egypt' } });
  fireEvent.click(screen.getByRole('button', { name: /Generate Puzzle/i }));
  await waitFor(() => expect(api.puzzle.create).toHaveBeenCalledWith(
    expect.objectContaining({ game_type: 'puzzle', topic: 'Ancient Egypt', grid_size: 3 }),
  ));
  // Success modal should appear
  expect(await screen.findByRole('dialog', { name: /questions are ready/i })).toBeInTheDocument();
  // Quiz/sequencing were not invoked
  expect(api.quiz.generate).not.toHaveBeenCalled();
  expect(api.sequencing.generate).not.toHaveBeenCalled();
});
