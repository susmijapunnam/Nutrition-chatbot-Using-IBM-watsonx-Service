/* ============================================================
   meal_planner.js — AI Meal Planner page
   ============================================================ */

const generateBtn  = document.getElementById('generatePlanBtn');
const planSpinner  = document.getElementById('planSpinner');
const planContent  = document.getElementById('planContent');
const planHolder   = document.getElementById('planPlaceholder');
const copyBtn      = document.getElementById('copyPlanBtn');
const printBtn     = document.getElementById('printPlanBtn');

generateBtn?.addEventListener('click', async () => {
  const duration = document.querySelector('input[name="duration"]:checked')?.value || '1-day';
  const dietType = document.getElementById('planDiet').value;
  const goal     = document.getElementById('planGoal').value;
  const age      = document.getElementById('planAge').value;
  const gender   = document.getElementById('planGender').value;
  const weight   = document.getElementById('planWeight').value;
  const height   = document.getElementById('planHeight').value;
  const allergies = document.getElementById('planAllergies').value;
  const medical  = document.getElementById('planMedical').value;

  const profile = {
    age, gender, weight, height, goal,
    diet_type: dietType, allergies, medical,
  };

  // Show spinner
  planHolder.classList.add('d-none');
  planContent.classList.add('d-none');
  planSpinner.classList.remove('d-none');
  copyBtn.classList.add('d-none');
  printBtn.classList.add('d-none');
  generateBtn.disabled = true;

  try {
    const res  = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, duration, diet_type: dietType }),
    });
    const data = await res.json();

    planSpinner.classList.add('d-none');
    planContent.classList.remove('d-none');
    planContent.classList.add('fade-in');
    copyBtn.classList.remove('d-none');
    printBtn.classList.remove('d-none');

    if (data.meal_plan) {
      planContent.innerHTML = renderMarkdown(data.meal_plan);
    } else {
      planContent.textContent = 'Could not generate plan. Please try again.';
    }
  } catch (err) {
    planSpinner.classList.add('d-none');
    planHolder.classList.remove('d-none');
    alert('Network error. Please check your connection.');
  } finally {
    generateBtn.disabled = false;
  }
});

// ── Copy to clipboard ─────────────────────────────────────────
copyBtn?.addEventListener('click', () => {
  const text = planContent.innerText;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy';
    }, 2000);
  });
});

// ── Print ─────────────────────────────────────────────────────
printBtn?.addEventListener('click', () => window.print());
