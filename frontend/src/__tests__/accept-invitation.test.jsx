import { cleanup, render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AcceptInvitation from '../pages/AcceptInvitation.jsx';
import { superAdmin } from '../api.js';

// ---------------------------------------------------------------------------
// Mock api.js — only the superAdmin helpers the component uses
// ---------------------------------------------------------------------------
vi.mock('../api.js', () => ({
  superAdmin: {
    verifyInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
  },
  auth: {
    get token() { return null; },
    set: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mount AcceptInvitation inside a MemoryRouter.
 * Pass `path` like '/accept-invitation?token=abc' or just '/accept-invitation'.
 */
function mount(path = '/accept-invitation?token=testtoken') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AcceptInvitation page', () => {
  test('missing token shows invalid link screen', () => {
    mount('/accept-invitation');
    expect(screen.getByText(/Invalid Link/i)).toBeInTheDocument();
  });

  test('expired invitation shows expired screen', async () => {
    superAdmin.verifyInvitation.mockResolvedValue({ valid: false, reason: 'expired' });
    mount();
    expect(await screen.findByText(/Invitation Expired/i)).toBeInTheDocument();
  });

  test('revoked invitation shows revoked screen', async () => {
    superAdmin.verifyInvitation.mockResolvedValue({ valid: false, reason: 'revoked' });
    mount();
    expect(await screen.findByText(/Invitation Revoked/i)).toBeInTheDocument();
  });

  test('already accepted invitation shows already-accepted screen', async () => {
    superAdmin.verifyInvitation.mockResolvedValue({ valid: false, reason: 'used' });
    mount();
    expect(await screen.findByText(/Already Accepted/i)).toBeInTheDocument();
  });

  test('valid invitation shows activation form with read-only name and email', async () => {
    superAdmin.verifyInvitation.mockResolvedValue({
      valid: true,
      email: 'teacher@school.com',
      name: 'Jane Smith',
    });
    mount();

    // Form heading
    expect(await screen.findByText(/Activate Your Account/i)).toBeInTheDocument();

    // Read-only fields display the invitation data
    const nameInput = screen.getByLabelText(/Full name/i);
    const emailInput = screen.getByLabelText(/Email address/i);
    expect(nameInput).toHaveValue('Jane Smith');
    expect(emailInput).toHaveValue('teacher@school.com');
    expect(nameInput).toHaveAttribute('readonly');
    expect(emailInput).toHaveAttribute('readonly');
  });

  test('password shorter than 8 characters shows validation error', async () => {
    superAdmin.verifyInvitation.mockResolvedValue({
      valid: true,
      email: 'teacher@school.com',
      name: 'Jane Smith',
    });
    mount();

    await screen.findByText(/Activate Your Account/i);

    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test('password mismatch shows validation error', async () => {
    superAdmin.verifyInvitation.mockResolvedValue({
      valid: true,
      email: 'teacher@school.com',
      name: 'Jane Smith',
    });
    mount();

    await screen.findByText(/Activate Your Account/i);

    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Different123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
  });

  test('successful activation shows success screen', async () => {
    superAdmin.verifyInvitation.mockResolvedValue({
      valid: true,
      email: 'teacher@school.com',
      name: 'Jane Smith',
    });
    superAdmin.acceptInvitation.mockResolvedValue({
      message: 'Account created successfully.',
      access_token: 'tok',
      user: { id: 1, email: 'teacher@school.com', name: 'Jane Smith', role: 'teacher' },
    });
    mount();

    await screen.findByText(/Activate Your Account/i);

    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'SecurePass123!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));
    });

    expect(await screen.findByRole('heading', { name: /Account Activated/i })).toBeInTheDocument();
    expect(screen.getByText(/You can now log in/i)).toBeInTheDocument();
  });

  test('network error during verify shows error screen', async () => {
    superAdmin.verifyInvitation.mockRejectedValue(new Error('Network error'));
    mount();
    expect(await screen.findByText(/Network Error/i)).toBeInTheDocument();
  });

  test('submit button is disabled while request is in flight', async () => {
    superAdmin.verifyInvitation.mockResolvedValue({
      valid: true,
      email: 'teacher@school.com',
      name: 'Jane Smith',
    });

    let resolveAccept;
    superAdmin.acceptInvitation.mockReturnValue(
      new Promise((resolve) => { resolveAccept = resolve; })
    );

    mount();
    await screen.findByText(/Activate Your Account/i);

    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'SecurePass123!' },
    });

    const btn = screen.getByRole('button', { name: /Activate Account/i });
    fireEvent.click(btn);

    // Button should be disabled while the promise is pending
    await waitFor(() => expect(screen.getByRole('button', { name: /Activating/i })).toBeDisabled());

    // Resolve to avoid unhandled rejection
    resolveAccept({ message: 'Account created successfully.', access_token: 't', user: {} });
  });
});
