import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect, test, beforeEach } from 'vitest';
import Login from '../pages/Login.jsx';

// ---------------------------------------------------------------------------
// Mock global.fetch — returns a successful registration response
// ---------------------------------------------------------------------------
beforeEach(() => {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      access_token: 'test-token',
      user: { email: 'test@example.com', role: 'student', phone_number: '+919876543210' },
    }),
  }));
});

// ---------------------------------------------------------------------------
// Helper: render Login and switch to register mode
// ---------------------------------------------------------------------------
function renderInRegisterMode() {
  const onAuth = vi.fn();
  render(<Login onAuth={onAuth} />);
  // Click the toggle button to switch to register mode
  fireEvent.click(screen.getByRole('button', { name: /create one/i }));
  return { onAuth };
}

// ---------------------------------------------------------------------------
// Helper: fill in all required fields except phone, then fill phone separately
// ---------------------------------------------------------------------------
function fillRequiredFields({ phone = '' } = {}) {
  fireEvent.change(screen.getByPlaceholderText('Your name'), {
    target: { name: 'name', value: 'Test Student' },
  });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { name: 'email', value: 'test@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your phone number'), {
    target: { name: 'phone_number', value: phone },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { name: 'password', value: 'SecurePassword123!' },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('submitting with empty phone shows "Phone number is required." and does not call fetch', async () => {
  renderInRegisterMode();
  fillRequiredFields({ phone: '' });

  fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Phone number is required.');
  });
  expect(fetch).not.toHaveBeenCalled();
});

test('submitting with phone "abc" shows "Enter a valid phone number." and does not call fetch', async () => {
  renderInRegisterMode();
  fillRequiredFields({ phone: 'abc' });

  fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid phone number.');
  });
  expect(fetch).not.toHaveBeenCalled();
});

test('submitting with valid Indian number "9876543210" calls fetch with phone_number "+919876543210"', async () => {
  renderInRegisterMode();
  fillRequiredFields({ phone: '9876543210' });

  fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledOnce();
  });
  const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
  expect(sentBody.phone_number).toBe('+919876543210');
});

test('submitting with valid US number "+12025550123" calls fetch with phone_number "+12025550123"', async () => {
  renderInRegisterMode();
  fillRequiredFields({ phone: '+12025550123' });

  fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledOnce();
  });
  const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
  expect(sentBody.phone_number).toBe('+12025550123');
});
