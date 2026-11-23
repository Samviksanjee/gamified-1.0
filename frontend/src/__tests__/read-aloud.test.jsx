import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlayPage from '../pages/PlayPage.jsx';
import SequencingGame from '../components/SequencingGame.jsx';
import ReadAloudButton, { matchingReadAloudText, quizReadAloudText, sequencingReadAloudText } from '../components/ReadAloudButton.jsx';
import { api } from '../api.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return { ...actual, api: { ...actual.api, startAttempt: vi.fn(), recordQuestionTime: vi.fn(), submit: vi.fn(), hint: vi.fn(), complete: vi.fn() } };
});

let speak;
let cancel;

beforeEach(() => {
  speak = vi.fn();
  cancel = vi.fn();
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak, cancel, getVoices: () => [] } });
  window.SpeechSynthesisUtterance = class {
    constructor(text) { this.text = text; }
  };
  vi.clearAllMocks();
  api.recordQuestionTime.mockResolvedValue({ status: 'ok' });
});

function renderPlayer(attempt) {
  api.startAttempt.mockResolvedValueOnce(attempt);
  return render(
    <MemoryRouter initialEntries={['/play/a/7']}>
      <Routes><Route path="/play/a/:activityId" element={<PlayPage user={{ name: 'Learner' }} onSignOut={vi.fn()} />} /></Routes>
    </MemoryRouter>,
  );
}

test('quiz read-aloud control reads only visible question and options until a correct response authorizes explanation', () => {
  const item = {
    prompt: 'Which planet is blue?',
    options: [{ id: 'a', text: 'Earth' }, { id: 'b', text: 'Mars' }],
    correct_option_id: 'a',
    explanation: 'Earth is blue.',
  };
  const pendingText = quizReadAloudText(item, null);
  expect(pendingText).toContain('Which planet is blue?');
  expect(pendingText).toContain('Option A: Earth.');
  expect(pendingText).not.toContain('correct_option_id');
  expect(pendingText).not.toContain('Earth is blue.');
  expect(quizReadAloudText(item, { finished: true, is_correct: true, explanation: 'Earth is blue.' })).toContain('Earth is blue.');

  render(<ReadAloudButton text={pendingText} />);
  fireEvent.click(screen.getByRole('button', { name: 'Read question aloud' }));
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: pendingText }));
  fireEvent.click(screen.getByRole('button', { name: 'Stop reading' }));
  expect(cancel).toHaveBeenCalled();
});

test('quiz and matching players place an accessible audio button directly after the prompt', async () => {
  const quizAttempt = {
    attempt_id: 1, title: 'Planets', game_type: 'quiz', timer_reminder: { enabled: false },
    items: [{ id: 'q1', prompt: 'Which planet is blue?', options: [{ id: 'a', text: 'Earth' }, { id: 'b', text: 'Mars' }] }],
  };
  const { unmount } = renderPlayer(quizAttempt);
  expect(await screen.findByRole('button', { name: 'Read question aloud' })).toBeInTheDocument();
  expect(screen.getByText('Which planet is blue?').compareDocumentPosition(screen.getByRole('button', { name: 'Read question aloud' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  unmount();

  const matchingAttempt = {
    attempt_id: 2, title: 'Pairs', game_type: 'matching', timer_reminder: { enabled: false },
    items: [{ id: 'q2', prompt: 'Match each item.', lefts: [{ id: 'left-1', text: 'Habitat' }], rights: [{ id: 'right-1', text: 'Forest' }] }],
  };
  renderPlayer(matchingAttempt);
  expect(await screen.findByRole('button', { name: 'Read question aloud' })).toBeInTheDocument();
  expect(document.querySelector('[data-game-player="matching"]')).toBeTruthy();
  const matchingText = matchingReadAloudText(matchingAttempt.items[0], null);
  expect(matchingText).toContain('Habitat');
  expect(matchingText).toContain('Forest');
  expect(matchingText).not.toContain('left-1');
  expect(matchingText).not.toContain('right-1');
});

test('sequencing control reads only the displayed shuffled cards and authorized feedback', async () => {
  const attempt = {
    attempt_id: 3, title: 'Water cycle', game_type: 'sequencing', timer_reminder: { enabled: false },
    items: [{ id: 'q3', prompt: 'Arrange the water cycle.', steps: [{ id: 'shown-2', content: 'Condense' }, { id: 'shown-1', content: 'Evaporate' }] }],
  };
  render(<MemoryRouter><SequencingGame attempt={attempt} user={{}} onSignOut={vi.fn()} /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Read question aloud' })).toBeInTheDocument();
  const text = sequencingReadAloudText(attempt.items[0], attempt.items[0].steps, null);
  expect(text).toContain('Condense. Evaporate.');
  expect(text).not.toContain('shown-1');
  expect(text).not.toContain('correct sequence');
  fireEvent.click(screen.getByRole('button', { name: 'Read question aloud' }));
  await waitFor(() => expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text })));
});
