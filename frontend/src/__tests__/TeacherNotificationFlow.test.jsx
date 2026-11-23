/**
 * TeacherNotificationFlow.test.jsx
 *
 * Renders CreateAnnouncement, fills classroom + title + body,
 * clicks Publish, and verifies that POST /api/v1/teacher/notifications/announcements
 * is called with the correct payload.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import CreateAnnouncement from '../components/teacher/whatsapp/CreateAnnouncement.jsx';
import { AppProvider } from '../context/AppContext.jsx';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const CLASSROOMS = [
  { id: 1, name: 'Science 5A', grade: 5, subject: 'Science', students_count: 20 },
  { id: 2, name: 'Maths 6B',   grade: 6, subject: 'Mathematics', students_count: 15 },
];

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------
beforeEach(() => {
  global.fetch = vi.fn(async (url, _opts) => ({
    ok: true,
    status: 200,
    json: async () => ({ message: 'Notification dispatch queued', announcement_id: 42 }),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function renderComponent() {
  render(
    <AppProvider>
      <CreateAnnouncement classrooms={CLASSROOMS} />
    </AppProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
test('publish calls POST /api/v1/teacher/notifications/announcements with correct payload', async () => {
  renderComponent();

  // Select a classroom
  fireEvent.change(screen.getByLabelText(/classroom/i), {
    target: { value: '1' },
  });

  // Fill title
  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'No School Tomorrow' },
  });

  // Fill body/message
  const bodyField =
    screen.queryByLabelText(/body/i) ||
    screen.queryByLabelText(/message/i) ||
    screen.queryByLabelText(/announcement/i) ||
    screen.getByRole('textbox', { name: /body|message|announcement/i });

  fireEvent.change(bodyField, {
    target: { value: 'School is closed tomorrow due to a public holiday.' },
  });

  // Click Publish
  fireEvent.click(screen.getByRole('button', { name: /publish|send/i }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalled());

  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toContain('/teacher/notifications/announcements');
  expect(options.method).toBe('POST');

  const body = JSON.parse(options.body);
  expect(body.classroom_id).toBe(1);
  expect(body.title).toBe('No School Tomorrow');
  expect(body.body).toBe('School is closed tomorrow due to a public holiday.');
});

test('shows error when classroom is not selected', async () => {
  renderComponent();

  // Fill title and body but no classroom
  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'Some Title' },
  });

  fireEvent.click(screen.getByRole('button', { name: /publish|send/i }));

  // Should show validation error, not call fetch
  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeTruthy();
  });
  expect(global.fetch).not.toHaveBeenCalled();
});
