import { fireEvent, render, screen } from '@testing-library/react';
import { vi, expect, test } from 'vitest';
import { PublishModal } from '../pages/ReviewPage.jsx';

test('publish modal submits selected classrooms', () => {
  const onConfirm = vi.fn();
  render(
    <PublishModal
      activity={{ title: 'Water Cycle' }}
      classrooms={[{ id: 4, name: 'Science 5' }]}
      saving={false}
      onCancel={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  // The single classroom is pre-selected — just click Publish
  fireEvent.click(screen.getByRole('button', { name: /Publish/ }));
  expect(onConfirm).toHaveBeenCalledWith(
    expect.objectContaining({ classroom_ids: [4], student_ids: [] }),
  );
});

test('publish modal submits multiple selected classrooms', () => {
  const onConfirm = vi.fn();
  render(
    <PublishModal
      activity={{ title: 'Water Cycle' }}
      classrooms={[
        { id: 4, name: 'Science 5A' },
        { id: 5, name: 'Science 5B' },
      ]}
      saving={false}
      onCancel={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  // Neither pre-selected — check both then publish
  fireEvent.click(screen.getByLabelText('Science 5A'));
  fireEvent.click(screen.getByLabelText('Science 5B'));
  fireEvent.click(screen.getByRole('button', { name: /Publish/ }));
  expect(onConfirm).toHaveBeenCalledWith(
    expect.objectContaining({ classroom_ids: [4, 5] }),
  );
});

test('publish modal shows error when no classroom is selected', () => {
  const onConfirm = vi.fn();
  render(
    <PublishModal
      activity={{ title: 'Water Cycle' }}
      classrooms={[
        { id: 4, name: 'Science 5A' },
        { id: 5, name: 'Science 5B' },
      ]}
      saving={false}
      onCancel={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  // Click Publish with nothing selected
  fireEvent.click(screen.getByRole('button', { name: /Publish/ }));
  expect(screen.getByRole('alert')).toHaveTextContent(/at least one classroom/i);
  expect(onConfirm).not.toHaveBeenCalled();
});
