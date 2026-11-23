import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MatchingPlayer from '../games/matching/MatchingPlayer.jsx';
import { api } from '../api.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return { ...actual, api: { ...actual.api, checkMatch: vi.fn(), complete: vi.fn() } };
});

// Server-side key for the test double: left id -> correct right alias.
const KEY = { p1: 'right-2', p2: 'right-1' };

function attemptWith(extra = {}, itemExtra = {}) {
  return {
    attempt_id: 11, title: 'Number Bonds', subject: 'Maths', grade: 3, difficulty: 'easy', attempt_number: 1, max_attempts: 2,
    game_type: 'matching', timer_reminder: { enabled: false },
    items: [{
      id: 'q1', prompt: 'Match each sum.', matched: {}, finished: false,
      lefts: [{ id: 'p1', text: '2 + 3' }, { id: 'p2', text: '5 + 5' }],
      rights: [{ id: 'right-1', text: 'Ten' }, { id: 'right-2', text: 'Five' }],
      ...itemExtra,
    }],
    ...extra,
  };
}

function mount(attempt = attemptWith(), onRestart = vi.fn()) {
  return render(<MemoryRouter><MatchingPlayer attempt={attempt} user={{ name: 'Kid' }} onRestart={onRestart} /></MemoryRouter>);
}

const tile = (text) => screen.getByText(text).closest('button');

const realRect = HTMLElement.prototype.getBoundingClientRect;
afterEach(() => { HTMLElement.prototype.getBoundingClientRect = realRect; });

beforeEach(() => {
  vi.clearAllMocks();
  let matched = 0;
  api.checkMatch.mockImplementation(async (_a, _i, left, right) => {
    const ok = KEY[left] === right;
    if (ok) matched += 1;
    return { is_correct: ok, left_id: left, matched_count: matched, total_pairs: 2, finished: ok && matched === 2, incorrect_attempts: ok ? 0 : 1 };
  });
});

test('shows header details, instructions and both columns', () => {
  mount();
  expect(screen.getByText('Number Bonds')).toBeInTheDocument();
  expect(screen.getByText('Maths')).toBeInTheDocument();
  expect(screen.getByText('Class 3')).toBeInTheDocument();
  expect(screen.getByText('Attempt 1 of 2')).toBeInTheDocument();
  expect(screen.getByText('Match each item on the left with its correct answer on the right.')).toBeInTheDocument();
  expect(screen.getByText('Match the following')).toBeInTheDocument();
  expect(screen.getByText('Correct answers')).toBeInTheDocument();
  expect(screen.getByText('0 of 2 pairs matched')).toBeInTheDocument();
});

test('tap left then right asks the server and locks a correct pair', async () => {
  mount();
  fireEvent.click(tile('2 + 3'));
  expect(tile('2 + 3')).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(tile('Five'));
  await waitFor(() => expect(api.checkMatch).toHaveBeenCalledWith(11, 'q1', 'p1', 'right-2'));
  await waitFor(() => expect(tile('2 + 3')).toBeDisabled());
  expect(tile('Five')).toBeDisabled();
  expect(tile('2 + 3')).toHaveClass('mg-correct');
  expect(screen.getByText('1 of 2 pairs matched')).toBeInTheDocument();
});

test('tapping the answer first also works', async () => {
  mount();
  fireEvent.click(tile('Ten'));
  fireEvent.click(tile('5 + 5'));
  await waitFor(() => expect(api.checkMatch).toHaveBeenCalledWith(11, 'q1', 'p2', 'right-1'));
  await waitFor(() => expect(tile('5 + 5')).toHaveClass('mg-correct'));
});

test('a wrong match shows feedback, is NOT locked, and can be retried', async () => {
  mount();
  fireEvent.click(tile('2 + 3'));
  fireEvent.click(tile('Ten')); // wrong
  await waitFor(() => expect(screen.getByText('Not quite — try another answer.')).toBeInTheDocument());
  expect(tile('2 + 3')).not.toBeDisabled();
  expect(tile('Ten')).not.toBeDisabled();
  expect(screen.getByText('0 of 2 pairs matched')).toBeInTheDocument();
  await waitFor(() => expect(tile('2 + 3')).not.toHaveClass('mg-wrong'), { timeout: 2000 });
  fireEvent.click(tile('2 + 3'));
  fireEvent.click(tile('Five')); // now right
  await waitFor(() => expect(tile('2 + 3')).toHaveClass('mg-correct'));
});

test('selecting the same card twice deselects it and sends nothing', () => {
  mount();
  fireEvent.click(tile('2 + 3'));
  fireEvent.click(tile('2 + 3'));
  expect(tile('2 + 3')).toHaveAttribute('aria-pressed', 'false');
  expect(api.checkMatch).not.toHaveBeenCalled();
});

test('already-matched pairs are restored after a refresh and cannot be re-selected', () => {
  mount(attemptWith({}, { matched: { p1: 'right-2' } }));
  expect(tile('2 + 3')).toBeDisabled();
  expect(tile('Five')).toBeDisabled();
  expect(screen.getByText('1 of 2 pairs matched')).toBeInTheDocument();
});

test('finish is blocked until every pair is matched, then submits exactly once and shows server results', async () => {
  api.complete.mockResolvedValue({
    score: 100, accuracy: 100, total_pairs: 2, correct_matches: 2, incorrect_attempts: 0, marks_obtained: 2, max_marks: 2,
    time_taken_seconds: 75, attempt_number: 1, max_attempts: 2, can_retry: true, newly_earned_badges: [],
  });
  const onRestart = vi.fn().mockResolvedValue();
  mount(attemptWith(), onRestart);
  expect(screen.getByRole('button', { name: 'Match all pairs to continue' })).toBeDisabled();

  fireEvent.click(tile('2 + 3')); fireEvent.click(tile('Five'));
  await waitFor(() => expect(tile('2 + 3')).toBeDisabled());
  fireEvent.click(tile('5 + 5')); fireEvent.click(tile('Ten'));
  const finish = await screen.findByRole('button', { name: /Finish game/ });

  fireEvent.click(finish); fireEvent.click(finish); // double click
  await screen.findByText('Excellent Work!');
  expect(api.complete).toHaveBeenCalledTimes(1);
  expect(screen.getByText('You matched 2 out of 2 pairs correctly on the first try.')).toBeInTheDocument();
  expect(screen.getByText('1m 15s')).toBeInTheDocument();
  expect(screen.getByText('2 / 2')).toBeInTheDocument();
  expect(screen.getByText('Attempt 1 of 2')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
  await waitFor(() => expect(onRestart).toHaveBeenCalledTimes(1));
});

test('retry is hidden and the limit message shown when attempts are used up', async () => {
  api.complete.mockResolvedValue({
    score: 50, accuracy: 50, total_pairs: 2, correct_matches: 1, incorrect_attempts: 3, marks_obtained: 1, max_marks: 2,
    time_taken_seconds: 20, attempt_number: 2, max_attempts: 2, can_retry: false,
  });
  mount(attemptWith({}, { matched: { p1: 'right-2', p2: 'right-1' }, finished: true }));
  fireEvent.click(await screen.findByRole('button', { name: /Finish game/ }));
  await screen.findByText('Good Effort!');
  expect(screen.queryByRole('button', { name: /Try again/ })).toBeNull();
  expect(screen.getByText('You have used all 2 attempts for this game.')).toBeInTheDocument();
});

test('a failed submission shows an error and allows trying again', async () => {
  api.complete.mockRejectedValueOnce(new Error('Network down'));
  api.complete.mockResolvedValueOnce({ score: 100, accuracy: 100, total_pairs: 2, correct_matches: 2, incorrect_attempts: 0, marks_obtained: 2, max_marks: 2, time_taken_seconds: 5, attempt_number: 1, max_attempts: null, can_retry: true });
  mount(attemptWith({}, { matched: { p1: 'right-2', p2: 'right-1' }, finished: true }));
  fireEvent.click(await screen.findByRole('button', { name: /Finish game/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
  fireEvent.click(screen.getByRole('button', { name: /Finish game/ }));
  await screen.findByText('Excellent Work!');
});

test('dragging a left card onto an answer card asks the server to validate that pair', async () => {
  mount();
  // jsdom has no layout: give the cards real geometry so dnd-kit can detect the drop target.
  const rect = (x, y) => ({ x, y, left: x, top: y, right: x + 120, bottom: y + 50, width: 120, height: 50, toJSON() {} });
  tile('2 + 3').getBoundingClientRect = () => rect(0, 0);
  tile('5 + 5').getBoundingClientRect = () => rect(0, 80);
  tile('Ten').getBoundingClientRect = () => rect(300, 0);
  tile('Five').getBoundingClientRect = () => rect(300, 80);

  const pointer = (type, x, y, target) => {
    const ev = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(ev, { clientX: x, clientY: y, pageX: x, pageY: y, button: 0, isPrimary: true, pointerId: 1, pointerType: 'mouse' });
    target.dispatchEvent(ev);
  };
  // dnd-kit measures the DragOverlay (the floating ghost) for collisions; in a browser it has a size.
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return this.classList?.contains('mg-ghost') ? rect(0, 0) : originalRect.call(this);
  };
  const tick = () => act(async () => { await new Promise((r) => setTimeout(r, 60)); });
  const source = tile('2 + 3');
  await act(async () => pointer('pointerdown', 10, 10, source));
  await act(async () => pointer('pointermove', 150, 20, document)); await tick();   // passes the 6px activation distance
  await act(async () => pointer('pointermove', 330, 15, document)); await tick();   // hovering over "Ten" (wrong answer for 2 + 3)
  await act(async () => pointer('pointerup', 330, 15, document)); await tick();
  await waitFor(() => expect(api.checkMatch).toHaveBeenCalledWith(11, 'q1', 'p1', 'right-1'));
  await screen.findByText('Not quite — try another answer.');
  expect(tile('2 + 3')).not.toBeDisabled();   // wrong drop is not locked
});

test('server errors during a match are shown instead of crashing the board', async () => {
  api.checkMatch.mockRejectedValueOnce(new Error('That answer is already matched'));
  mount();
  fireEvent.click(tile('2 + 3')); fireEvent.click(tile('Five'));
  expect(await screen.findByText('That answer is already matched')).toBeInTheDocument();
  expect(within(document.querySelector('[data-matching-board]')).getAllByRole('button').length).toBe(4);
});
