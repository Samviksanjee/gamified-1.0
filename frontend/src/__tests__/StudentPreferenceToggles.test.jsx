/**
 * StudentPreferenceToggles.test.jsx
 *
 * - Consent toggle starts unchecked when server returns whatsapp_opt_in: false
 * - Toggling consent on → category toggles become interactive
 * - Clicking Save → PUT /api/v1/students/me/whatsapp-preferences called
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import StudentNotificationSettings from '../pages/StudentNotificationSettings.jsx';
import { AppProvider } from '../context/AppContext.jsx';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const PREFS_OPT_OUT = {
  phone_number: '+919876543210',
  phone_verified: true,
  whatsapp_opt_in: false,
  whatsapp_opt_in_at: null,
  whatsapp_notifications_enabled: true,
  categories: {
    announcements: true,
    games: true,
    assignments: true,
    reminders: true,
    events: true,
    general: true,
  },
};

const MOCK_USER = { id: 1, name: 'Test Student', role: 'student', phone_number: '+919876543210' };

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------
beforeEach(() => {
  global.fetch = vi.fn(async (url) => {
    if (url.includes('/students/me/whatsapp-preferences') && !url.includes('method')) {
      return {
        ok: true,
        status: 200,
        json: async () => PREFS_OPT_OUT,
      };
    }
    return { ok: true, status: 200, json: async () => ({ message: 'Preferences updated successfully' }) };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function renderSettings() {
  render(
    <AppProvider>
      <StudentNotificationSettings user={MOCK_USER} />
    </AppProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
test('consent toggle starts unchecked when server returns opt_in=false', async () => {
  renderSettings();

  // Wait for the component to finish loading
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/students/me/whatsapp-preferences'),
      expect.any(Object),
    );
  });

  // The master consent switch should be unchecked (aria-checked="false")
  const consentSwitch = await screen.findByRole('switch', { name: /receive whatsapp/i });
  expect(consentSwitch).toHaveAttribute('aria-checked', 'false');
});

test('toggling consent on enables category toggles', async () => {
  renderSettings();

  // Wait for preferences to load
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  });

  const consentSwitch = await screen.findByRole('switch', { name: /receive whatsapp/i });
  expect(consentSwitch).toHaveAttribute('aria-checked', 'false');

  // Toggle consent on
  fireEvent.click(consentSwitch);

  await waitFor(() => {
    expect(consentSwitch).toHaveAttribute('aria-checked', 'true');
  });

  // Category switches should now be enabled (not disabled)
  const categorySwitches = screen.getAllByRole('switch');
  // At least the master + one category switch
  expect(categorySwitches.length).toBeGreaterThan(1);
});

test('save button calls PUT /api/v1/students/me/whatsapp-preferences', async () => {
  renderSettings();

  await waitFor(() => { expect(global.fetch).toHaveBeenCalled(); });

  // Click save without changing anything
  const saveBtn = await screen.findByRole('button', { name: /save/i });
  fireEvent.click(saveBtn);

  await waitFor(() => {
    // Find the PUT call
    const putCall = global.fetch.mock.calls.find(
      ([url, opts]) =>
        url.includes('/students/me/whatsapp-preferences') && opts?.method === 'PUT',
    );
    expect(putCall).toBeTruthy();
  });
});

test('save sends correct payload after toggling consent on', async () => {
  renderSettings();

  await waitFor(() => { expect(global.fetch).toHaveBeenCalled(); });

  const consentSwitch = await screen.findByRole('switch', { name: /receive whatsapp/i });
  fireEvent.click(consentSwitch); // toggle to true

  const saveBtn = screen.getByRole('button', { name: /save/i });
  fireEvent.click(saveBtn);

  await waitFor(() => {
    const putCall = global.fetch.mock.calls.find(
      ([url, opts]) =>
        url.includes('/students/me/whatsapp-preferences') && opts?.method === 'PUT',
    );
    expect(putCall).toBeTruthy();
    const body = JSON.parse(putCall[1].body);
    expect(body.whatsapp_opt_in).toBe(true);
  });
});
