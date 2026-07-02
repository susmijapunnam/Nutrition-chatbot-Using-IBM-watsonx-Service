/* ============================================================
   app.js — Shared utilities (dark mode, status, navbar)
   ============================================================ */

// ── Dark mode toggle ─────────────────────────────────────────
(function initDarkMode() {
  const html      = document.documentElement;
  const btn       = document.getElementById('darkModeToggle');
  const icon      = document.getElementById('darkIcon');
  const saved     = localStorage.getItem('nb-theme') || 'light';

  function applyTheme(theme) {
    html.setAttribute('data-bs-theme', theme);
    localStorage.setItem('nb-theme', theme);
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    }
  }

  applyTheme(saved);

  if (btn) {
    btn.addEventListener('click', () => {
      const current = html.getAttribute('data-bs-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
})();

// ── Status badge ─────────────────────────────────────────────
(function checkStatus() {
  const badge = document.getElementById('statusBadge');
  if (!badge) return;

  fetch('/api/status')
    .then(r => r.json())
    .then(data => {
      const dot  = badge.querySelector('.status-dot');
      const text = badge.querySelector('small');
      if (data.demo_mode) {
        dot.className    = 'status-dot offline';
        text.textContent = 'Demo mode — no API key';
      } else {
        dot.className    = 'status-dot online';
        // show only short model name e.g. "granite-3-1-8b-base"
        const shortModel = data.model_id.split('/').pop();
        text.textContent = `Live · ${shortModel}`;
        text.title       = data.model_id;   // full name on hover
      }
    })
    .catch(() => {
      const dot  = badge.querySelector('.status-dot');
      const text = badge.querySelector('small');
      if (dot)  dot.className  = 'status-dot offline';
      if (text) text.textContent = 'Server error';
    });
})();

// ── Markdown-lite renderer ────────────────────────────────────
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code>$1</code>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<h6 class="fw-bold mt-3 mb-1 text-primary">$1</h6>')
    .replace(/^[\-\*]\s+(.+)$/gm,  '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul class="mb-2">$1</ul>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/\n{2,}/g,         '<br><br>')
    .replace(/\n/g,             '<br>');
}

window.renderMarkdown = renderMarkdown;
