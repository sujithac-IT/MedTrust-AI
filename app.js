/* ============================================================
   MediTrust AI — Interactive Application Logic
   ============================================================ */

/* ── Clock ── */
function updateClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const timeStr = `${h}:${m.toString().padStart(2,'0')} ${ampm}`;
  const el = document.getElementById('clock');
  if (el) el.textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Section Switcher ── */
function showSection(name, btn) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const section = document.getElementById('section-' + name);
  if (section) section.classList.add('active');
  if (btn) btn.classList.add('active');

  // Trigger animations for command center
  if (name === 'command') {
    setTimeout(buildBedGrid, 100);
    setTimeout(animateCommandStats, 200);
  }
  if (name === 'overview') {
    setTimeout(buildJourney, 100);
  }
}

/* ── Phone Screen Switcher ── */
function showScreen(name, btn) {
  document.querySelectorAll('.ps').forEach(s => {
    if (!s.closest('#section-womens')) s.classList.remove('active');
  });
  document.querySelectorAll('.sni').forEach(n => {
    if (!n.closest('#section-womens')) n.classList.remove('active');
  });
  const screen = document.getElementById('screen-' + name);
  if (screen) screen.classList.add('active');
  if (btn) btn.classList.add('active');

  // Switch to app section
  const appSection = document.getElementById('section-app');
  if (!appSection.classList.contains('active')) {
    showSection('app', document.getElementById('tab-app'));
  }

  // Trigger animations
  if (name === 'home') animateRecoveryMetrics();
  if (name === 'recovery') setTimeout(animateGoals, 300);
}

/* ── Women's Screen Switcher ── */
function showWomensScreen(name, btn) {
  document.querySelectorAll('#section-womens .ps').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#section-womens .sni').forEach(n => n.classList.remove('active'));
  const screen = document.getElementById('wscreen-' + name);
  if (screen) screen.classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'cycle') buildCycleCalendar();
}

/* ── Recovery Metrics Animation ── */
let currentScore = 91;

function animateRecoveryMetrics() {
  const medEl = document.getElementById('rm-med');
  const symEl = document.getElementById('rm-sym');
  const actEl = document.getElementById('rm-act');
  if (medEl) setTimeout(() => { medEl.style.width = '95%'; }, 100);
  if (symEl) setTimeout(() => { symEl.style.width = '82%'; }, 200);
  if (actEl) setTimeout(() => { actEl.style.width = '90%'; }, 300);
  animateScoreRing(currentScore);
}

function animateScoreRing(score) {
  const ring = document.getElementById('score-ring');
  const numEl = document.getElementById('score-number');
  if (!ring || !numEl) return;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;
  ring.style.strokeDashoffset = offset;
  numEl.textContent = score;
}

/* ── Medication Check-off ── */
let checkedCount = 1; // first one already done
const totalMeds = 5;
const medLabels = ['BP Tablet', 'Morning Walk', 'Antibiotic', 'Physiotherapy', 'Diabetes Medicine'];

function markDone(idx) {
  const item = document.getElementById('sched-' + idx);
  const check = document.getElementById('check-' + idx);
  if (!item || !check) return;
  if (check.classList.contains('checked')) return;
  check.classList.add('checked');
  item.classList.add('done');
  checkedCount++;
  updateScoreFromMeds();
  // Update doctor dashboard adherence
  updateDoctorDashboard();
  showWANotification(`✅ Medicine confirmed: ${medLabels[idx]}. Dr. Arjun Mehta has been notified. Recovery score updated.`);
}

function updateScoreFromMeds() {
  const adherencePct = Math.round((checkedCount / totalMeds) * 100);
  currentScore = Math.min(100, 75 + Math.round(adherencePct * 0.25));
  animateScoreRing(currentScore);
  const medBar = document.getElementById('rm-med');
  if (medBar) medBar.style.width = adherencePct + '%';
}

/* ── Take Medication (external trigger) ── */
function takeMedication() {
  // Find the next unchecked item
  for (let i = 1; i <= 4; i++) {
    const check = document.getElementById('check-' + i);
    if (check && !check.classList.contains('checked')) {
      markDone(i);
      break;
    }
  }
  // Show app section
  showScreen('home', document.getElementById('nav-home'));
}

/* ── Update Doctor Dashboard ── */
function updateDoctorDashboard() {
  const adherencePct = Math.round((checkedCount / totalMeds) * 100);
  const bar = document.getElementById('adh-rahul');
  const pct = document.getElementById('adh-rahul-pct');
  if (bar) bar.style.width = adherencePct + '%';
  if (pct) pct.textContent = adherencePct + '%';

  const dbAdh = document.getElementById('db-adherence');
  if (dbAdh) dbAdh.textContent = adherencePct + '%';

  // Update trust engine
  const adhBar = document.getElementById('adh-bar');
  const adhPct2 = document.getElementById('adh-pct');
  if (adhBar) adhBar.style.width = adherencePct + '%';
  if (adhPct2) adhPct2.textContent = adherencePct + '%';

  const trustEl = document.getElementById('trust-score');
  if (trustEl) {
    const newTrust = Math.min(99, 75 + Math.round(adherencePct * 0.24));
    trustEl.textContent = newTrust;
  }
}

/* ── AI Chat Logic ── */
const chatResponses = {
  'chest pain': [
    "I'm sorry to hear that. 😟 Let me ask a few questions to understand better.",
    "Does the pain radiate to your left arm or jaw?",
    "Are you experiencing any shortness of breath or sweating?",
    "Based on your symptoms, I'm recommending a **Cardiologist**. Shall I book an appointment with Dr. Priya Nair? 🏥"
  ],
  'headache': [
    "I understand. Let me help you better.",
    "How long have you had this headache? Is it throbbing or constant?",
    "Do you have fever or stiff neck along with it?",
    "Based on your symptoms, I recommend a **Neurologist**. Would you like to book an appointment? 🧠"
  ],
  'fever': [
    "A fever can be concerning. Let me gather more information.",
    "What is your current temperature?",
    "Do you have any other symptoms like cough, body pain, or rash?",
    "I recommend a **General Physician** consultation. I can book a same-day appointment for you. 🌡️"
  ],
  'back pain': [
    "Back pain can have many causes. Let me help.",
    "Is the pain localized or does it radiate to your legs?",
    "Does it worsen when sitting or bending?",
    "Based on your description, an **Orthopaedic Specialist** would be best. Shall I book? 🦴"
  ],
  'breathing difficulty': [
    "Breathing difficulty is serious. I'm prioritizing your case.",
    "How severe is it? Are you gasping for breath?",
    "Do you have chest tightness or wheezing?",
    "⚠️ This may require urgent attention. I recommend an **Emergency/Pulmonologist** consultation. Booking priority slot now..."
  ],
  'default': [
    "Thank you for sharing. Let me understand your condition better.",
    "How long have you been experiencing this?",
    "Are there any other symptoms accompanying this?",
    "Based on your symptoms, I'll recommend the most appropriate specialist. One moment..."
  ]
};

const chatState = {};

function sendMsg() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMsg(text, 'user');
  setTimeout(() => processAIResponse(text.toLowerCase()), 600);
}

function sendQuick(text) {
  addMsg(text, 'user');
  document.getElementById('quick-replies').style.display = 'none';
  setTimeout(() => processAIResponse(text.toLowerCase()), 600);
}

function processAIResponse(userText) {
  let key = 'default';
  for (const k of Object.keys(chatResponses)) {
    if (k !== 'default' && userText.includes(k)) { key = k; break; }
  }
  const responses = chatResponses[key];
  const stateKey = key;
  if (!chatState[stateKey]) chatState[stateKey] = 0;
  const idx = chatState[stateKey] % responses.length;
  chatState[stateKey]++;

  const response = responses[idx];
  setTimeout(() => {
    addMsg(response, 'ai');
    // Last response in sequence — show booking option
    if (idx === responses.length - 1) {
      setTimeout(() => {
        addMsg('Would you like me to book an appointment now? 📅', 'ai');
        const qr = document.getElementById('quick-replies');
        if (qr) {
          qr.style.display = 'flex';
          qr.innerHTML = `
            <div class="qr" onclick="showScreen('booking',document.getElementById('nav-booking'))">📅 Book Appointment</div>
            <div class="qr" onclick="sendQuick('Tell me more')">Tell me more</div>
          `;
        }
      }, 800);
    }
  }, 400);
}

function addMsg(text, type) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const isAI = type === 'ai';
  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2,'0')}`;
  const div = document.createElement('div');
  div.className = `msg ${isAI ? 'am' : 'um'}`;
  div.innerHTML = `
    <div class="mav ${isAI ? 'ai' : 'user'}">${isAI ? '🤖' : '👤'}</div>
    <div>
      <div class="mb">${text}</div>
      <div class="mt">${time}</div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

/* ── Slot Selection ── */
function selectSlot(el) {
  if (el.classList.contains('bk')) return;
  document.querySelectorAll('.sl2').forEach(s => s.classList.remove('sel'));
  el.classList.add('sel');
  el.classList.remove('av2');
}

/* ── AI Medical Scribe ── */
let isRecording = false;
const scribeLines = [
  { key: 'ECG Finding', val: 'Sinus tachycardia — Heart rate 102 bpm' },
  { key: 'Diagnosis', val: 'Hypertensive heart disease — ICD I11.9' },
  { key: 'Medicine 2', val: 'Atorvastatin 20mg — Once daily · 30 days' },
  { key: 'Medicine 3', val: 'Ramipril 5mg — Once daily · Morning' },
  { key: 'Advice', val: 'Low-sodium diet · Avoid strenuous activity · 10k steps/day' },
  { key: 'Follow-up', val: 'Return in 2 weeks — AI auto-booked: Aug 20, 11:00 AM' },
  { key: 'Referral', val: 'Echo cardiogram — Apollo Diagnostics — Booked Aug 8' },
];
let scribeIdx = 0;

function toggleScribe() {
  isRecording = !isRecording;
  const btn = document.getElementById('scribe-btn');
  if (!btn) return;
  if (isRecording) {
    btn.classList.add('rec');
    btn.innerHTML = '<i class="fa-solid fa-stop"></i> Recording... Click to Stop';
    autoScribe();
  } else {
    btn.classList.remove('rec');
    btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Start Voice Consultation';
  }
}

function autoScribe() {
  if (!isRecording || scribeIdx >= scribeLines.length) return;
  const line = scribeLines[scribeIdx++];
  const fields = document.getElementById('scribe-fields');
  if (fields) {
    const div = document.createElement('div');
    div.className = 'sf';
    div.innerHTML = `<span class="sfk">${line.key}</span><span class="sfv">${line.val}</span>`;
    fields.appendChild(div);
  }
  // Also add to video scribe panel
  const scribeMed = document.getElementById('scribe-content');
  if (scribeMed) {
    const d = document.createElement('div');
    d.className = 'sri';
    d.innerHTML = `<span class="sk">${line.key}</span><span class="sv">${line.val}</span>`;
    scribeMed.appendChild(d);
  }
  // Show follow-up fields
  if (scribeIdx === 5) {
    const med = document.getElementById('scribe-med');
    const fu = document.getElementById('scribe-fu');
    if (med) med.style.display = 'flex';
    if (fu) fu.style.display = 'flex';
  }
  setTimeout(autoScribe, 2000);
}

function addScribeLine() {
  if (scribeIdx < scribeLines.length) {
    const line = scribeLines[scribeIdx++];
    const scribeContent = document.getElementById('scribe-content');
    if (scribeContent) {
      const d = document.createElement('div');
      d.className = 'sri';
      d.innerHTML = `<span class="sk">${line.key}</span><span class="sv">${line.val}</span>`;
      scribeContent.appendChild(d);
    }
  }
}

/* ── Fever Simulation ── */
function triggerFever() {
  // Show fever modal
  document.getElementById('fever-modal').classList.add('show');

  // Show app section & recovery screen
  showSection('app', document.getElementById('tab-app'));
  showScreen('recovery', document.getElementById('nav-recovery'));

  // Update doctor alert
  const alert = document.getElementById('fever-alert');
  if (alert) alert.style.display = 'flex';

  // Update AI insight
  const insight = document.getElementById('ai-insight');
  if (insight) {
    insight.style.color = 'var(--red)';
    insight.style.fontWeight = '600';
    insight.textContent = '⚠️ AI Alert: Fever detected (38.5°C). Care plan has been updated. Cooling measures and fever medication added. Dr. Arjun Mehta has been alerted. An urgent teleconsultation has been scheduled for today at 5:00 PM.';
  }
}

function confirmFever() {
  document.getElementById('fever-modal').classList.remove('show');
  showWANotification('🌡️ AI Update: Fever care plan activated for Rahul Sharma. Doctor has been notified. Urgent consultation booked for 5 PM today.');

  // Update score slightly down due to fever
  currentScore = Math.max(currentScore - 5, 70);
  animateScoreRing(currentScore);
}

/* ── WhatsApp Notifications ── */
const waMessages = [
  '⏰ Time for your Antibiotic (Amoxicillin 500mg). Reply "Taken" to confirm.',
  '💊 Reminder: Blood Pressure tablet at 7:00 AM. Did you take it?',
  '🚶 Don\'t forget your 20-minute morning walk! Recovery is on track.',
  '📅 Appointment with Dr. Priya Nair in 24 hours — Aug 12, 11:00 AM (Video Consultation).',
  '💧 Drink 500ml of water. Hydration helps faster recovery!',
  '✅ Your recovery score is 91/100 — Excellent progress! Keep it up.'
];
let waIdx = 0;

function showWANotification(msg) {
  const notif = document.getElementById('wa-notif');
  const msgEl = document.getElementById('wa-msg');
  if (!notif || !msgEl) return;
  msgEl.textContent = msg || waMessages[waIdx % waMessages.length];
  waIdx++;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 6000);
}

function triggerWA() {
  showWANotification(waMessages[waIdx % waMessages.length]);
}

function hideWA() {
  document.getElementById('wa-notif').classList.remove('show');
}

/* ── Cycle Calendar ── */
function buildCycleCalendar() {
  const cal = document.getElementById('cycle-calendar');
  if (!cal) return;
  cal.innerHTML = '';
  const days = 31;
  const periodDays = [1, 2, 3, 4, 5];
  const fertileDays = [10, 11, 12, 13, 14];
  const ovulation = [12];
  const today = new Date().getDate();

  for (let d = 1; d <= days; d++) {
    const div = document.createElement('div');
    div.className = 'cd';
    div.textContent = d;
    if (periodDays.includes(d)) div.classList.add('pe');
    else if (ovulation.includes(d)) div.classList.add('ov');
    else if (fertileDays.includes(d)) div.classList.add('fe');
    if (d === today) div.classList.add('td');
    cal.appendChild(div);
  }
}

/* ── Bed Grid ── */
function buildBedGrid() {
  const grid = document.getElementById('bed-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const total = 30;
  const icuBeds = [3, 7, 14];
  const freeBeds = [6, 8, 11, 15, 18, 22, 26, 29];
  const reservedBeds = [10, 20];

  for (let i = 1; i <= total; i++) {
    const div = document.createElement('div');
    div.className = 'bed';
    div.setAttribute('data-tooltip', `Bed ${i}`);
    div.textContent = i;
    if (icuBeds.includes(i)) div.classList.add('ic');
    else if (freeBeds.includes(i)) div.classList.add('fr');
    else if (reservedBeds.includes(i)) div.classList.add('rs');
    else div.classList.add('oc');
    grid.appendChild(div);
  }
}

/* ── Animate Goals ── */
function animateGoals() {
  const waterGoal = document.getElementById('water-goal');
  const waterPct = document.getElementById('water-pct');
  if (waterGoal) {
    let pct = 75;
    const interval = setInterval(() => {
      pct = Math.min(pct + 1, 80);
      waterGoal.style.width = pct + '%';
      if (waterPct) waterPct.textContent = pct + '%';
      if (pct >= 80) clearInterval(interval);
    }, 40);
  }
}

/* ── Command Stats Animation ── */
function animateCommandStats() {
  const beds = document.getElementById('cmd-beds');
  const queue = document.getElementById('cmd-queue');
  if (beds) {
    let count = 100;
    const i = setInterval(() => {
      count++;
      beds.textContent = count;
      if (count >= 148) clearInterval(i);
    }, 20);
  }
  if (queue) {
    let q = 20;
    const j = setInterval(() => {
      q++;
      queue.textContent = q;
      const qCount = document.getElementById('queue-count');
      if (qCount) qCount.textContent = q + ' Waiting';
      if (q >= 37) clearInterval(j);
    }, 40);
  }
}

/* ── Journey Flow ── */
function buildJourney() {
  const steps = [
    'Register &<br>Login',
    'AI Symptom<br>Assessment',
    'AI Specialist<br>Recommendation',
    'Smart Slot<br>Booking',
    'Hospital / Video<br>Consultation',
    'AI Medical<br>Scribe',
    'Digital<br>Prescription',
    'Recovery<br>Schedule',
    'Medication<br>Reminders',
    'Recovery<br>Monitoring',
    'Auto Follow-up<br>Booking',
    'Continuous<br>AI Care',
    'Complete<br>Recovery'
  ];

  const flow = document.getElementById('journey-flow');
  if (!flow) return;
  flow.innerHTML = '';

  steps.forEach((label, i) => {
    const step = document.createElement('div');
    step.className = 'jstep';
    step.innerHTML = `<div class="jsn">${i + 1}</div><div class="jsl">${label}</div>`;
    flow.appendChild(step);
    if (i < steps.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'jarr';
      flow.appendChild(arrow);
    }
  });
}

/* ── Mood Selection ── */
function selectMood(el) {
  const parent = el.closest('.co');
  if (!parent) return;
  parent.querySelectorAll('.mb2').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
}

/* ── Periodic WhatsApp Reminders ── */
let waAutoIdx = 0;
setInterval(() => {
  // Only show if the notification isn't already visible
  const notif = document.getElementById('wa-notif');
  if (notif && !notif.classList.contains('show')) {
    showWANotification(waMessages[waAutoIdx % waMessages.length]);
    waAutoIdx++;
  }
}, 30000);

/* ── Queue Live Tick ── */
setInterval(() => {
  // Simulate queue movement
  const qItems = document.querySelectorAll('.qli .qw');
  qItems.forEach(el => {
    const current = parseInt(el.textContent) || 5;
    if (current > 2) {
      el.textContent = `~${current - 1} min`;
    }
  });
}, 10000);

/* ── Initialize on Load ── */
document.addEventListener('DOMContentLoaded', () => {
  buildJourney();
  buildCycleCalendar();
  animateRecoveryMetrics();

  // Show initial WA reminder after 4 seconds
  setTimeout(() => {
    showWANotification(waMessages[0]);
  }, 4000);
});
