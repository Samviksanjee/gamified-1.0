import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SequencingGame from '../components/SequencingGame.jsx';
import SequencingReview, { sequenceProblems } from '../games/sequencing/SequencingReview.jsx';
import { friendlyGenerationError } from '../games/sequencing/generationErrors.js';
import { PublishModal } from '../pages/ReviewPage.jsx';
import { api } from '../api.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return { ...actual, api: { ...actual.api, submit: vi.fn(), hint: vi.fn(), complete: vi.fn(), sequencing: { ...actual.api.sequencing, regenerateQuestion: vi.fn() } } };
});

const steps = (ids) => ids.map((id) => ({ id, content: { a: 'Evaporate', b: 'Condense', c: 'Precipitate' }[id] }));
const question = (id, ids = ['b', 'c', 'a'], extra = {}) => ({ id, prompt: `Arrange the water cycle (${id}).`, interaction_mode: 'both', steps: steps(ids), ...extra });
const attemptOf = (items, extra = {}) => ({
  attempt_id: 7, title: 'Water cycle', subject: 'EVS', topic: 'Water Cycle', difficulty: 'easy', attempt_number: 1, max_attempts: 2,
  game_type: 'sequencing', interaction_mode: 'both', items, ...extra,
});
const baseAttempt = () => attemptOf([question('q1', ['b', 'c', 'a'])]);
const mount = (attempt = baseAttempt(), props = {}) => render(<MemoryRouter><SequencingGame attempt={attempt} user={{ name: 'Learner' }} onSignOut={vi.fn()} {...props} /></MemoryRouter>);
const shown = () => Array.from(document.querySelectorAll('[data-step-id]')).map((node) => node.textContent.replace(/[⋮↑↓\d]/g, '').trim());

const realRect = HTMLElement.prototype.getBoundingClientRect;
beforeEach(() => { [api.submit, api.hint, api.complete, api.sequencing.regenerateQuestion].forEach((fn) => fn.mockReset()); });
afterEach(() => { HTMLElement.prototype.getBoundingClientRect = realRect; });

// ── rendering & secrecy ─────────────────────────────────────────────────────

test('renders the header, shuffled cards and instructions without any answer key', () => {
  mount(attemptOf([question('q1')], { instructions: 'Put the stages in order.' }));
  expect(shown()).toEqual(['Condense', 'Precipitate', 'Evaporate']);   // exactly the order the server sent
  expect(screen.getAllByText(/EVS/i).length).toBeGreaterThan(0);
  expect(screen.getByText('Water Cycle')).toBeInTheDocument();
  expect(screen.getByText('easy')).toBeInTheDocument();
  expect(screen.getByText(/Attempt.*1.*of.*2/)).toBeInTheDocument();
  expect(screen.getByText(/Question.*1.*of.*1/)).toBeInTheDocument();
  expect(screen.getByText(/Put the stages in order/)).toBeInTheDocument();
  expect(screen.queryByText(/correct_position|canonical_order|correct_order/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Correct order')).not.toBeInTheDocument();
});

test('renders illustrated steps', () => {
  const withImage = attemptOf([{ ...question('q1', ['a', 'b']), steps: [{ id: 'a', content: 'Evaporate', image_url: 'https://example.test/a.png' }, { id: 'b', content: 'Condense' }] }]);
  mount(withImage);
  expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.test/a.png');
});

test('an activity without questions shows a clear message instead of a blank screen', () => {
  mount(attemptOf([]));
  expect(screen.getByRole('alert')).toHaveTextContent('no questions yet');
});

// ── rearranging: buttons, reset, drag ───────────────────────────────────────

test('Move up / Move down change the order and the submitted answer', async () => {
  api.submit.mockResolvedValueOnce({ tries: 1, finished: false, is_correct: false });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Move Evaporate up' }));
  expect(shown()).toEqual(['Condense', 'Evaporate', 'Precipitate']);
  fireEvent.click(screen.getByRole('button', { name: 'Move Evaporate up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Move Condense down' }));
  expect(shown()).toEqual(['Evaporate', 'Precipitate', 'Condense']);
  fireEvent.click(screen.getByRole('button', { name: 'Move Precipitate down' }));
  expect(shown()).toEqual(['Evaporate', 'Condense', 'Precipitate']);
  expect(screen.getByRole('button', { name: 'Move Evaporate up' })).toBeDisabled();       // first card cannot go up
  expect(screen.getByRole('button', { name: 'Move Precipitate down' })).toBeDisabled();   // last card cannot go down
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  await waitFor(() => expect(api.submit).toHaveBeenCalledWith(7, 'q1', { order: ['a', 'b', 'c'] }, expect.any(String)));
});

test('Reset order restores the order the server sent and returns cleared cards', () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Move Evaporate up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear last card' }));
  expect(shown()).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: /Reset order/ }));
  expect(shown()).toEqual(['Condense', 'Precipitate', 'Evaporate']);
});

test('dragging a card by its handle onto another position reorders the cards', async () => {
  mount();
  const rect = (y) => ({ x: 0, y, left: 0, top: y, right: 300, bottom: y + 50, width: 300, height: 50, toJSON() {} });
  const cards = Array.from(document.querySelectorAll('[data-step-id]'));
  cards.forEach((card, i) => { card.getBoundingClientRect = () => rect(i * 70); });
  HTMLElement.prototype.getBoundingClientRect = function () { return this.classList?.contains('seq-ghost') ? rect(0) : realRect.call(this); };
  const pointer = (type, y, target) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, { clientX: 20, clientY: y, pageX: 20, pageY: y, button: 0, isPrimary: true, pointerId: 1, pointerType: 'mouse' });
    target.dispatchEvent(event);
  };
  const tick = () => act(async () => { await new Promise((r) => setTimeout(r, 60)); });
  const handle = screen.getByLabelText('Drag Condense');            // first card
  await act(async () => pointer('pointerdown', 10, handle));
  await act(async () => pointer('pointermove', 60, document)); await tick();
  await act(async () => pointer('pointermove', 150, document)); await tick();   // over the third slot
  await act(async () => pointer('pointerup', 150, document)); await tick();
  await waitFor(() => expect(shown()).toEqual(['Precipitate', 'Evaporate', 'Condense']));
});

// ── submitting & feedback ───────────────────────────────────────────────────

test('an incomplete order is rejected by the server and the message is shown', async () => {
  api.submit.mockRejectedValueOnce(new Error('Submit every sequence item exactly once'));
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Clear last card' }));
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('every sequence item');
  expect(api.submit).toHaveBeenCalledWith(7, 'q1', { order: ['b', 'c'] }, expect.any(String));
});

test('a wrong answer with tries left shows a hint, keeps the cards movable and hides the explanation', async () => {
  api.submit.mockResolvedValueOnce({ tries: 1, finished: false, is_correct: false, hint: 'Think about the sun.', explanation: null });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  expect(await screen.findByText(/Think about the sun/)).toBeInTheDocument();
  expect(screen.getByText(/Not quite/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Correct order')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Move Evaporate up' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Submit answer' })).toBeEnabled();
});

test('a correct answer shows success and the explanation, then locks the cards', async () => {
  api.submit.mockResolvedValueOnce({ tries: 1, finished: true, is_correct: true, explanation: 'Water changes state.' });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  expect(await screen.findByText('Water changes state.')).toBeInTheDocument();
  expect(screen.getByText(/Correct! Well done/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Submit answer' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Finish game/ })).toBeInTheDocument();
});

test('after the last try the correct order and the explanation are revealed (and only then)', async () => {
  api.submit.mockResolvedValueOnce({ tries: 3, finished: true, is_correct: false, correct_order: ['a', 'b', 'c'], explanation: 'Heat first, then cooling, then rain.' });
  mount();
  expect(screen.queryByText('Heat first, then cooling, then rain.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  const list = await screen.findByLabelText('Correct order');
  expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Evaporate', 'Condense', 'Precipitate']);
  expect(screen.getByText('Heat first, then cooling, then rain.')).toBeInTheDocument();
  expect(screen.getByText(/Good try|Here is the correct|Not quite/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Drag Condense')).not.toBeInTheDocument();
});

test('double-clicking Submit sends one request', async () => {
  let release;
  api.submit.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
  mount();
  const button = screen.getByRole('button', { name: 'Submit answer' });
  fireEvent.click(button); fireEvent.click(button);
  expect(api.submit).toHaveBeenCalledTimes(1);
  await act(async () => release({ tries: 1, finished: true, is_correct: true, explanation: 'ok' }));
});

test('hint button asks the server for a hint', async () => {
  api.hint.mockResolvedValueOnce({ hint: 'Start with the sun.' });
  mount();
  fireEvent.click(screen.getByRole('button', { name: /Get a hint/ }));
  expect(await screen.findByText(/Start with the sun/)).toBeInTheDocument();
});

// ── navigation, resume, results ─────────────────────────────────────────────

test('moves through several questions and shows progress', async () => {
  api.submit.mockResolvedValue({ tries: 1, finished: true, is_correct: true, explanation: 'ok' });
  mount(attemptOf([question('q1'), question('q2', ['c', 'a', 'b'])]));
  expect(screen.getByText(/Question.*1.*of.*2/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  fireEvent.click(await screen.findByRole('button', { name: /Next question/ }));
  expect(await screen.findByText(/Question.*2.*of.*2/)).toBeInTheDocument();
  await waitFor(() => expect(shown()).toEqual(['Precipitate', 'Evaporate', 'Condense']));   // the card swaps after its exit animation
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');   // progress = questions completed (1 of 2)
  expect(screen.getByText(/1 of 2 questions completed/)).toBeInTheDocument();
});

test('a refreshed attempt resumes at the first unfinished question', () => {
  mount(attemptOf([question('q1', ['b', 'c', 'a'], { finished: true, tries: 1 }), question('q2', ['c', 'a', 'b'])]));
  expect(screen.getByText(/Question.*2.*of.*2/)).toBeInTheDocument();
  expect(screen.getByText(/1 of 2 questions completed/)).toBeInTheDocument();
});

const result = (extra = {}) => ({
  score: 67, points_earned: 6, total_questions: 2, correct_questions: 2, incorrect_questions: 0, accuracy: 100, time_taken_seconds: 75,
  attempt_number: 1, max_attempts: 2, can_retry: true, newly_earned_badges: [],
  question_results: [
    { item_id: 'q1', prompt: 'Arrange the water cycle (q1).', is_correct: true, first_try: true, tries: 1, explanation: 'Water changes state.', correct_sequence: ['Evaporate', 'Condense', 'Precipitate'] },
    { item_id: 'q2', prompt: 'Arrange the water cycle (q2).', is_correct: false, first_try: false, tries: 3, explanation: 'Rain comes last.', correct_sequence: ['Evaporate', 'Condense', 'Precipitate'] },
  ], ...extra,
});

test('the results screen shows totals, question-wise feedback, explanations and retry', async () => {
  api.submit.mockResolvedValue({ tries: 1, finished: true, is_correct: true, explanation: 'ok' });
  api.complete.mockResolvedValueOnce(result({ newly_earned_badges: [{ key: 'first', name: 'First step', icon: '🏅', description: 'Completed one game.' }] }));
  const onRestart = vi.fn().mockResolvedValue();
  mount(baseAttempt(), { onRestart });
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  fireEvent.click(await screen.findByRole('button', { name: /Finish game/ }));
  expect(await screen.findByText('Sequencing complete!')).toBeInTheDocument();
  expect(screen.getByText('67%')).toBeInTheDocument();
  expect(screen.getByText(/points earned/)).toBeInTheDocument();
  expect(screen.getByText('1m 15s')).toBeInTheDocument();
  expect(screen.getByText('First step')).toBeInTheDocument();
  const rows = within(screen.getByLabelText('Question results')).getAllByRole('article');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent('Correct on the first try');
  expect(rows[1]).toHaveTextContent('Not solved after 3 tries');
  expect(rows[1]).toHaveTextContent('Rain comes last.');
  expect(screen.getByText('Attempt 1 of 2')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
  await waitFor(() => expect(onRestart).toHaveBeenCalledTimes(1));
});

test('retry is hidden and the limit explained once all attempts are used', async () => {
  api.submit.mockResolvedValue({ tries: 1, finished: true, is_correct: true, explanation: 'ok' });
  api.complete.mockResolvedValueOnce(result({ can_retry: false, attempt_number: 2 }));
  mount(baseAttempt(), { onRestart: vi.fn() });
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  fireEvent.click(await screen.findByRole('button', { name: /Finish game/ }));
  await screen.findByText('Sequencing complete!');
  expect(screen.queryByRole('button', { name: /Try again/ })).not.toBeInTheDocument();
  expect(screen.getByText('You have used all 2 attempts for this game.')).toBeInTheDocument();
});

test('a failed save keeps the student on the question with an error and lets them retry', async () => {
  api.submit.mockResolvedValue({ tries: 1, finished: true, is_correct: true, explanation: 'ok' });
  api.complete.mockRejectedValueOnce(new Error('Network down'));
  api.complete.mockResolvedValueOnce({ score: 100, points_earned: 10 });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  fireEvent.click(await screen.findByRole('button', { name: /Finish game/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
  fireEvent.click(screen.getByRole('button', { name: /Finish game/ }));
  expect(await screen.findByText('Sequencing complete!')).toBeInTheDocument();
  expect(screen.getByText('10 points earned')).toBeInTheDocument();   // older/minimal result shapes still render
});

// ── teacher review ──────────────────────────────────────────────────────────

const reviewItems = () => [
  { id: 'q1', question_id: 11, prompt: 'Order the stages.', topic: 'Water cycle', explanation: 'Because.', steps: [{ id: 'a', content: 'Evaporate' }, { id: 'b', content: 'Condense' }] },
  { id: 'q2', question_id: 12, prompt: '', topic: '', explanation: '', steps: [{ id: 'c', content: 'Rain' }, { id: 'd', content: 'rain' }] },
];

test('review flags invalid questions before approval', () => {
  render(<SequencingReview items={reviewItems()} editable onChange={vi.fn()} activityId={5} onRefresh={vi.fn()} />);
  expect(screen.getByRole('alert')).toHaveTextContent('1 of 2 questions need attention');
  expect(screen.getByText('Looks valid')).toBeInTheDocument();
  expect(screen.getByText('The question text is empty.')).toBeInTheDocument();
  expect(screen.getByText('The explanation is empty.')).toBeInTheDocument();
  expect(screen.getByText('Two steps are identical.')).toBeInTheDocument();
  expect(sequenceProblems(reviewItems()[0])).toEqual([]);
});

test('review lets the teacher edit question, topic, explanation and steps, reorder, and remove', () => {
  const onChange = vi.fn();
  render(<SequencingReview items={reviewItems()} editable onChange={onChange} activityId={5} onRefresh={vi.fn()} />);
  fireEvent.change(screen.getAllByLabelText('Question')[0], { target: { value: 'New question text' } });
  expect(onChange).toHaveBeenLastCalledWith(0, expect.objectContaining({ prompt: 'New question text' }));
  fireEvent.change(screen.getAllByLabelText('Topic')[0], { target: { value: 'Rain' } });
  expect(onChange).toHaveBeenLastCalledWith(0, expect.objectContaining({ topic: 'Rain' }));
  fireEvent.change(screen.getAllByLabelText(/Explanation shown/)[0], { target: { value: 'Why.' } });
  expect(onChange).toHaveBeenLastCalledWith(0, expect.objectContaining({ explanation: 'Why.' }));
  fireEvent.change(screen.getAllByLabelText('Sequence item 1')[0], { target: { value: 'Sun heats water' } });
  expect(onChange.mock.lastCall[1].steps[0].content).toBe('Sun heats water');
  fireEvent.click(screen.getAllByLabelText('Move item down')[0]);
  const reordered = onChange.mock.lastCall[1];
  expect(reordered.steps.map((s) => s.id)).toEqual(['b', 'a']);
  expect(reordered.steps.map((s) => s.correct_position)).toEqual([1, 2]);
  expect(reordered.correct_order).toEqual(['b', 'a']);
  fireEvent.click(screen.getByLabelText('Remove question 2'));
  expect(onChange).toHaveBeenLastCalledWith(1, null);
});

test('review can regenerate one question after confirmation and refreshes the draft', async () => {
  api.sequencing.regenerateQuestion.mockResolvedValueOnce({});
  const onRefresh = vi.fn().mockResolvedValue();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<SequencingReview items={reviewItems()} editable onChange={vi.fn()} activityId={5} onRefresh={onRefresh} />);
  fireEvent.click(screen.getAllByRole('button', { name: /Regenerate/ })[0]);
  await waitFor(() => expect(api.sequencing.regenerateQuestion).toHaveBeenCalledWith(5, 11));
  await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  expect(await screen.findByRole('status')).toHaveTextContent('Question 1 was regenerated');
});

test('read-only review (published) offers no editing controls', () => {
  render(<SequencingReview items={[reviewItems()[0]]} editable={false} onChange={vi.fn()} activityId={5} />);
  expect(screen.queryByLabelText('Question')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Regenerate/ })).not.toBeInTheDocument();
  expect(screen.getByText('Order the stages.')).toBeInTheDocument();
});

// ── teacher-facing generation errors ────────────────────────────────────────

test('generation errors are translated into clear teacher messages', () => {
  const partial = new Error('Unable to generate all 5 sequencing questions. Successfully generated 3. Sequencing generation incomplete: requested=5, valid=3, rejected=7, missing=2. Generated sequencing content is invalid: missing topic');
  expect(friendlyGenerationError(partial)).toBe('Unable to generate all 5 sequencing questions. Successfully generated 3. Nothing was saved. Please try again, or request fewer questions.');
  expect(friendlyGenerationError(Object.assign(new Error('AI generation is unavailable because provider configuration is invalid.'), { status: 503 }))).toBe('Content generation is currently unavailable. Please contact the administrator.');
  expect(friendlyGenerationError(Object.assign(new Error('AI generation provider is unavailable.'), { status: 503 }))).toBe('AI content generation is temporarily unavailable. Please try again.');
  expect(friendlyGenerationError(Object.assign(new Error('quota'), { status: 429 }))).toMatch(/busy/);
  expect(friendlyGenerationError(Object.assign(new Error('Traceback (most recent call last)'), { status: 500 }))).toBe('Content generation failed unexpectedly. Please try again.');
  expect(friendlyGenerationError(new Error('Enter a topic before generating.'))).toBe('Enter a topic before generating.');
});

test('publishing still asks for target classrooms', () => {
  render(<PublishModal activity={{ title: 'Water cycle', game_type: 'sequencing' }} classrooms={[{ id: 1, name: 'Class 5A', grade: 5 }]} saving={false} onCancel={vi.fn()} onConfirm={vi.fn()} />);
  expect(screen.getByText(/Class 5A/)).toBeInTheDocument();
});
