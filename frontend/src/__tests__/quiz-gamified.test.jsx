import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import QuizPlayer, { lifecycleOf } from '../games/quiz/QuizPlayer.jsx';
import QuestionVisual from '../components/gamification/QuestionVisual.jsx';
import { deriveVisual, iconKeyFor, nounKeyFor } from '../components/gamification/illustrations.jsx';
import { normaliseGroups, pictureFor } from '../components/gamification/visualAssetResolver.js';
import { getTheme } from '../components/gamification/subjectTheme.js';
import { api } from '../api.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return { ...actual, api: { ...actual.api, submit: vi.fn(), hint: vi.fn(), complete: vi.fn() } };
});

const attempt = (items, extra = {}) => ({ attempt_id: 5, game_type: 'quiz', subject: 'Mathematics', grade: 2, difficulty: 'easy', policy: { max_hints: 2, max_tries: 2 }, items, ...extra });
const apples = { id: 'q1', prompt: 'How many apples are there altogether?', options: [{ id: 'A', text: '7' }, { id: 'B', text: '8' }, { id: 'C', text: 'Dog' }],
  visual: { type: 'counting', alt_text: 'Five red apples and three green apples', groups: [{ kind: 'apple', count: 5, color: 'red' }, { kind: 'apple', count: 3, color: 'green' }] } };
const plain = (id = 'q1', prompt = 'What colour is the sky on a sunny day?') => ({ id, prompt, options: [{ id: 'A', text: 'Blue' }, { id: 'B', text: 'Green' }, { id: 'C', text: 'Pink' }] });
const mount = (items, extra) => render(<MemoryRouter><QuizPlayer attempt={attempt(items, extra)} user={{ name: 'Kid' }} onSignOut={vi.fn()} /></MemoryRouter>);
const option = (letter) => screen.getByRole('button', { name: new RegExp(`Option ${letter}:`) });
const WRONG = { tries: 1, finished: false, is_correct: false, explanation: null };

beforeEach(() => { [api.submit, api.hint, api.complete].forEach((fn) => fn.mockReset()); });
afterEach(() => cleanup());

// ── Part 1: the retry bug ────────────────────────────────────────────────────

test('a wrong answer says so kindly, keeps the other cards live, and does not move on', async () => {
  api.submit.mockResolvedValueOnce(WRONG);
  mount([plain(), plain('q2')]);
  fireEvent.click(option('B'));
  expect(await screen.findByText('Oops! Not quite right. Try again!')).toBeInTheDocument();
  expect(screen.getByText(/1 try left/)).toBeInTheDocument();
  expect(option('A')).toBeEnabled();
  expect(option('C')).toBeEnabled();
  expect(option('B')).toBeDisabled();                                   // already tried: cannot be re-sent
  expect(option('B')).toHaveAttribute('data-state', 'wrong');
  expect(screen.getByRole('button', { name: /Continue/ })).toBeDisabled();   // not solved yet
  expect(screen.getByText(/Question.*1.*of.*2/)).toBeInTheDocument();       // never auto-advances
});

test('retry works end to end: wrong, then right unlocks Continue and shows the explanation', async () => {
  api.submit.mockResolvedValueOnce(WRONG).mockResolvedValueOnce({ tries: 2, finished: true, is_correct: true, explanation: 'The sky looks blue.' });
  mount([plain()]);
  fireEvent.click(option('B'));
  await screen.findByText('Oops! Not quite right. Try again!');
  fireEvent.click(option('A'));
  expect(await screen.findByText('Fantastic! You got it!')).toBeInTheDocument();
  expect(screen.getByText('The sky looks blue.')).toBeInTheDocument();
  expect(option('A')).toHaveAttribute('data-state', 'correct');
  expect(screen.getByRole('button', { name: /Finish game/ })).toBeEnabled();
  expect(document.querySelector('[data-game-player]')).toHaveAttribute('data-phase', 'CORRECT');
  expect(api.submit).toHaveBeenCalledTimes(2);
  expect(api.submit.mock.calls[0][3]).not.toEqual(api.submit.mock.calls[1][3]);   // each click is its own idempotent request
  [option('B'), option('C')].forEach((card) => expect(card).toBeDisabled());       // solved: nothing more to answer
});

test('when the server says the tries are used up the child is encouraged, shown the explanation, and can continue', async () => {
  api.submit.mockResolvedValueOnce(WRONG).mockResolvedValueOnce({ tries: 2, finished: true, is_correct: false, explanation: 'Grass is green; the sky is blue.' });
  mount([plain()]);
  fireEvent.click(option('B'));
  await screen.findByText('Oops! Not quite right. Try again!');
  fireEvent.click(option('C'));
  expect(await screen.findByText(/Let.s learn together/)).toBeInTheDocument();
  expect(screen.getByText('Grass is green; the sky is blue.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Finish game/ })).toBeEnabled();
  expect(document.querySelector('[data-game-player]')).toHaveAttribute('data-phase', 'OUT_OF_TRIES');
});

test('a double tap sends exactly one answer', async () => {
  let release;
  api.submit.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
  mount([plain()]);
  fireEvent.click(option('A')); fireEvent.click(option('A')); fireEvent.click(option('C'));
  expect(api.submit).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[data-game-player]')).toHaveAttribute('data-phase', 'SELECTED');
  await act(async () => release({ tries: 1, finished: true, is_correct: true, explanation: 'ok' }));
  expect(api.submit).toHaveBeenCalledTimes(1);
});

test('a network error does not lock the question: the child can try again', async () => {
  api.submit.mockRejectedValueOnce(new Error('Network down')).mockResolvedValueOnce({ tries: 1, finished: true, is_correct: true, explanation: 'ok' });
  mount([plain()]);
  fireEvent.click(option('A'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
  expect(option('A')).toBeEnabled();
  fireEvent.click(option('A'));
  expect(await screen.findByText('Fantastic! You got it!')).toBeInTheDocument();
});

test('lifecycle states', () => {
  expect(lifecycleOf({ pending: null, result: null })).toBe('UNANSWERED');
  expect(lifecycleOf({ pending: 'A', result: null })).toBe('SELECTED');
  expect(lifecycleOf({ pending: null, result: WRONG })).toBe('RETRY');
  expect(lifecycleOf({ pending: null, result: { is_correct: true, finished: true } })).toBe('CORRECT');
  expect(lifecycleOf({ pending: null, result: { is_correct: false, finished: true } })).toBe('OUT_OF_TRIES');
});

test('finishing shows the score, then the sticker reveal for newly earned stickers', async () => {
  api.submit.mockResolvedValue({ tries: 1, finished: true, is_correct: true, explanation: 'ok' });
  api.complete.mockResolvedValue({ score: 100, correct_first_try: 1, total_items: 1, newly_earned_badges: [],
    newly_earned_stickers: [{ key: 'baby_penguin', name: 'Baby Penguin', rarity: 'common', art: 'baby_penguin', description: 'Finish your very first activity.' }] });
  mount([plain()]);
  fireEvent.click(option('A'));
  fireEvent.click(await screen.findByRole('button', { name: /Finish game/ }));
  expect(await screen.findByText('Perfect score!')).toBeInTheDocument();
  expect(await screen.findByRole('dialog', { name: /new sticker/i })).toBeInTheDocument();
  expect(await screen.findByText('Baby Penguin')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Keep playing|Skip/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

// ── Part 4: contextual visuals ───────────────────────────────────────────────

test('a counting question draws exactly the quantities in its metadata', () => {
  mount([apples]);
  const group = screen.getByRole('group', { name: 'Five red apples and three green apples' });
  expect(group.querySelectorAll('[data-count-item]')).toHaveLength(8);
  expect(group.querySelectorAll('svg')).toHaveLength(8);
});

test('answer cards show a picture only for an exact known word', () => {
  mount([apples]);
  expect(option('C').querySelector('svg')).not.toBeNull();   // "Dog" -> a dog
  expect(option('A').querySelector('svg')).toBeNull();       // "7" -> nothing invented
});

test('maths questions get maths pictures: addition apples and a number path, never random decoration', () => {
  mount([plain('m1', 'What is 5 + 3?')]);
  expect(screen.getByRole('img', { name: '5 apples plus 3 apples' })).toBeInTheDocument();
  cleanup();
  mount([plain('m2', 'Which number comes after 19?')]);
  expect(screen.getByRole('img', { name: /number path/i })).toBeInTheDocument();
  cleanup();
  mount([plain('m3', 'What colour is the sky?')], { subject: 'English' });
  expect(document.querySelector('figure')).toBeNull();
});

test('science and english prompts map to the right scene, and unsure prompts map to nothing', () => {
  expect(deriveVisual({ prompt: 'What do plants need to grow?' }, 'Science').scene).toBe('plant_needs');
  expect(deriveVisual({ prompt: 'Which planet do we live on?' }, 'Science').scene).toBe('planets');
  expect(deriveVisual({ prompt: 'What happens during photosynthesis?' }, 'Science').scene).toBe('photosynthesis');
  expect(deriveVisual({ prompt: 'Choose the correct spelling of Butterfly.' }, 'English')).toEqual({ type: 'scene', scene: 'word', params: { icon: 'butterfly', alt: 'A picture of a butterfly' } });
  expect(deriveVisual({ prompt: 'Choose the correct spelling of Opportunity.' }, 'English')).toBeNull();
  expect(deriveVisual({ prompt: 'Who wrote this story?' }, 'English')).toBeNull();
});

test('step text maps to teaching icons (life cycle, photosynthesis, brushing teeth)', () => {
  expect(['Egg', 'Caterpillar', 'Chrysalis', 'Butterfly'].map(iconKeyFor)).toEqual(['egg', 'caterpillar', 'chrysalis', 'butterfly']);
  expect(iconKeyFor('Plants absorb sunlight')).toBe('sun');
  expect(iconKeyFor('Plants take in carbon dioxide')).toBe('co2');
  expect(iconKeyFor('Oxygen is released')).toBe('oxygen');
  expect(iconKeyFor('Apply toothpaste')).toBe('toothpaste');
  expect(iconKeyFor('Think about something else')).toBeNull();
  expect(nounKeyFor('Nest')).toBe('nest');
  expect(nounKeyFor('Photosynthesis')).toBeNull();
});

test('visual edge cases: nothing renders without metadata; counts are bounded; unknown words get no picture', () => {
  const { container } = render(<QuestionVisual visual={null} />);
  expect(container).toBeEmptyDOMElement();
  expect(normaliseGroups([{ kind: 'APPLE', count: 999, color: 'nope' }, { kind: 'x', count: 0 }])).toEqual([{ kind: 'apple', count: 20, color: null }]);
  expect(pictureFor('Photosynthesis')).toBeNull();
  expect(pictureFor('two words')).toBeNull();
});

test('subjects get their own theme', () => {
  expect(getTheme('Mathematics').key).toBe('mathematics');
  expect(getTheme('EVS').key).toBe('science');
  expect(getTheme('English').key).toBe('english');
  expect(getTheme('Maths').key).toBe('mathematics');
});
