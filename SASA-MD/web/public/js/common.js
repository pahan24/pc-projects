// ── Common JS utilities for SASA MD Web ────────────

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function requireAuth() {
  if (!localStorage.getItem('sasa_token')) window.location.href = '/login';
}

async function authFetch(url, method = 'GET', body = null) {
  const token = localStorage.getItem('sasa_token');
  const opts  = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res  = await fetch(url, opts);
    if (res.status === 401) { localStorage.removeItem('sasa_token'); window.location.href = '/login'; return null; }
    return await res.json();
  } catch(e) {
    toast(e.message, 'error');
    return null;
  }
}

function formatTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
