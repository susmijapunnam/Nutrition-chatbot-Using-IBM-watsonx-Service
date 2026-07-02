/* ============================================================
   dashboard.js — Dashboard page logic
   ============================================================ */

// ── Load profile stats ────────────────────────────────────────
const profile = JSON.parse(localStorage.getItem('nb-profile') || 'null');

async function loadDashboardStats() {
  if (!profile || !profile.weight || !profile.height) return;

  try {
    const res = await fetch('/api/bmi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_kg: parseFloat(profile.weight),
        height_cm: parseFloat(profile.height),
        age:       parseInt(profile.age) || 30,
        gender:    profile.gender || 'male',
        activity:  'moderately_active',
        goal:      profile.goal || 'maintain',
      }),
    });
    const data = await res.json();
    if (data.bmi) {
      document.getElementById('dashBMI').textContent = data.bmi.bmi;
    }
    if (data.tdee) {
      document.getElementById('dashCalories').textContent = data.tdee.target_calories;
      document.getElementById('dashProtein').textContent  = data.tdee.macros.protein_g + 'g';
      drawMacroChart(data.tdee.macros);
    }
  } catch(_) {}
}

loadDashboardStats();

// ── Macro donut chart ─────────────────────────────────────────
function drawMacroChart(macros) {
  const canvas = document.getElementById('macroChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = macros.protein_g * 4 + macros.carbs_g * 4 + macros.fat_g * 9;
  const slices = [
    { label: 'Protein', kcal: macros.protein_g * 4, color: '#3b82d4' },
    { label: 'Carbs',   kcal: macros.carbs_g   * 4, color: '#f59e0b' },
    { label: 'Fat',     kcal: macros.fat_g      * 9, color: '#ef4444' },
  ];
  let start = -Math.PI / 2;
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const R = 90, r = 55;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  slices.forEach(s => {
    const angle = (s.kcal / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    start += angle;
  });

  // centre hole
  const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = isDark ? '#161b22' : '#ffffff';
  ctx.fill();

  // centre text
  ctx.fillStyle = isDark ? '#e6edf3' : '#1f2328';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total + ' kcal', cx, cy);

  const note = document.getElementById('macroNote');
  if (note) {
    note.innerHTML = `<strong>${macros.protein_g}g</strong> protein · 
                      <strong>${macros.carbs_g}g</strong> carbs · 
                      <strong>${macros.fat_g}g</strong> fat`;
  }
}

// ── Quick BMI ─────────────────────────────────────────────────
document.getElementById('quickBMIBtn')?.addEventListener('click', async () => {
  const w = parseFloat(document.getElementById('quickWeight').value);
  const h = parseFloat(document.getElementById('quickHeight').value);
  if (!w || !h) { alert('Enter weight and height'); return; }

  const res  = await fetch('/api/bmi', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ weight_kg: w, height_cm: h, age: 30, gender: 'male',
                           activity: 'moderately_active', goal: 'maintain' }),
  });
  const data = await res.json();
  if (!data.bmi) return;

  document.getElementById('quickBMIResult').classList.remove('d-none');
  document.getElementById('bmiVal').textContent      = data.bmi.bmi;
  document.getElementById('bmiCategory').textContent = data.bmi.category;
  document.getElementById('bmiCategory').className   = `badge bg-${data.bmi.color}`;

  // progress bar (BMI 10–40 range → 0–100%)
  const pct = Math.min(100, Math.max(0, ((data.bmi.bmi - 10) / 30) * 100));
  document.getElementById('bmiProgress').style.width      = pct + '%';
  document.getElementById('bmiProgress').className        = `progress-bar bg-${data.bmi.color}`;
});

// ── Calorie estimator ─────────────────────────────────────────
document.getElementById('estimateBtn')?.addEventListener('click', async () => {
  const food = document.getElementById('foodInput').value.trim();
  const qty  = parseFloat(document.getElementById('qtyInput').value) || 100;
  if (!food) { alert('Enter a food name'); return; }

  const res  = document.getElementById('estimateResult');
  res.classList.remove('d-none');
  res.innerHTML = '<div class="ai-spinner mx-auto" style="width:24px;height:24px;border-width:3px"></div>';

  const r    = await fetch('/api/calorie-estimate', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ food, quantity_g: qty }),
  });
  const data = await r.json();

  if (data.source === 'local') {
    const e = data.estimate;
    res.innerHTML = `
      <div class="fw-semibold text-primary mb-1">${e.quantity_g}g of ${e.food}</div>
      <div class="fs-5 fw-bold">${e.calories_kcal} kcal</div>
      <small class="text-muted">${e.note}</small>`;
  } else {
    res.innerHTML = `<div>${renderMarkdown(data.estimate)}</div>`;
  }
});

// ── Water tracker ─────────────────────────────────────────────
const TOTAL_GLASSES = 8;
let glassCount = parseInt(localStorage.getItem('nb-water') || '0');

function renderWaterGlasses() {
  const container = document.getElementById('waterGlasses');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < TOTAL_GLASSES; i++) {
    const btn = document.createElement('button');
    btn.className = `water-glass-btn${i < glassCount ? ' filled' : ''}`;
    btn.title = `Glass ${i+1}`;
    btn.innerHTML = '<i class="bi bi-cup-straw"></i>';
    btn.addEventListener('click', () => {
      glassCount = (i < glassCount) ? i : i + 1;
      localStorage.setItem('nb-water', glassCount);
      renderWaterGlasses();
      updateWaterCircle();
    });
    container.appendChild(btn);
  }
  document.getElementById('waterText').textContent = `${glassCount} / ${TOTAL_GLASSES}`;
}

function updateWaterCircle() {
  const arc = document.getElementById('waterCircle');
  if (!arc) return;
  const circ = 283;
  const offset = circ - (glassCount / TOTAL_GLASSES) * circ;
  arc.style.strokeDashoffset = offset;
  arc.style.transition = 'stroke-dashoffset .4s ease';
}

document.getElementById('resetWaterBtn')?.addEventListener('click', () => {
  glassCount = 0;
  localStorage.setItem('nb-water', 0);
  renderWaterGlasses();
  updateWaterCircle();
});

renderWaterGlasses();
updateWaterCircle();

// ── Daily tips ────────────────────────────────────────────────
const TIPS = [
  "🥗 Eat a rainbow! Different coloured vegetables provide different micronutrients.",
  "💧 Drink a glass of water 30 minutes before meals to improve digestion and reduce overeating.",
  "🌾 Switch to whole-grain roti or brown rice to increase fibre intake.",
  "🥚 Include a protein source (eggs, dal, paneer) in every meal to stay satiated longer.",
  "🍽️ Use smaller plates — it can help reduce portion sizes naturally.",
  "🏃 Even a 30-minute daily walk can significantly improve metabolic health.",
  "🥦 Steam vegetables instead of frying to retain nutrients and reduce calories.",
  "☕ Limit sugary drinks. Replace with buttermilk, lemon water, or herbal teas.",
  "🧘 Eating slowly and mindfully helps with digestion and prevents overeating.",
  "🌙 Avoid heavy meals 2–3 hours before bedtime for better sleep and digestion.",
  "🥜 A small handful of nuts daily provides healthy fats, protein, and minerals.",
  "🍌 Potassium-rich foods (banana, coconut water) help regulate blood pressure.",
  "🧅 Onions and garlic contain prebiotic fibres that support gut health.",
  "🫚 Use ghee in small amounts — it contains butyrate which supports gut health.",
  "🫘 Sprouted dal and legumes have higher protein and B-vitamin bioavailability.",
];

let tipIdx = parseInt(localStorage.getItem('nb-tipIdx') || '0') % TIPS.length;

function showTip(idx) {
  const el = document.getElementById('dailyTip');
  if (!el) return;
  el.style.opacity = 0;
  setTimeout(() => {
    el.textContent = TIPS[idx];
    el.style.opacity = 1;
    el.style.transition = 'opacity .3s';
  }, 150);
}

document.getElementById('newTipBtn')?.addEventListener('click', () => {
  tipIdx = (tipIdx + 1) % TIPS.length;
  localStorage.setItem('nb-tipIdx', tipIdx);
  showTip(tipIdx);
});

showTip(tipIdx);
