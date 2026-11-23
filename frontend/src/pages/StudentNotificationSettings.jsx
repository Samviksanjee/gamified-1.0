import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';

const CATEGORIES = [
  { key: 'announcements',          label: '📢 Announcements',          desc: 'Class announcements from your teacher' },
  { key: 'games',                  label: '🎮 New Games',              desc: 'When a new game or activity is published' },
  { key: 'assignments',            label: '📋 Assignments',            desc: 'When a new assignment is given to you' },
  { key: 'reminders',              label: '⏰ Assignment Reminders',   desc: 'Reminders before assignment deadlines' },
  { key: 'events',                 label: '📅 Events',                 desc: 'Upcoming classroom events' },
  { key: 'general',                label: '✉️ General',                desc: 'Other important updates from GamifiEd' },
];

function maskPhone(phone) {
  if (!phone) return '—';
  const s = String(phone).replace(/\D/g, '');
  if (s.length < 4) return phone;
  return phone.slice(0, -5).replace(/\d/g, 'X') + s.slice(-4);
}

export default function StudentNotificationSettings({ user }) {
  const { showToast } = useApp();

  const [prefs, setPrefs]       = useState(null);
  const [form, setForm]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.whatsappPreferences()
      .then((data) => {
        setPrefs(data);
        // Initialise form from server state.
        // consent is NOT pre-checked — it comes from the server value.
        setForm({
          whatsapp_opt_in: data.whatsapp_opt_in ?? false,
          categories: data.categories ?? {
            announcements: true,
            games:         true,
            assignments:   true,
            reminders:     true,
            events:        true,
            general:       true,
          },
        });
      })
      .catch((err) => setError(err.message || 'Failed to load preferences.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleConsent = () => {
    setForm((f) => ({ ...f, whatsapp_opt_in: !f.whatsapp_opt_in }));
  };

  const toggleCategory = (key) => {
    setForm((f) => ({
      ...f,
      categories: { ...f.categories, [key]: !f.categories[key] },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateWhatsappPreferences(form);
      setPrefs((p) => ({ ...p, ...form }));
      showToast('✓ Preferences saved!');
    } catch (err) {
      setError(err.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: '#688097', fontWeight: 700 }}>
        Loading preferences…
      </div>
    );
  }

  if (error && !form) {
    return (
      <div role="alert" style={{
        padding: 14, background: '#ffe9e7', color: '#c85a59',
        borderRadius: 12, margin: '24px 0', fontSize: 13,
      }}>
        ⚠ {error}
      </div>
    );
  }

  const consentOn = form?.whatsapp_opt_in ?? false;

  return (
    <>
      {/* Page header */}
      <section style={{ marginBottom: 24 }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 900, color: '#078b84', textTransform: 'uppercase', letterSpacing: '1px' }}>
          ACCOUNT SETTINGS
        </p>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(20px, 4vw, 26px)', color: '#153e67', fontWeight: 900 }}>
          WhatsApp Notifications 📱
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#688097' }}>
          Control how GamifiEd reaches you via WhatsApp.
        </p>
      </section>

      {error && (
        <div role="alert" style={{ padding: 12, background: '#ffe0e0', color: '#c00', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Phone & verification status */}
      <div style={{
        background: 'white', border: '1px solid #e0eaed',
        borderRadius: 16, padding: '20px 22px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#7890a0', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
            Registered phone
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#153e67', letterSpacing: 2 }}>
            {prefs?.masked_phone ?? maskPhone(user?.phone_number)}
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 900,
          ...(prefs?.phone_verified
            ? { background: '#e5f8eb', color: '#238650' }
            : { background: '#fff7dc', color: '#a77818' }),
        }}>
          {prefs?.phone_verified ? '✓ Verified' : '⚠ Not verified'}
        </span>
      </div>

      {/* Master consent toggle */}
      <div style={{
        background: 'white', border: '1px solid #e0eaed',
        borderRadius: 16, padding: '20px 22px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, color: '#153e67', marginBottom: 4 }}>
              Receive WhatsApp notifications
            </div>
            <div style={{ fontSize: 12, color: '#688097', lineHeight: 1.5 }}>
              Allow GamifiEd to send updates to your registered phone number.
            </div>
          </div>
          {/* Toggle switch */}
          <button
            role="switch"
            aria-label="Receive WhatsApp notifications"
            aria-checked={consentOn}
            onClick={toggleConsent}
            style={{
              width: 52, height: 28, borderRadius: 999, border: 'none',
              cursor: 'pointer', flexShrink: 0, padding: 3,
              background: consentOn ? '#12a99f' : '#d2dce0',
              transition: 'background 0.2s',
              display: 'flex', alignItems: 'center',
              justifyContent: consentOn ? 'flex-end' : 'flex-start',
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              display: 'block',
            }} />
          </button>
        </div>
      </div>

      {/* Per-category toggles — only visible when consent is on */}
      <div style={{
        background: 'white', border: '1px solid #e0eaed',
        borderRadius: 16, padding: '20px 22px', marginBottom: 24,
        opacity: consentOn ? 1 : 0.45,
        pointerEvents: consentOn ? 'auto' : 'none',
        transition: 'opacity 0.2s',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: '#7890a0',
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16,
        }}>
          Notification categories
        </div>

        {!consentOn && (
          <p style={{ fontSize: 12, color: '#a0b0ba', marginBottom: 12 }}>
            Enable WhatsApp notifications above to manage individual categories.
          </p>
        )}

        <div style={{ display: 'grid', gap: 2 }}>
          {CATEGORIES.map(({ key, label, desc }, idx) => (
            <label
              key={key}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, padding: '12px 0',
                borderBottom: idx < CATEGORIES.length - 1 ? '1px solid #edf2f3' : 'none',
                cursor: consentOn ? 'pointer' : 'default',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#153e67', marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: '#688097' }}>{desc}</div>
              </div>
              {/* Toggle switch */}
              <button
                role="switch"
                aria-checked={form?.categories?.[key] ?? true}
                onClick={consentOn ? () => toggleCategory(key) : undefined}
                disabled={!consentOn}
                style={{
                  width: 44, height: 24, borderRadius: 999, border: 'none',
                  cursor: consentOn ? 'pointer' : 'not-allowed', flexShrink: 0, padding: 2,
                  background: (form?.categories?.[key] ?? true) ? '#12a99f' : '#d2dce0',
                  transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center',
                  justifyContent: (form?.categories?.[key] ?? true) ? 'flex-end' : 'flex-start',
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  display: 'block',
                }} />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '12px 28px',
          background: saving ? '#a0cbc8' : 'linear-gradient(100deg, #19b7a7, #079c98)',
          color: 'white', border: 'none', borderRadius: 999,
          fontWeight: 900, fontSize: 14,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </>
  );
}
