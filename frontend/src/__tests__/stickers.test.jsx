import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import StickerArt, { STICKER_ART_KEYS } from '../components/stickers/StickerArt.jsx';
import StickerAlbum from '../components/stickers/StickerAlbum.jsx';
import StickerCard, { remainingText } from '../components/stickers/StickerCard.jsx';
import StickerUnlockModal from '../components/stickers/StickerUnlockModal.jsx';
import { Icon, ICON_NAMES } from '../components/gamification/illustrations.jsx';

afterEach(() => cleanup());

const sticker = (over = {}) => ({ key: 'baby_penguin', name: 'Baby Penguin', art: 'baby_penguin', collection: 'animal_kingdom', rarity: 'common', family: 'penguin', stage: 1, evolves_from: null,
  earned: true, earned_at: '2026-03-01T10:00:00', unlock_text: 'Finish your very first activity.', teacher_only: false, needs: null, progress: { current: 1, target: 1, percent: 100 }, ...over });
const album = () => ({
  summary: { collected: 2, total: 5, percent: 40, legendary_collected: 0 },
  collections: [{ key: 'animal_kingdom', name: 'Animal Kingdom', description: 'Cute animals.', cover: 'baby_penguin', collected: 2, total: 4, stickers: [
    sticker(),
    sticker({ key: 'explorer_penguin', name: 'Explorer Penguin', art: 'explorer_penguin', rarity: 'uncommon', stage: 2, evolves_from: 'baby_penguin', earned: true, unlock_text: 'Finish 8 different activities.' }),
    sticker({ key: 'super_penguin', name: 'Super Penguin', art: 'super_penguin', rarity: 'epic', stage: 3, evolves_from: 'explorer_penguin', earned: false, earned_at: null, unlock_text: 'Finish 20 different activities with 80% or better.', progress: { current: 8, target: 20, percent: 40 } }),
    sticker({ key: 'panda_buddy', name: 'Panda Buddy', art: 'panda_buddy', family: null, stage: null, earned: false, earned_at: null, unlock_text: 'Finish 3 different activities.', progress: { current: 1, target: 3, percent: 33 } }),
  ] }, { key: 'sweet_treats', name: 'Sweet Treats', description: 'Yum.', cover: 'cookie_buddy', collected: 0, total: 1, stickers: [sticker({ key: 'cookie_buddy', name: 'Cookie Buddy', art: 'cookie_buddy', earned: false, earned_at: null, progress: { current: 0, target: 5, percent: 0 } })] }],
});

test('every sticker character is real artwork and no two characters look alike', () => {
  const seen = new Map();
  for (const key of STICKER_ART_KEYS) {
    const { container, unmount } = render(<StickerArt art={key} />);
    const svg = container.querySelector('svg');
    expect(svg, key).not.toBeNull();
    expect(svg.querySelectorAll('path, ellipse, circle, rect, polygon').length, key).toBeGreaterThan(6);   // a drawn character, not a blob
    expect(svg.textContent, key).toBe('');                                                                // no text/emoji as artwork
    const markup = svg.innerHTML;
    expect(seen.has(markup), `${key} duplicates ${seen.get(markup)}`).toBe(false);
    seen.set(markup, key);
    unmount();
  }
  expect(STICKER_ART_KEYS.length).toBeGreaterThanOrEqual(50);
});

test('unknown art falls back to a friendly star instead of breaking the album', () => {
  const { container } = render(<StickerArt art="does_not_exist" />);
  expect(container.querySelector('svg polygon')).not.toBeNull();
});

test('the illustration library has no empty icons', () => {
  for (const name of ICON_NAMES) {
    const { container, unmount } = render(<Icon name={name} />);
    expect(container.querySelector('svg')?.children.length, name).toBeGreaterThan(0);
    unmount();
  }
});

test('the album shows totals, collection cards with progress, and opens a collection', () => {
  render(<StickerAlbum initial={album()} />);
  expect(screen.getByRole('heading', { name: 'MY STICKER ALBUM' })).toBeInTheDocument();
  expect(screen.getByText('Stickers collected').previousSibling).toHaveTextContent('2');
  expect(screen.getByText('Album complete').previousSibling).toHaveTextContent('40%');
  expect(screen.getByText('Legendary').previousSibling).toHaveTextContent('0');
  fireEvent.click(screen.getByRole('button', { name: /Animal Kingdom: 2 of 4/ }));
  expect(screen.getAllByRole('article')).toHaveLength(4);
  fireEvent.click(screen.getByRole('button', { name: /All collections/ }));
  expect(screen.getByRole('button', { name: /Sweet Treats/ })).toBeInTheDocument();
});

test('unlocked stickers show name, rarity and date; locked ones show the condition and live progress', () => {
  render(<StickerAlbum initial={album()} />);
  fireEvent.click(screen.getByRole('button', { name: /Animal Kingdom/ }));
  const unlocked = document.querySelector('[data-sticker="baby_penguin"]');
  expect(unlocked).toHaveAttribute('data-earned', 'true');
  expect(within(unlocked).getByText('Common')).toBeInTheDocument();
  expect(within(unlocked).getByText(/Unlocked .*2026/)).toBeInTheDocument();
  const locked = document.querySelector('[data-sticker="panda_buddy"]');
  expect(locked).toHaveAttribute('data-earned', 'false');
  expect(within(locked).getByText('Finish 3 different activities.')).toBeInTheDocument();
  expect(within(locked).getByRole('progressbar', { name: /Panda Buddy progress/ })).toHaveAttribute('aria-valuenow', '1');
  expect(within(locked).getByText('2 more to unlock this sticker.')).toBeInTheDocument();
  expect(locked.querySelector('svg')).toHaveStyle({ filter: 'brightness(0) opacity(.22)' });   // silhouette: no colour spoilers
});

test('evolution is shown with the next stage and its progress', () => {
  render(<StickerAlbum initial={album()} />);
  fireEvent.click(screen.getByRole('button', { name: /Animal Kingdom/ }));
  const evo = screen.getByLabelText('penguin evolution');
  expect(within(evo).getByText('Stage 1')).toBeInTheDocument();
  expect(within(evo).getByText('Stage 3')).toBeInTheDocument();
  expect(within(evo).getByText(/Next: Super Penguin \(8\/20\)/)).toBeInTheDocument();
});

test('rarity frames: each rarity has its own treatment', () => {
  for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
    const { container, unmount } = render(<StickerCard sticker={sticker({ rarity })} />);
    expect(container.querySelector(`.stk-frame.stk-${rarity}`), rarity).not.toBeNull();
    unmount();
  }
});

test('hints for stickers that cannot be earned by playing', () => {
  expect(remainingText(sticker({ earned: false, teacher_only: true, progress: null }))).toMatch(/teacher/i);
  expect(remainingText(sticker({ earned: false, needs: 'Baby Penguin' }))).toBe('First collect Baby Penguin.');
  expect(remainingText(sticker({ earned: false, progress: { current: 4, target: 5, percent: 80 } }))).toBe('Just 1 more to unlock this sticker!');
});

test('the unlock reveal opens the gift, shows each new sticker, and can be dismissed', async () => {
  const onClose = vi.fn();
  const two = [sticker({ key: 'baby_penguin' }), sticker({ key: 'shooting_star', name: 'Shooting Star', art: 'shooting_star', rarity: 'rare', unlock_text: 'Score 100% in a quiz.', description: 'Score 100% in a quiz.' })];
  render(<MemoryRouter><StickerUnlockModal stickers={two.map((s) => ({ ...s, description: s.unlock_text }))} onClose={onClose} /></MemoryRouter>);
  const dialog = screen.getByRole('dialog', { name: /new sticker unlocked/i });
  expect(await within(dialog).findByText('You unlocked a new sticker!', {}, { timeout: 3000 })).toBeInTheDocument();
  expect(within(dialog).getByText('Baby Penguin')).toBeInTheDocument();
  expect(within(dialog).getByText('Saved to your Sticker Album!')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: /Next sticker/ }));
  expect(await within(dialog).findByText('Shooting Star', {}, { timeout: 3000 })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});
