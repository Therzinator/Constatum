// ============================================================
// UUID
// ============================================================
export function generateId() {
  return 'DL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2,5).toUpperCase();
}

// ── Grootte hulpfuncties ──────────────────────────────────────
export function byteSize(str) {
  return new Blob([str]).size;
}

// Anonieme, deterministische code per melder-e-mail (voor weergave zonder PII)
export function melderCode(email) {
  if (!email) return 'Melder#??????';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // geen 0/O/1/I verwarring
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  let code = '';
  let h = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += chars[h % chars.length];
    h = Math.floor(h / chars.length) + email.charCodeAt(i % email.length);
  }
  return `Melder#${code}`;
}
