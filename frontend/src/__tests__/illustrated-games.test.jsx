import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import SequencingGame from '../components/SequencingGame.jsx';
import MatchingBody from '../components/MatchingBody.jsx';

afterEach(() => cleanup());

const stepsOf = (names) => names.map((content, i) => ({ id: `s${i}`, content }));

test('sequencing cards carry the picture that explains their text, and unknown steps get none', () => {
  const attempt = { attempt_id: 1, subject: 'Science', title: 'Cycle', items: [{ id: 'q1', prompt: 'Arrange the life cycle of a butterfly.', interaction_mode: 'both',
    steps: stepsOf(['Butterfly', 'Egg', 'Chrysalis', 'Caterpillar', 'Tell a story']) }] };
  render(<MemoryRouter><SequencingGame attempt={attempt} user={{ name: 'Kid' }} onSignOut={vi.fn()} /></MemoryRouter>);
  const icon = (text) => screen.getByText(text).closest('[data-step-id]').querySelector('[data-step-icon]')?.getAttribute('data-step-icon');
  expect([icon('Egg'), icon('Caterpillar'), icon('Chrysalis'), icon('Butterfly')]).toEqual(['egg', 'caterpillar', 'chrysalis', 'butterfly']);
  expect(icon('Tell a story')).toBeUndefined();
});

test('photosynthesis steps are illustrated too', () => {
  const attempt = { attempt_id: 1, subject: 'Science', title: 'Photosynthesis', items: [{ id: 'q1', prompt: 'Arrange photosynthesis.', interaction_mode: 'both',
    steps: stepsOf(['Plants absorb sunlight', 'Plants take in water and carbon dioxide', 'Plants produce glucose', 'Oxygen is released']) }] };
  render(<MemoryRouter><SequencingGame attempt={attempt} user={{ name: 'Kid' }} onSignOut={vi.fn()} /></MemoryRouter>);
  const icons = [...document.querySelectorAll('[data-step-icon]')].map((n) => n.getAttribute('data-step-icon')).sort();
  expect(icons).toEqual(['co2', 'glucose', 'oxygen', 'sun'].sort());
});

test('matching tiles show a picture only for words we can draw exactly', () => {
  const item = { id: 'm1', lefts: [{ id: 'p1', text: 'Bird' }, { id: 'p2', text: 'Photosynthesis' }], rights: [{ id: 'right-1', text: 'Nest' }, { id: 'right-2', text: 'Process in leaves' }], matched: {} };
  render(<MatchingBody item={item} onCheck={vi.fn()} />);
  const hasPicture = (text) => screen.getByText(text).closest('button').querySelector('svg:not([aria-hidden="true"]), svg[aria-hidden="true"]:not(.mg-grip)') !== null;
  expect(screen.getByText('Bird').closest('button').querySelectorAll('svg').length).toBe(1);
  expect(screen.getByText('Nest').closest('button').querySelectorAll('svg').length).toBe(1);
  expect(screen.getByText('Photosynthesis').closest('button').querySelectorAll('svg').length).toBe(0);
  expect(screen.getByText('Process in leaves').closest('button').querySelectorAll('svg').length).toBe(0);
  void hasPicture;
});
