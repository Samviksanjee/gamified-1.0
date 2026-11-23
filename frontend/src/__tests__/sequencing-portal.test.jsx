/**
 * Sequencing teacher-publish -> student-portal integration (UI side).
 * The API layer is mocked; the server side is covered by backend/tests/test_sequencing_workflow.py.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ReviewPage, { PublishModal } from '../pages/ReviewPage.jsx';
import Resources from '../pages/Resources.jsx';
import StudentDashboard from '../pages/StudentDashboard.jsx';
import PlayPage from '../pages/PlayPage.jsx';
import { api } from '../api.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    api: {
      ...actual.api,
      preview: vi.fn(), activityClassrooms: vi.fn(), classrooms: vi.fn(), startAttempt: vi.fn(),
      assignmentsByClassroom: vi.fn(), studentAssignments: vi.fn(), studentStats: vi.fn(), studentDashboard: vi.fn(),
      submit: vi.fn(), hint: vi.fn(), complete: vi.fn(),
      puzzle: { ...actual.api.puzzle, list: vi.fn() }, crossword: { ...actual.api.crossword, listStudent: vi.fn() },
      sequencing: { ...actual.api.sequencing, publish: vi.fn(), approve: vi.fn() },
    },
  };
});

const draftOf = (status) => ({
  id: 21, title: 'Butterfly order', topic_title: 'Life cycle', game_type: 'sequencing', difficulty: 'medium',
  latest_version: { id: 3, status, items: [{ id: 'q1', question_id: 1, prompt: 'Order it.', topic: 'Life cycle', explanation: 'Fixed order.',
    steps: [{ id: 's1', content: 'Egg', correct_position: 1 }, { id: 's2', content: 'Larva', correct_position: 2 }, { id: 's3', content: 'Pupa', correct_position: 3 }] }] },
});
const reviewAt = () => render(<MemoryRouter initialEntries={['/review/21']}><Routes><Route path="/review/:activityId" element={<ReviewPage user={{}} onSignOut={vi.fn()} />} /></Routes></MemoryRouter>);

beforeEach(() => {
  [api.preview, api.activityClassrooms, api.classrooms, api.startAttempt, api.assignmentsByClassroom, api.studentAssignments,
    api.studentStats, api.studentDashboard, api.submit, api.hint, api.complete, api.sequencing.publish, api.sequencing.approve,
    api.puzzle.list, api.crossword.listStudent].forEach((fn) => fn.mockReset());
});
afterEach(() => cleanup());

// ── teacher: publish ────────────────────────────────────────────────────────

test('the publish modal sends the activity title, which the sequencing endpoint relies on', () => {
  const onConfirm = vi.fn();
  render(<PublishModal activity={{ title: 'Butterfly order' }} classrooms={[{ id: 4, name: 'Science 5' }]} saving={false} onCancel={vi.fn()} onConfirm={onConfirm} />);
  fireEvent.click(screen.getByRole('button', { name: /Publish/ }));
  expect(onConfirm).toHaveBeenCalledWith({ classroom_ids: [4], student_ids: [], title: 'Butterfly order' });
});

test('an approved sequencing draft is published through the sequencing endpoint and the success is shown', async () => {
  api.preview.mockResolvedValueOnce(draftOf('approved')).mockResolvedValue(draftOf('published'));
  api.activityClassrooms.mockResolvedValueOnce([]).mockResolvedValue([{ classroom_id: 4, classroom_name: 'Science 5' }]);
  api.classrooms.mockResolvedValue([{ id: 4, name: 'Science 5' }]);
  api.sequencing.publish.mockResolvedValue({ activity_id: 21, published_version_id: 3, assigned_classrooms: [4] });
  reviewAt();
  fireEvent.click(await screen.findByRole('button', { name: /🚀 Publish/ }));
  expect(await screen.findByLabelText('Science 5')).toBeChecked();   // a lone classroom is pre-selected
  fireEvent.click(within(document.body).getAllByRole('button', { name: /🚀 Publish/ }).pop());
  await waitFor(() => expect(api.sequencing.publish).toHaveBeenCalledWith('21', { classroom_ids: [4], student_ids: [], title: 'Butterfly order' }));
  expect(await screen.findByRole('status')).toHaveTextContent(/Published successfully/);
  expect(await screen.findByText('Science 5')).toBeInTheDocument();   // the persisted assignment is re-read from the server
});

test('a failed publish shows the server message instead of a success notice', async () => {
  api.preview.mockResolvedValue(draftOf('approved'));
  api.activityClassrooms.mockResolvedValue([]);
  api.classrooms.mockResolvedValue([{ id: 4, name: 'Science 5' }]);
  api.sequencing.publish.mockRejectedValue(new Error('You cannot assign to this classroom'));
  reviewAt();
  fireEvent.click(await screen.findByRole('button', { name: /🚀 Publish/ }));
  expect(await screen.findByLabelText('Science 5')).toBeChecked();   // a lone classroom is pre-selected
  fireEvent.click(within(document.body).getAllByRole('button', { name: /🚀 Publish/ }).pop());
  expect(await screen.findByText(/You cannot assign to this classroom/)).toBeInTheDocument();
  expect(screen.queryByText(/Published successfully/)).not.toBeInTheDocument();
});

// ── student: discovery ──────────────────────────────────────────────────────

const assignment = (extra = {}) => ({
  activity_id: 21, topic_id: 2, topic_title: 'Life cycle', title: 'Butterfly order', subject: 'EVS', grade: 5, mode: 'play',
  game_type: 'sequencing', difficulty: 'medium', assigned_at: '2026-01-01T00:00:00', due_at: null, status: 'New', best_score: null,
  attempt_count: 0, classroom_id: 4, classroom_name: 'Science 5', teacher_name: 'Ms Rao', ...extra,
});

function Where() { const location = useLocation(); return <div data-testid="where">{location.pathname}</div>; }

test('Resources lists a published sequencing activity and Start Activity opens it by id', async () => {
  api.assignmentsByClassroom.mockResolvedValue({ classrooms: [{ classroom_id: 4, classroom_name: 'Science 5', subject: 'EVS', grade: 5, teacher_name: 'Ms Rao', activities: [assignment({ classroom_name: 'Science 5', teacher_name: 'Ms Rao' })] }] });
  render(<MemoryRouter initialEntries={['/resources']}><Where /><Routes><Route path="/resources" element={<Resources />} /><Route path="/play/a/:id" element={<div>player</div>} /></Routes></MemoryRouter>);
  expect(await screen.findByText('Butterfly order')).toBeInTheDocument();
  expect(screen.getByText('Life cycle')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Start Activity/ }));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/play/a/21'));
});

test('an in-progress and a completed sequencing assignment are told apart', async () => {
  api.assignmentsByClassroom.mockResolvedValue({ classrooms: [{ classroom_id: 4, classroom_name: 'Science 5', subject: 'EVS', grade: 5, teacher_name: 'Ms Rao', activities: [
    assignment({ activity_id: 21, status: 'In Progress' }),
    assignment({ activity_id: 22, title: 'Finished one', status: 'Completed', best_score: 67, attempt_count: 1 }),
  ] }] });
  render(<MemoryRouter><Resources /></MemoryRouter>);
  expect(await screen.findByRole('button', { name: /Continue/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument();
  expect(screen.getByText('Finished one')).toBeInTheDocument();
});

test('the dashboard shows the assigned sequencing activity and starts it', async () => {
  api.studentStats.mockResolvedValue({ overall: {}, recent_activity: [], stats: {} });
  api.studentDashboard.mockResolvedValue({ topics: [], stats: {}, classrooms: [], concept_mastery: [] });
  api.studentAssignments.mockResolvedValue([assignment()]);
  api.puzzle.list.mockResolvedValue({ puzzles: [] });
  api.crossword.listStudent.mockResolvedValue({ crosswords: [] });
  render(<MemoryRouter initialEntries={['/dashboard']}><Where /><Routes><Route path="/dashboard" element={<StudentDashboard user={{ name: 'Learner' }} />} /><Route path="/play/a/:id" element={<div>player</div>} /></Routes></MemoryRouter>);
  expect(await screen.findByText('Butterfly order')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Start/ }));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/play/a/21'));
});

// ── student: routing, refresh, play ─────────────────────────────────────────

const attemptPayload = () => ({
  attempt_id: 9, title: 'Butterfly order', subject: 'EVS', topic: 'Life cycle', difficulty: 'medium', game_type: 'sequencing',
  interaction_mode: 'both', attempt_number: 1, max_attempts: 2,
  items: [{ id: 'q1', prompt: 'Order the life cycle.', interaction_mode: 'both', steps: [{ id: 's2', content: 'Larva' }, { id: 's3', content: 'Pupa' }, { id: 's1', content: 'Egg' }] }],
});
const playAt = (path) => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/play/a/:activityId" element={<PlayPage user={{ name: 'Learner' }} onSignOut={vi.fn()} />} /></Routes></MemoryRouter>);

test('PlayPage dispatches a sequencing attempt to the sequencing game, also on a fresh page load', async () => {
  api.startAttempt.mockResolvedValue(attemptPayload());
  playAt('/play/a/21');   // a direct URL = what a browser refresh renders
  expect(await screen.findByText('Order the life cycle.')).toBeInTheDocument();
  expect(api.startAttempt).toHaveBeenCalledWith({ activity_id: 21 });
  expect(document.querySelector('[data-game-player="sequencing"]')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Submit answer' })).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/correct_order|correct_position/);
});

test('a student who is not in the classroom sees the server refusal and a way back', async () => {
  api.startAttempt.mockRejectedValue(new Error('This sequencing activity is not assigned to your class or account'));
  playAt('/play/a/21');
  expect(await screen.findByText(/not assigned to your class/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Back to resources/ })).toBeInTheDocument();
});

test('a full student play: arrange, submit, feedback and results all come from the server', async () => {
  api.startAttempt.mockResolvedValue(attemptPayload());
  api.submit.mockResolvedValue({ tries: 1, finished: true, is_correct: true, explanation: 'Insects change form in order.' });
  api.complete.mockResolvedValue({
    score: 100, points_earned: 10, total_questions: 1, correct_questions: 1, incorrect_questions: 0, accuracy: 100, time_taken_seconds: 20,
    attempt_number: 1, max_attempts: 2, can_retry: true, newly_earned_badges: [],
    question_results: [{ item_id: 'q1', prompt: 'Order the life cycle.', is_correct: true, first_try: true, tries: 1, explanation: 'Insects change form in order.', correct_sequence: ['Egg', 'Larva', 'Pupa'] }],
  });
  playAt('/play/a/21');
  await screen.findByText('Order the life cycle.');
  fireEvent.click(screen.getByRole('button', { name: 'Move Egg up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Move Egg up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
  expect(await screen.findByText('Insects change form in order.')).toBeInTheDocument();
  expect(api.submit).toHaveBeenCalledWith(9, 'q1', { order: ['s1', 's2', 's3'] }, expect.any(String));
  fireEvent.click(screen.getByRole('button', { name: /Finish game/ }));
  expect(await screen.findByText('Sequencing complete!')).toBeInTheDocument();
  expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
});
