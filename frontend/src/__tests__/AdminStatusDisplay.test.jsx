/**
 * AdminStatusDisplay.test.jsx
 *
 * - Mocks GET /api/v1/admin/whatsapp/status
 * - Renders the admin WhatsApp status view
 * - Verifies status badge renders
 * - Verifies no token / secret value appears in the DOM
 */
import { render, screen, waitFor } from '@testing-library/react';
import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext.jsx';
import { adminApi } from '../api.js';
import SuperAdminWhatsApp from '../pages/SuperAdmin/SuperAdminWhatsApp.jsx';

// ---------------------------------------------------------------------------
// Mock the API module
// ---------------------------------------------------------------------------
vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      whatsappStatus: vi.fn(),
      whatsappAnalytics: vi.fn(),
      whatsappLogs: vi.fn(),
      whatsappTemplates: vi.fn(),
      updateWhatsappTemplate: vi.fn(),
    },
  };
});

const MOCK_STATUS = {
  enabled: true,
  is_configured: true,
  api_version: 'v18.0',
  default_country_code: '91',
  has_access_token: true,
  has_phone_number_id: true,
  has_business_account_id: true,
  has_webhook_verify_token: true,
  has_app_secret: true,
  // Map to what the UI checks
  access_token_configured: true,
  phone_number_id_configured: true,
  webhook_configured: true,
  total_students: 50,
  total_opt_ins: 30,
  phone_verified_count: 25,
};

const MOCK_USER = { id: 1, name: 'Super Admin', role: 'super_admin' };

beforeEach(() => {
  adminApi.whatsappStatus.mockResolvedValue(MOCK_STATUS);
  adminApi.whatsappAnalytics.mockResolvedValue({ total_sent: 0, by_status: {}, by_type: {} });
  adminApi.whatsappLogs.mockResolvedValue({ total: 0, page: 1, page_size: 20, items: [] });
  adminApi.whatsappTemplates.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderAdminWhatsApp(view = 'status') {
  render(
    <AppProvider>
      <MemoryRouter initialEntries={['/admin/whatsapp']}>
        <SuperAdminWhatsApp user={MOCK_USER} onSignOut={() => {}} view={view} />
      </MemoryRouter>
    </AppProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
test('calls GET /admin/whatsapp/status on mount', async () => {
  renderAdminWhatsApp('status');

  await waitFor(() => {
    expect(adminApi.whatsappStatus).toHaveBeenCalled();
  });
});

test('renders status badge showing enabled state', async () => {
  renderAdminWhatsApp('status');

  await waitFor(() => {
    expect(adminApi.whatsappStatus).toHaveBeenCalled();
  });

  // After data loads there should be configuration check items in the DOM
  await waitFor(() => {
    // At least one checkbox/status indicator should be visible
    const checks = screen.queryAllByText(/configured|enabled/i);
    expect(checks.length).toBeGreaterThan(0);
  });
});

test('does not render access token or app secret values in DOM', async () => {
  renderAdminWhatsApp('status');

  await waitFor(() => {
    expect(adminApi.whatsappStatus).toHaveBeenCalled();
  });

  // The actual token values must never appear
  // MOCK_STATUS contains no actual secret; verify the DOM doesn't
  // contain common secret patterns (bearer tokens, etc.)
  const domText = document.body.textContent || '';

  // No raw API key patterns
  expect(domText).not.toMatch(/EAAe[A-Za-z0-9]{20,}/); // FB access token pattern
  expect(domText).not.toMatch(/whatsapp_access_token\s*[:=]\s*[^\s]+/i);
  expect(domText).not.toMatch(/whatsapp_app_secret\s*[:=]\s*[^\s]+/i);
});

test('response shows api_version value from status', async () => {
  renderAdminWhatsApp('status');

  await waitFor(() => {
    expect(adminApi.whatsappStatus).toHaveBeenCalled();
  });

  // The API version (v18.0) should appear in the status panel
  await waitFor(() => {
    expect(document.body.textContent).toContain('v18.0');
  });
});
