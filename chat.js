/* ============================================================
   chat.js — Chat page logic
   ============================================================ */

const chatMessages    = document.getElementById('chatMessages');
const chatInput       = document.getElementById('chatInput');
const sendBtn         = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const clearChatBtn    = document.getElementById('clearChatBtn');

// ── Profile state ─────────────────────────────────────────────
let userProfile = JSON.parse(localStorage.getItem('nb-profile') || 'null');

function syncProfileUI() {
  const nameEl = document.getElementById('profileName');
  const subEl  = document.getElementById('profileSub');
  if (!userProfile) return;
  if (nameEl) nameEl.textContent = userProfile.name || 'My Profile';
  if (subEl) {
    const parts = [];
    if (userProfile.age)    parts.push(`${userProfile.age} yrs`);
    if (userProfile.gender) parts.push(userProfile.gender);
    if (userProfile.goal)   parts.push(userProfile.goal);
    subEl.textContent = parts.join(' · ') || 'Profile saved';
  }
}

// Pre-fill profile modal
document.getElementById('profileModal')?.addEventListener('show.bs.modal', () => {
  if (!userProfile) return;
  const fields = {
    pName: 'name', pAge: 'age', pGender: 'gender',
    pWeight: 'weight', pHeight: 'height', pGoal: 'goal',
    pDiet: 'diet_type', pAllergies: 'allergies', pMedical: 'medical'
  };
  for (const [id, key] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el && userProfile[key]) el.value = userProfile[key];
  }
});

document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
  userProfile = {
    name:      document.getElementById('pName').value,
    age:       document.getElementById('pAge').value,
    gender:    document.getElementById('pGender').value,
    weight:    document.getElementById('pWeight').value,
    height:    document.getElementById('pHeight').value,
    goal:      document.getElementById('pGoal').value,
    diet_type: document.getElementById('pDiet').value,
    allergies: document.getElementById('pAllergies').value,
    medical:   document.getElementById('pMedical').value,
  };
  localStorage.setItem('nb-profile', JSON.stringify(userProfile));
  syncProfileUI();
});

syncProfileUI();

// ── Append message ─────────────────────────────────────────────
function appendMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${role}`;

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${role === 'user' ? 'user-bubble' : 'assistant-bubble'}`;
  bubble.innerHTML = role === 'assistant' ? renderMarkdown(content) : escapeHtml(content);

  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar-sm me-2';
    avatar.innerHTML = '<i class="bi bi-robot"></i>';
    wrapper.appendChild(avatar);
  }

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Send message ───────────────────────────────────────────────
async function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  appendMessage('user', msg);
  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;

  // Show typing indicator
  typingIndicator.classList.remove('d-none');
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, profile: userProfile }),
    });
    const data = await res.json();
    typingIndicator.classList.add('d-none');
    if (data.reply) appendMessage('assistant', data.reply);
    else appendMessage('assistant', 'Sorry, I could not generate a response. Please try again.');
  } catch (err) {
    typingIndicator.classList.add('d-none');
    appendMessage('assistant', '⚠️ Network error. Please check your connection and try again.');
  } finally {
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

// ── Event listeners ────────────────────────────────────────────
sendBtn?.addEventListener('click', sendMessage);

chatInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
chatInput?.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

// Quick prompt buttons
document.querySelectorAll('.quick-prompt').forEach(btn => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.prompt;
    sendMessage();
  });
});

// Clear chat
clearChatBtn?.addEventListener('click', async () => {
  if (!confirm('Clear chat history?')) return;
  await fetch('/api/clear-history', { method: 'POST' });
  chatMessages.innerHTML = '';
  appendMessage('assistant',
    '🗑️ Chat cleared! Start a new conversation whenever you\'re ready. 😊'
  );
});
