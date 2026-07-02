/* ============================================================
   family.js — Family Profiles page
   ============================================================ */

// ── Family state (stored in localStorage) ────────────────────
let family = [];

// Seed from pre-built HTML cards
function seedFromDOM() {
  document.querySelectorAll('.family-member-col').forEach(col => {
    try {
      family.push(JSON.parse(col.dataset.member));
    } catch(_) {}
  });
}
seedFromDOM();

// ── View member stats modal ───────────────────────────────────
document.addEventListener('click', async e => {
  const btn = e.target.closest('.view-member-btn');
  if (!btn) return;

  const col    = btn.closest('.family-member-col');
  let member;
  try { member = JSON.parse(col.dataset.member); } catch(_) { return; }

  const modal  = new bootstrap.Modal(document.getElementById('memberStatsModal'));
  const title  = document.getElementById('memberStatsTitle');
  const body   = document.getElementById('memberStatsBody');
  title.textContent = `${member.name}'s Nutrition Stats`;
  body.innerHTML    = '<div class="text-center py-3"><div class="ai-spinner mx-auto"></div></div>';
  modal.show();

  try {
    const res  = await fetch('/api/bmi', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_kg: parseFloat(member.weight_kg),
        height_cm: parseFloat(member.height_cm),
        age:       parseInt(member.age),
        gender:    member.gender || 'male',
        activity:  member.activity || 'moderately_active',
        goal:      member.goal || 'maintain',
      }),
    });
    const data = await res.json();
    const b    = data.bmi;
    const t    = data.tdee;

    body.innerHTML = `
      <div class="row g-3">
        <div class="col-6 col-md-3 text-center">
          <div class="fs-3 fw-bold text-${b.color}">${b.bmi}</div>
          <small class="text-muted">BMI</small><br>
          <span class="badge bg-${b.color}">${b.category}</span>
        </div>
        <div class="col-6 col-md-3 text-center">
          <div class="fs-3 fw-bold text-warning">${t.target_calories.toLocaleString()}</div>
          <small class="text-muted">Target kcal/day</small>
        </div>
        <div class="col-6 col-md-3 text-center">
          <div class="fs-3 fw-bold text-primary">${t.macros.protein_g}g</div>
          <small class="text-muted">Protein/day</small>
        </div>
        <div class="col-6 col-md-3 text-center">
          <div class="fs-3 fw-bold text-success">${t.macros.carbs_g}g</div>
          <small class="text-muted">Carbs/day</small>
        </div>
        <div class="col-12">
          <div class="alert alert-${b.color} py-2 mb-0 small"><strong>Advice:</strong> ${b.advice}</div>
        </div>
        <div class="col-12">
          <div class="small text-muted"><strong>Goal:</strong> ${t.goal_label} &nbsp;|&nbsp; 
          <strong>Activity:</strong> ${t.activity_label}</div>
        </div>
      </div>`;
  } catch(err) {
    body.innerHTML = '<div class="text-danger">Error loading stats.</div>';
  }
});

// ── Remove member ─────────────────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.remove-member-btn');
  if (!btn) return;
  const col = btn.closest('.family-member-col');
  if (confirm('Remove this family member?')) {
    col.remove();
    const name = JSON.parse(col.dataset.member).name;
    family = family.filter(m => m.name !== name);
  }
});

// ── Add member ─────────────────────────────────────────────────
document.getElementById('addMemberBtn')?.addEventListener('click', () => {
  const name     = document.getElementById('memName').value.trim();
  const age      = document.getElementById('memAge').value;
  const gender   = document.getElementById('memGender').value;
  const weight   = document.getElementById('memWeight').value;
  const height   = document.getElementById('memHeight').value;
  const activity = document.getElementById('memActivity').value;
  const goal     = document.getElementById('memGoal').value;

  if (!name || !age || !weight || !height) {
    alert('Please fill in all required fields.');
    return;
  }

  const member = { name, age, gender, weight_kg: weight, height_cm: height, activity, goal };
  family.push(member);

  const goalLabels = { maintain: 'Maintain Weight', lose: 'Lose Weight', gain: 'Gain Muscle' };
  const goalColors = { maintain: 'success', lose: 'danger', gain: 'primary' };

  const avatarClass = parseInt(age) <= 12 ? 'child' :
                      parseInt(age) <= 18 ? 'teen' :
                      parseInt(age) >= 60 ? 'senior' :
                      gender === 'female'  ? 'female' : 'male';

  const col  = document.createElement('div');
  col.className = 'col-sm-6 col-lg-4 col-xl-3 family-member-col fade-in';
  col.dataset.member = JSON.stringify(member);
  col.innerHTML = `
    <div class="family-card card border-0 h-100">
      <div class="card-body text-center py-4">
        <div class="family-avatar ${avatarClass} mx-auto mb-3">
          <i class="bi bi-person-fill fs-3"></i>
        </div>
        <h6 class="fw-bold mb-0">${name}</h6>
        <small class="text-muted">${age} yrs · ${gender}</small>
        <div class="mt-3 d-flex justify-content-center gap-2">
          <span class="badge bg-warning-soft text-warning">${weight} kg</span>
          <span class="badge bg-info-soft text-info">${height} cm</span>
        </div>
        <div class="mt-3">
          <span class="badge bg-${goalColors[goal]}-soft text-${goalColors[goal]} member-goal">
            ${goalLabels[goal]}
          </span>
        </div>
      </div>
      <div class="card-footer bg-transparent border-0 pb-3 text-center">
        <button class="btn btn-sm btn-outline-primary me-1 view-member-btn">
          <i class="bi bi-eye me-1"></i>View Stats
        </button>
        <button class="btn btn-sm btn-outline-danger remove-member-btn">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>`;

  // Insert before the "Add member" card
  const addCard = document.querySelector('.add-member-card');
  addCard?.parentElement?.insertBefore(col, addCard.parentElement.lastElementChild);

  // Reset form & close modal
  document.getElementById('addMemberForm').reset();
  bootstrap.Modal.getInstance(document.getElementById('addMemberModal'))?.hide();
});

// ── Family AI advice ──────────────────────────────────────────
document.getElementById('getFamilyAdviceBtn')?.addEventListener('click', async () => {
  if (family.length === 0) {
    alert('No family members found. Please add members first.');
    return;
  }

  const spinner = document.getElementById('familyAdviceSpinner');
  const content = document.getElementById('familyAdviceContent');
  spinner.classList.remove('d-none');
  content.innerHTML = '';

  try {
    const res  = await fetch('/api/family', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: family }),
    });
    const data = await res.json();
    spinner.classList.add('d-none');
    if (data.ai_tip) {
      content.innerHTML = renderMarkdown(data.ai_tip);
      content.classList.add('fade-in');
    }
  } catch(err) {
    spinner.classList.add('d-none');
    content.textContent = 'Error fetching advice. Please try again.';
  }
});
