import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

/* ─── WhatsApp Helper ────────────────────────────────────
   Builds a wa.me deep-link with a pre-written message.
   Opens WhatsApp Web or the phone app — worker taps Send.
──────────────────────────────────────────────────────── */
function buildWhatsAppURL(phone, customerName) {
  // Normalise to E.164 for India (+91) — strips leading 0, adds country code
  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('91') && digits.length === 12
    ? digits
    : '91' + digits.slice(-10);

  const message =
    `Dear ${customerName},

` +
    `We have reviewed your PAN card application at *Lakshmi Tax Consultancy* ` +
    `and found an issue with one or more of your submitted certificates.

` +
    `Please contact our office at your earliest convenience to verify and ` +
    `resubmit the correct documents. We apologise for the inconvenience and ` +
    `will process your application as soon as the issue is resolved.

` +
    `Thank you,
` +
    `Lakshmi Tax Consultancy`;

  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

/* ─── Auth ─────────────────────────────────────────────
   Password is set via REACT_APP_APP_PASSWORD in .env
   Falls back to "ltc2024" if not set.
   Session is kept in sessionStorage — closes when the
   browser tab is closed, so workers must log in each session.
──────────────────────────────────────────────────────── */
const APP_PASSWORD = process.env.REACT_APP_APP_PASSWORD || 'ltc2024';
const SESSION_KEY  = 'ltc_auth';

function LoginScreen({ onSuccess }) {
  const [pw, setPw]         = useState('');
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState('');
  const [shake, setShake]   = useState(false);

  function attempt() {
    if (pw === APP_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPw('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  function onKey(e) { if (e.key === 'Enter') attempt(); }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        .shake { animation: shake 0.45s ease; }
        .login-input:focus { border-color: var(--blue-600) !important; outline: none; }
      `}</style>

      <div style={{ width: 380, maxWidth: '92vw' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, background: 'var(--blue-600)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <i className="ti ti-receipt-tax" style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--blue-900)' }}>
            Lakshmi Tax Consultancy
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            PAN Card Services Portal
          </div>
        </div>

        {/* Card */}
        <div className={shake ? 'shake' : ''} style={{
          background: '#fff', border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '28px 28px 24px',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--blue-900)', marginBottom: 4 }}>
            Staff login
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            Enter the office password to continue.
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--blue-800)', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input
              className="login-input"
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => { setPw(e.target.value); setError(''); }}
              onKeyDown={onKey}
              placeholder="Enter password"
              autoFocus
              style={{
                width: '100%', padding: '9px 38px 9px 12px',
                border: `1.5px solid ${error ? 'var(--red-600)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)', fontSize: 14,
                background: '#fff', color: 'var(--text)', fontFamily: 'var(--font)',
              }}
            />
            <button
              onClick={() => setShow(s => !s)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 0, fontSize: 16,
              }}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              <i className={`ti ${show ? 'ti-eye-off' : 'ti-eye'}`} />
            </button>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--red-600)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 13 }} />{error}
            </div>
          )}

          <button
            onClick={attempt}
            style={{
              ...btnPrimary, width: '100%', justifyContent: 'center',
              padding: '10px', fontSize: 14, marginTop: error ? 0 : 12,
            }}
          >
            <i className="ti ti-login" style={{ fontSize: 15 }} />
            Sign in
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 16 }}>
          For access issues, contact your office administrator.
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${dd} ${mo[+m - 1]} ${y}`;
}
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function daysSince(d) {
  if (!d) return 0;
  return Math.round((new Date() - new Date(d)) / 864e5);
}
function ageChip(d) {
  const n = daysSince(d);
  if (n === 0) return { label: 'Today', cls: 'chip-green' };
  if (n < 7)   return { label: `${n}d`, cls: 'chip-green' };
  if (n < 14)  return { label: `${n}d`, cls: 'chip-amber' };
  return { label: `${n}d`, cls: 'chip-red' };
}
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
const AVATAR_COLORS = [
  ['#E6F1FB','#0C447C'],['#EAF3DE','#27500A'],['#FAEEDA','#633806'],
  ['#E1F5EE','#085041'],['#FCEBEB','#791F1F'],['#EEEDFE','#3C3489'],
];
function avatarColor(name) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

/* ─── Sub-components ──────────────────────────────────── */
function Toast({ msg, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: type === 'error' ? 'var(--red-600)' : 'var(--blue-900)',
      color: '#fff', padding: '10px 18px', borderRadius: 'var(--radius-md)',
      fontSize: 13, fontWeight: 500, maxWidth: 320,
      animation: 'slideUp 0.2s ease both',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <i className={`ti ${type === 'error' ? 'ti-alert-circle' : 'ti-check'}`} style={{ fontSize: 15 }} />
      {msg}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    pending:   { cls: 'b-pending',   icon: 'ti-clock',       label: 'Pending' },
    error:     { cls: 'b-error',     icon: 'ti-alert-triangle', label: 'Error' },
    completed: { cls: 'b-completed', icon: 'ti-circle-check', label: 'Completed' },
    allotted:  { cls: 'b-allotted',  icon: 'ti-id-badge-2',  label: 'Allotted' },
  };
  const { cls, icon, label } = map[status] || map.pending;
  return (
    <span className={`badge ${cls}`}>
      <i className={`ti ${icon}`} style={{ fontSize: 11 }} />
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: 'var(--blue-400)' }}>
      <i className="ti ti-loader" style={{ fontSize: 28, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--blue-200)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 36, display: 'block', marginBottom: 10 }} />
      <p style={{ fontSize: 13, color: 'var(--blue-400)' }}>{text}</p>
    </div>
  );
}

function NoteBox({ type, icon, children }) {
  const styles = {
    info:  { bg: 'var(--blue-50)',  color: 'var(--blue-800)' },
    warn:  { bg: 'var(--red-50)',   color: 'var(--red-600)' },
    teal:  { bg: 'var(--teal-50)',  color: 'var(--teal-800)' },
    amber: { bg: 'var(--amber-50)', color: 'var(--amber-600)' },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{
      background: s.bg, color: s.color, borderRadius: 'var(--radius-md)',
      padding: '10px 12px', fontSize: 12, display: 'flex',
      alignItems: 'flex-start', gap: 8, lineHeight: 1.5, marginTop: 8,
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

/* ─── Modal ───────────────────────────────────────────── */
function Modal({ title, icon, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(2,28,68,0.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 60, zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="slide-up" style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--border)', padding: 24,
        width: 440, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, color: 'var(--blue-900)', fontWeight: 500, fontSize: 15 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 17, color: 'var(--blue-600)' }} />
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function FormRow({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--blue-800)', marginBottom: 5, fontWeight: 500 }}>
        {label} {required && <span style={{ color: 'var(--red-600)' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function FormActions({ onCancel, onSave, saveLabel = 'Save', loading }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
      <button onClick={onCancel} style={btnCancel}>Cancel</button>
      <button onClick={onSave} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
        {loading ? <><i className="ti ti-loader" style={{ fontSize: 13, marginRight: 4 }} />Saving…</> : saveLabel}
      </button>
    </div>
  );
}

/* ─── Button styles ───────────────────────────────────── */
const btnPrimary = {
  padding: '7px 18px', borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--blue-600)', color: '#fff', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const btnCancel = {
  padding: '7px 18px', borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--border)', background: '#fff',
  fontSize: 13, color: 'var(--blue-800)', cursor: 'pointer',
};
const btnDanger = {
  padding: '7px 18px', borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--red-600)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-md)', fontSize: 13, background: '#fff',
  color: 'var(--text)', outline: 'none', fontFamily: 'var(--font)',
};
const selectStyle = { ...inputStyle };

/* ─── Add Customer Modal ──────────────────────────────── */
function AddModal({ onClose, onSaved, showToast }) {
  const [form, setForm] = useState({ name: '', date: todayStr(), phone: '', email: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name || !form.date || !form.phone || !form.email) {
      showToast('Please fill in all fields.', 'error'); return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      showToast('Phone must be exactly 10 digits.', 'error'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      showToast('Please enter a valid email address.', 'error'); return;
    }
    setLoading(true);
    const { error } = await supabase.from('pan_records').insert([{
      name: form.name.trim(),
      date: form.date,
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      status: 'pending',
    }]);
    setLoading(false);
    if (error) { showToast('Failed to add customer. Try again.', 'error'); return; }
    showToast(`${form.name} added — status: Pending.`);
    onSaved();
  }

  return (
    <Modal title="Add new customer" icon="ti-user-plus" onClose={onClose}>
      <FormRow label="Full name" required>
        <input style={inputStyle} placeholder="e.g. Priya Venkatesh" value={form.name} onChange={e => set('name', e.target.value)} />
      </FormRow>
      <FormRow label="Date received" required>
        <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
      </FormRow>
      <FormRow label="Phone number" required hint="10-digit mobile number">
        <input style={inputStyle} placeholder="9876543210" maxLength={10} value={form.phone}
          onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
      </FormRow>
      <FormRow label="Email address" required>
        <input style={inputStyle} type="email" placeholder="customer@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
      </FormRow>
      <NoteBox type="info" icon="ti-info-circle">Status will be set to <strong>Pending</strong> automatically.</NoteBox>
      <FormActions onCancel={onClose} onSave={save} saveLabel="Add customer" loading={loading} />
    </Modal>
  );
}

/* ─── Edit (Dashboard) Modal ──────────────────────────── */
function EditModal({ record, onClose, onSaved, showToast }) {
  const [status, setStatus]   = useState(record.status);
  const [ackCode, setAckCode] = useState(record.ack_code || '');
  const [loading, setLoading] = useState(false);
  const [waSent, setWaSent]   = useState(false);

  const isNewError = status === 'error' && record.status !== 'error';

  async function save() {
    if (status === 'completed') {
      if (!/^\d{15}$/.test(ackCode)) {
        showToast('Acknowledgement code must be exactly 15 digits.', 'error'); return;
      }
    }
    setLoading(true);
    const updates = { status };
    if (status === 'completed') {
      updates.ack_code = ackCode;
      updates.completed_at = todayStr();
    }
    if (status !== 'completed' && record.status === 'completed') {
      updates.ack_code = null;
      updates.completed_at = null;
    }
    const { error } = await supabase.from('pan_records').update(updates).eq('id', record.id);
    setLoading(false);
    if (error) { showToast('Update failed. Try again.', 'error'); return; }

    if (status === 'completed') {
      showToast('Marked as completed. Acknowledgement code saved.');
    } else if (status === 'error' && record.status !== 'error') {
      showToast('Status set to Error. Send the customer a WhatsApp message.');
    } else {
      showToast('Status updated successfully.');
    }
    onSaved();
  }

  function openWhatsApp() {
    const url = buildWhatsAppURL(record.phone, record.name);
    window.open(url, '_blank', 'noopener,noreferrer');
    setWaSent(true);
  }

  return (
    <Modal title={`Update — ${record.name}`} icon="ti-edit" onClose={onClose}>
      {/* Customer info strip */}
      <div style={{ background: 'var(--blue-50)', borderRadius: 'var(--radius-md)', padding: '9px 12px', marginBottom: 14, fontSize: 12, color: 'var(--blue-800)' }}>
        <i className="ti ti-phone" style={{ fontSize: 12, marginRight: 4 }} />{record.phone}
        &nbsp;&nbsp;·&nbsp;&nbsp;
        <i className="ti ti-mail" style={{ fontSize: 12, marginRight: 4 }} />{record.email}
      </div>

      {/* Status flow indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--blue-50)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 14, flexWrap: 'wrap' }}>
        {['pending','error','completed','allotted'].map((s, i, arr) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className={`badge b-${s}`} style={{ fontSize: 11 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
            {i < arr.length - 1 && <i className="ti ti-arrow-right" style={{ fontSize: 11, color: 'var(--blue-400)' }} />}
          </span>
        ))}
      </div>

      <FormRow label="Application status" required>
        <select style={selectStyle} value={status} onChange={e => { setStatus(e.target.value); setWaSent(false); }}>
          <option value="pending">Pending</option>
          <option value="error">Error — certificate issue</option>
          <option value="completed">Completed</option>
        </select>
      </FormRow>

      {status === 'completed' && (
        <FormRow label="Acknowledgement code" required hint="Exactly 15 digits.">
          <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} maxLength={15} placeholder="e.g. 785234821937650"
            value={ackCode} onChange={e => setAckCode(e.target.value.replace(/\D/g, '').slice(0, 15))} />
        </FormRow>
      )}

      {/* WhatsApp + Email notification section — shown when changing TO error */}
      {isNewError && (
        <div style={{ marginTop: 12, border: '1.5px solid #C3EDD0', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#E8FBF0', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#075E54', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-brand-whatsapp" style={{ fontSize: 14 }} aria-hidden="true" />
            Notify customer about certificate error
          </div>

          {/* Message preview */}
          <div style={{ background: '#F7FFF9', padding: '10px 12px', borderBottom: '1px solid #C3EDD0' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Message preview</div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6, fontStyle: 'italic', background: '#fff', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd' }}>
              Dear <strong>{record.name}</strong>, we have reviewed your PAN card application at <strong>Lakshmi Tax Consultancy</strong> and found an issue with one or more of your submitted certificates. Please contact our office at your earliest convenience to verify and resubmit the correct documents…
            </div>
          </div>

          {/* Send button */}
          <div style={{ padding: '10px 12px', background: '#F7FFF9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={openWhatsApp}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none',
                background: waSent ? '#128C7E' : '#25D366',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s',
              }}
            >
              <i className="ti ti-brand-whatsapp" style={{ fontSize: 16 }} aria-hidden="true" />
              {waSent ? 'Opened — send it on WhatsApp' : 'Open WhatsApp to send'}
            </button>
            {waSent && (
              <span style={{ fontSize: 12, color: '#128C7E', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-check" style={{ fontSize: 13 }} />
                WhatsApp opened
              </span>
            )}
          </div>

        </div>
      )}

      {/* For records already in error state — just show reminder */}
      {status === 'error' && record.status === 'error' && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button
            onClick={openWhatsApp}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-md)',
              border: '1.5px solid #25D366', background: '#fff',
              color: '#075E54', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <i className="ti ti-brand-whatsapp" style={{ fontSize: 14 }} aria-hidden="true" />
            Resend WhatsApp
          </button>
          {waSent && <span style={{ fontSize: 12, color: '#128C7E', display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'center' }}><i className="ti ti-check" style={{ fontSize: 13 }} />Opened</span>}
        </div>
      )}

      <FormActions onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

/* ─── Edit Completed Modal ────────────────────────────── */
function CompletedEditModal({ record, onClose, onSaved, showToast }) {
  const [action, setAction] = useState('allotted');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    let updates = { status: action };
    if (action === 'allotted') {
      updates.allotted_at = todayStr();
    } else {
      updates.ack_code = null;
      updates.completed_at = null;
    }
    const { error } = await supabase.from('pan_records').update(updates).eq('id', record.id);
    setLoading(false);
    if (error) { showToast('Update failed. Try again.', 'error'); return; }
    if (action === 'allotted') showToast(`PAN card marked as allotted for ${record.name}.`);
    else showToast(`Record moved back to ${action}.`);
    onSaved();
  }

  return (
    <Modal title={`Edit completed — ${record.name}`} icon="ti-edit" onClose={onClose}>
      <div style={{ background: 'var(--blue-50)', borderRadius: 'var(--radius-md)', padding: '9px 12px', marginBottom: 14, fontSize: 12, color: 'var(--blue-800)' }}>
        Ack. code: <span style={{ fontFamily: 'var(--mono)' }}>{record.ack_code}</span>
        &nbsp;&nbsp;·&nbsp;&nbsp;Completed: {fmtDate(record.completed_at)}
      </div>
      <FormRow label="Action" required>
        <select style={selectStyle} value={action} onChange={e => setAction(e.target.value)}>
          <option value="allotted">Mark as Allotted — PAN card issued by govt</option>
          <option value="pending">Move back to Pending — application rejected</option>
          <option value="error">Move back to Error — certificate issue</option>
        </select>
      </FormRow>
      {(action === 'pending' || action === 'error') && (
        <NoteBox type="amber" icon="ti-alert-triangle">
          The acknowledgement code will be cleared and this record will return to the dashboard.
        </NoteBox>
      )}
      <FormActions onCancel={onClose} onSave={save} loading={loading} />
    </Modal>
  );
}

/* ─── Delete Allotted Modal ───────────────────────────── */
function DeleteModal({ record, onClose, onSaved, showToast }) {
  const [loading, setLoading] = useState(false);

  async function doDelete() {
    setLoading(true);
    const { error } = await supabase.from('pan_records').delete().eq('id', record.id);
    setLoading(false);
    if (error) { showToast('Delete failed. Try again.', 'error'); return; }
    showToast(`Record for ${record.name} cleared.`);
    onSaved();
  }

  return (
    <Modal title={`Clear record — ${record.name}`} icon="ti-trash" onClose={onClose}>
      <NoteBox type="warn" icon="ti-alert-triangle">
        This permanently deletes this record. Only do this after the physical PAN card has been handed over to the customer.
      </NoteBox>
      <div style={{ background: '#f9fbff', border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginTop: 14, fontSize: 13 }}>
        <div style={{ fontWeight: 500 }}>{record.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Allotted: {fmtDate(record.allotted_at)} &nbsp;·&nbsp; Code: <span style={{ fontFamily: 'var(--mono)' }}>{record.ack_code}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={btnCancel}>Cancel</button>
        <button onClick={doDelete} disabled={loading} style={{ ...btnDanger, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Deleting…' : 'Yes, delete record'}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Topbar ──────────────────────────────────────────── */
function Topbar({ page, setPage }) {
  const navItems = [
    { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { id: 'completed', icon: 'ti-circle-check',     label: 'Completed' },
    { id: 'allotted',  icon: 'ti-id-badge-2',       label: 'Allotted' },
  ];
  return (
    <div style={{
      background: 'var(--blue-600)', padding: '0 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 56, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-receipt-tax" style={{ fontSize: 18, color: 'var(--blue-600)' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Lakshmi Tax Consultancy</div>
          <div style={{ fontSize: 11, color: 'var(--blue-200)', lineHeight: 1.2 }}>PAN Card Services Portal</div>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 4 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{
              padding: '6px 13px', borderRadius: 'var(--radius-md)', border: 'none',
              background: page === n.id ? 'rgba(255,255,255,0.18)' : 'transparent',
              color: page === n.id ? '#fff' : 'var(--blue-200)',
              fontSize: 13, fontWeight: page === n.id ? 500 : 400,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <i className={`ti ${n.icon}`} style={{ fontSize: 14 }} />
            {n.label}
          </button>
        ))}
      </nav>
        <button
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); window.location.reload(); }}
          style={{
            marginLeft: 8, padding: '6px 12px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid rgba(255,255,255,0.25)', background: 'transparent',
            color: 'var(--blue-200)', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
          title="Sign out"
        >
          <i className="ti ti-logout" style={{ fontSize: 14 }} />
          Sign out
        </button>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────── */
function StatCard({ label, value, icon, bg, color, onClick, active }) {
  return (
    <div onClick={onClick} style={{
      background: active ? bg : '#fff',
      border: `1.5px solid ${active ? color : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: '14px 16px',
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s',
    }}>
      <div style={{ width: 32, height: 32, background: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

/* ─── Dashboard Page ──────────────────────────────────── */
function Dashboard({ records, loading, onAdd, onEdit, onNavigate }) {
  const [filter, setFilter] = useState('all');
  const pending   = records.filter(r => r.status === 'pending').length;
  const errors    = records.filter(r => r.status === 'error').length;
  const completed = records.filter(r => r.status === 'completed').length;
  const allotted  = records.filter(r => r.status === 'allotted').length;

  let list = records.filter(r => r.status !== 'completed' && r.status !== 'allotted');
  if (filter === 'pending') list = list.filter(r => r.status === 'pending');
  if (filter === 'error')   list = list.filter(r => r.status === 'error');

  function toggleFilter(f) { setFilter(cur => cur === f ? 'all' : f); }

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Pending"   value={pending}   icon="ti-clock"        bg="var(--amber-50)" color="var(--amber-600)" active={filter==='pending'} onClick={() => toggleFilter('pending')} />
        <StatCard label="Errors"    value={errors}    icon="ti-alert-triangle" bg="var(--red-50)"  color="var(--red-600)"  active={filter==='error'}   onClick={() => toggleFilter('error')} />
        <StatCard label="Completed" value={completed} icon="ti-circle-check" bg="var(--blue-50)"  color="var(--blue-600)" onClick={() => onNavigate('completed')} />
        <StatCard label="Allotted"  value={allotted}  icon="ti-id-badge-2"   bg="var(--teal-50)"  color="var(--teal-600)" onClick={() => onNavigate('allotted')} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <FilterPill label="All active" active={filter==='all'}     onClick={() => setFilter('all')} />
        <FilterPill label="Pending"    active={filter==='pending'} onClick={() => toggleFilter('pending')} icon="ti-clock" color="amber" />
        <FilterPill label="Errors"     active={filter==='error'}   onClick={() => toggleFilter('error')}   icon="ti-alert-triangle" color="red" />
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onAdd} style={btnPrimary}>
            <i className="ti ti-plus" style={{ fontSize: 15 }} />
            New customer
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState icon="ti-inbox" text="No active records match this filter." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--blue-50)', borderBottom: '1.5px solid var(--border)' }}>
                {['Name','Received','Age','Phone','Status',''].map((h, i) => (
                  <th key={i} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--blue-800)', textTransform: 'uppercase', letterSpacing: '0.04em', width: ['30%','14%','10%','16%','14%','8%'][i] }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const chip = ageChip(r.date);
                const [abg, atxt] = avatarColor(r.name);
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: abg, color: atxt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{initials(r.name)}</div>
                        <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{fmtDate(r.date)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`days-chip ${chip.cls}`}>{chip.label}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--blue-600)', fontWeight: 500 }}>{r.phone}</td>
                    <td style={{ padding: '10px 12px' }}><Badge status={r.status} /></td>
                    <td style={{ padding: '10px 12px' }}>
                      <button className="row-edit-btn" onClick={() => onEdit(r)}>
                        <i className="ti ti-edit" style={{ fontSize: 13 }} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick, icon, color = 'blue' }) {
  const colorMap = {
    blue:  { active: { bg: 'var(--blue-50)',  color: 'var(--blue-800)',  border: 'var(--blue-200)' } },
    amber: { active: { bg: 'var(--amber-50)', color: 'var(--amber-600)', border: 'var(--amber-100)' } },
    red:   { active: { bg: 'var(--red-50)',   color: 'var(--red-600)',   border: 'var(--red-100)' } },
  };
  const s = active ? colorMap[color].active : { bg: '#fff', color: '#555', border: 'var(--border)' };
  return (
    <button onClick={onClick} style={{
      padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${s.border}`,
      background: s.bg, color: s.color, fontSize: 12, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 4, fontWeight: active ? 500 : 400,
    }}>
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 12 }} />}
      {label}
    </button>
  );
}

/* ─── Completed Page ──────────────────────────────────── */
function CompletedPage({ records, loading, onEdit }) {
  const list = records.filter(r => r.status === 'completed');
  return (
    <div className="fade-in">
      <PageHeader icon="ti-circle-check" color="var(--blue-600)" title="Completed applications" count={list.length} countBg="var(--blue-50)" countColor="var(--blue-800)" />
      <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState icon="ti-circle-check" text="No completed applications yet." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--blue-50)', borderBottom: '1.5px solid var(--border)' }}>
                {['Name','Received','Completed on','Age','Ack. code',''].map((h, i) => (
                  <th key={i} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--blue-800)', textTransform: 'uppercase', letterSpacing: '0.04em', width: ['25%','14%','16%','10%','22%','8%'][i] }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const chip = ageChip(r.completed_at);
                const [abg, atxt] = avatarColor(r.name);
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: abg, color: atxt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{initials(r.name)}</div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{fmtDate(r.date)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{fmtDate(r.completed_at)}</td>
                    <td style={{ padding: '10px 12px' }}><span className={`days-chip ${chip.cls}`}>{chip.label}</span></td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--blue-50)', color: 'var(--blue-800)', padding: '3px 8px', borderRadius: 5 }}>{r.ack_code}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button className="row-edit-btn" onClick={() => onEdit(r)}>
                        <i className="ti ti-edit" style={{ fontSize: 13 }} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── Allotted Page ───────────────────────────────────── */
function AllottedPage({ records, loading, onDelete }) {
  const list = records.filter(r => r.status === 'allotted');
  return (
    <div className="fade-in">
      <PageHeader icon="ti-id-badge-2" color="var(--teal-600)" title="Allotted PAN cards" count={list.length} countBg="var(--teal-50)" countColor="var(--teal-800)" />
      <NoteBox type="teal" icon="ti-info-circle">
        Records older than 7 days are automatically removed. Use the Clear button once the physical PAN card has been handed over to the customer.
      </NoteBox>
      <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginTop: 14 }}>
        {loading ? <Spinner /> : list.length === 0 ? (
          <EmptyState icon="ti-id-badge-2" text="No allotted records yet." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--teal-50)', borderBottom: '1.5px solid var(--border)' }}>
                {['Name','Received','Completed','Allotted on','Age','Ack. code',''].map((h, i) => (
                  <th key={i} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--teal-800)', textTransform: 'uppercase', letterSpacing: '0.04em', width: ['20%','12%','13%','13%','9%','20%','8%'][i] }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const chip = ageChip(r.allotted_at);
                const [abg, atxt] = avatarColor(r.name);
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: abg, color: atxt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{initials(r.name)}</div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{fmtDate(r.date)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{fmtDate(r.completed_at)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#555' }}>{fmtDate(r.allotted_at)}</td>
                    <td style={{ padding: '10px 12px' }}><span className={`days-chip ${chip.cls}`}>{chip.label}</span></td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--teal-50)', color: 'var(--teal-800)', padding: '3px 8px', borderRadius: 5 }}>{r.ack_code}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button className="row-edit-btn" style={{ color: 'var(--red-600)', borderColor: 'var(--red-100)' }} onClick={() => onDelete(r)}>
                        <i className="ti ti-trash" style={{ fontSize: 13 }} /> Clear
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PageHeader({ icon, color, title, count, countBg, countColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 20, color }} />
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--blue-900)' }}>{title}</span>
      <span style={{ background: countBg, color: countColor, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}>{count}</span>
    </div>
  );
}

/* ─── App Root ────────────────────────────────────────── */
export default function App() {
  const [authed, setAuthed]   = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [page, setPage]       = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [toast, setToast]     = useState(null);

  // ── All hooks must be declared before any early return (React rules of hooks) ──
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pan_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { showToast('Failed to load records.', 'error'); }
    else {
      const cleaned = await autoCleanAllotted(data);
      setRecords(cleaned);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (!authed) return; // don't fetch if not logged in
    fetchRecords();
    const sub = supabase
      .channel('pan_records_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pan_records' }, fetchRecords)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [fetchRecords, authed]);

  // ── Early return AFTER all hooks ──
  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  async function autoCleanAllotted(data) {
    const toDelete = data.filter(r => r.status === 'allotted' && daysSince(r.allotted_at) >= 7);
    if (toDelete.length > 0) {
      await supabase.from('pan_records').delete().in('id', toDelete.map(r => r.id));
      return data.filter(r => !toDelete.find(d => d.id === r.id));
    }
    return data;
  }

  const closeModal = () => setModal(null);
  const refresh    = () => { closeModal(); fetchRecords(); };

  const navigateTo = (p) => setPage(p);

  return (
    <>
      <style>{`
        .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:500; }
        .b-pending   { background:var(--amber-50); color:var(--amber-600); }
        .b-error     { background:var(--red-50);   color:var(--red-600); }
        .b-completed { background:var(--blue-50);  color:var(--blue-800); }
        .b-allotted  { background:var(--teal-50);  color:var(--teal-800); }
        .days-chip   { display:inline-block; padding:3px 9px; border-radius:10px; font-size:11px; font-weight:500; }
        .chip-green  { background:var(--green-50); color:var(--green-600); }
        .chip-amber  { background:var(--amber-50); color:var(--amber-600); }
        .chip-red    { background:var(--red-50);   color:var(--red-600); }
        .row-edit-btn { padding:4px 10px; border:1.5px solid var(--border); border-radius:6px; background:#fff; cursor:pointer; font-size:12px; color:var(--blue-600); font-family:var(--font); display:inline-flex; align-items:center; gap:4px; }
        .row-edit-btn:hover { background:var(--blue-50); }
        tr:hover td { background:#f5f9ff; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Topbar page={page} setPage={setPage} />

        <div style={{ padding: '20px 22px', maxWidth: 1100, margin: '0 auto' }}>
          {page === 'dashboard' && (
            <Dashboard
              records={records} loading={loading}
              onAdd={() => setModal('add')}
              onEdit={r => setModal({ type: 'edit', record: r })}
              onNavigate={navigateTo}
            />
          )}
          {page === 'completed' && (
            <CompletedPage
              records={records} loading={loading}
              onEdit={r => setModal({ type: 'completed-edit', record: r })}
            />
          )}
          {page === 'allotted' && (
            <AllottedPage
              records={records} loading={loading}
              onDelete={r => setModal({ type: 'delete', record: r })}
            />
          )}
        </div>
      </div>

      {modal === 'add' && <AddModal onClose={closeModal} onSaved={refresh} showToast={showToast} />}
      {modal?.type === 'edit' && <EditModal record={modal.record} onClose={closeModal} onSaved={refresh} showToast={showToast} />}
      {modal?.type === 'completed-edit' && <CompletedEditModal record={modal.record} onClose={closeModal} onSaved={refresh} showToast={showToast} />}
      {modal?.type === 'delete' && <DeleteModal record={modal.record} onClose={closeModal} onSaved={refresh} showToast={showToast} />}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  );
}
