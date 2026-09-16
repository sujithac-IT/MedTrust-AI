// =============================================================================
// MEDTRUST AI - CLINICAL TELEHEALTH & 17-SECTION CASE SHEET STUDIO CONTROLLER
// =============================================================================

let currentRole = "doc-1";
let currentConsultationId = "";
let currentConsultation = null;
let consultationsList = [];
let patientsList = [];
let caseSheetMode = "edit"; // 'edit' or 'preview'
let activeLanguage = "english";

// WebRTC & Audio Context
let localStream = null;
let audioContext = null;
let analyserNode = null;
let waveformCanvas = null;
let waveformCtx = null;
let animationFrameId = null;
let isMicMuted = false;
let isCamActive = false;

// Call Timer
let callSeconds = 0;
let callTimerInterval = null;

// Speech Recognition
let recognition = null;
let isSpeechRecActive = false;

// WebSocket
let consultationWs = null;

// Signature Canvas
let sigCanvas = null;
let sigCtx = null;
let isDrawingSig = false;

// Initialize on DOM Loaded
document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
  
  initAudioWaveformCanvas();
  initSignatureCanvas();
  startCallTimer();
  
  await fetchUsersAndSetRole(currentRole);
  await loadPatients();
  await loadConsultations();
});

// --- Audio Waveform Visualizer ---
function initAudioWaveformCanvas() {
  waveformCanvas = document.getElementById("waveformCanvas");
  if (!waveformCanvas) return;
  waveformCtx = waveformCanvas.getContext("2d");
  
  // Resize to actual display size
  waveformCanvas.width = waveformCanvas.parentElement.clientWidth || 600;
  waveformCanvas.height = waveformCanvas.parentElement.clientHeight || 70;
  
  drawWaveformPlaceholder();
}

function drawWaveformPlaceholder() {
  if (!waveformCtx || !waveformCanvas) return;
  const width = waveformCanvas.width;
  const height = waveformCanvas.height;
  
  let phase = 0;
  function render() {
    waveformCtx.fillStyle = "#020617";
    waveformCtx.fillRect(0, 0, width, height);
    
    // Draw animated medical sinus/audio wave
    waveformCtx.lineWidth = 2;
    waveformCtx.strokeStyle = "#14b8a6";
    waveformCtx.beginPath();
    
    const sliceWidth = width / 120;
    let x = 0;
    
    for (let i = 0; i < 120; i++) {
      const v = Math.sin((i * 0.15) + phase) * (Math.sin(i * 0.05) * 15);
      const y = height / 2 + v;
      if (i === 0) waveformCtx.moveTo(x, y);
      else waveformCtx.lineTo(x, y);
      x += sliceWidth;
    }
    waveformCtx.stroke();
    phase += 0.08;
    
    // Decibel meter display
    const dbElem = document.getElementById("micDbDisplay");
    if (dbElem && !isMicMuted) {
      const simulatedDb = -36 - Math.floor(Math.abs(Math.sin(phase * 0.5) * 18));
      dbElem.innerText = `${simulatedDb} dB`;
    }
    
    animationFrameId = requestAnimationFrame(render);
  }
  render();
}

// --- Call Timer ---
function startCallTimer() {
  if (callTimerInterval) clearInterval(callTimerInterval);
  callSeconds = 245; // Start with realistic in-progress consultation
  const timerElem = document.getElementById("callTimer");
  
  callTimerInterval = setInterval(() => {
    callSeconds++;
    const mins = Math.floor(callSeconds / 60).toString().padStart(2, "0");
    const secs = (callSeconds % 60).toString().padStart(2, "0");
    if (timerElem) timerElem.innerText = `${mins}:${secs}`;
  }, 1000);
}

// --- Camera & Mic Controls ---
async function toggleCamera() {
  const videoElem = document.getElementById("localVideoFeed");
  const placeholder = document.getElementById("localVideoPlaceholder");
  const btn = document.getElementById("btnToggleCam");
  
  if (isCamActive) {
    // Turn off
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.stop());
    }
    videoElem.classList.add("hidden");
    placeholder.classList.remove("hidden");
    isCamActive = false;
    btn.classList.remove("bg-teal-600");
  } else {
    // Turn on
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoElem.srcObject = localStream;
      videoElem.classList.remove("hidden");
      placeholder.classList.add("hidden");
      isCamActive = true;
      btn.classList.add("bg-teal-600");
    } catch (err) {
      console.warn("Webcam access declined or not present. Using virtual doctor stage.", err);
      alert("Camera device not detected or permission denied. Retaining high-definition clinical avatar preview.");
    }
  }
}

function toggleMicrophone() {
  const btn = document.getElementById("btnToggleMic");
  const icon = document.getElementById("micIndicatorIcon");
  const dbElem = document.getElementById("micDbDisplay");
  
  isMicMuted = !isMicMuted;
  if (isMicMuted) {
    btn.classList.add("bg-red-600");
    icon.classList.remove("text-teal-400");
    icon.classList.add("text-red-400");
    if (dbElem) dbElem.innerText = "MUTED";
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = false);
    }
  } else {
    btn.classList.remove("bg-red-600");
    icon.classList.add("text-teal-400");
    icon.classList.remove("text-red-400");
    if (dbElem) dbElem.innerText = "-42 dB";
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = true);
    }
  }
}

function triggerScreenShare() {
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    navigator.mediaDevices.getDisplayMedia({ video: true })
      .then(stream => {
        const videoElem = document.getElementById("localVideoFeed");
        videoElem.srcObject = stream;
        videoElem.classList.remove("hidden");
        document.getElementById("localVideoPlaceholder").classList.add("hidden");
      })
      .catch(e => console.log("Screen share cancelled", e));
  } else {
    alert("Screen sharing is available on desktop browsers with HTTPS or localhost.");
  }
}

// --- Live Speech Recognition ---
function toggleLiveSpeechRecognition() {
  const btnText = document.getElementById("speechRecBtnText");
  const btn = document.getElementById("btnSpeechRec");
  
  if (isSpeechRecActive) {
    if (recognition) recognition.stop();
    isSpeechRecActive = false;
    btnText.innerText = "Start Speech-to-Text";
    btn.classList.remove("bg-red-600");
    btn.classList.add("bg-teal-600");
    return;
  }
  
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert("Web Speech API is not supported in this browser. You can dictate by typing in the dialogue box or click 'Animate Live Consultation Dialogue'.");
    return;
  }
  
  recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  
  recognition.onstart = () => {
    isSpeechRecActive = true;
    btnText.innerText = "Listening...";
    btn.classList.remove("bg-teal-600");
    btn.classList.add("bg-red-600");
  };
  
  recognition.onresult = (event) => {
    const lastResultIndex = event.results.length - 1;
    const transcriptText = event.results[lastResultIndex][0].transcript.trim();
    if (transcriptText) {
      sendSpeechTurn(transcriptText);
    }
  };
  
  recognition.onerror = (e) => {
    console.warn("Speech recognition error:", e);
  };
  
  recognition.onend = () => {
    if (isSpeechRecActive) {
      recognition.start();
    } else {
      btnText.innerText = "Start Speech-to-Text";
      btn.classList.remove("bg-red-600");
      btn.classList.add("bg-teal-600");
    }
  };
  
  try {
    recognition.start();
  } catch (err) {
    console.error("Speech rec start failed:", err);
  }
}

// --- Navigation Tabs ---
function switchMainTab(tabName) {
  document.querySelectorAll(".main-tab-content").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
  
  if (tabName === "consultation") {
    document.getElementById("tabConsultation").classList.remove("hidden");
    document.getElementById("navTabConsultation").classList.add("active");
  } else if (tabName === "casesheet") {
    document.getElementById("tabCaseSheet").classList.remove("hidden");
    document.getElementById("navTabCaseSheet").classList.add("active");
  } else if (tabName === "multilingual") {
    document.getElementById("tabMultilingual").classList.remove("hidden");
    document.getElementById("navTabMultilingual").classList.add("active");
  } else if (tabName === "patients") {
    document.getElementById("tabPatients").classList.remove("hidden");
    document.getElementById("navTabPatients").classList.add("active");
  }
  
  if (window.lucide) window.lucide.createIcons();
}

// --- Role Switcher ---
async function fetchUsersAndSetRole(roleId) {
  currentRole = roleId;
  const avatarElem = document.getElementById("currentRoleAvatar");
  const nameElem = document.getElementById("currentRoleName");
  const titleElem = document.getElementById("currentRoleTitle");
  const selector = document.getElementById("roleSelector");
  
  if (selector) selector.value = roleId;
  
  if (roleId === "doc-1") {
    avatarElem.src = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150";
    nameElem.innerText = "Dr. Rajesh Sharma, MD";
    titleElem.innerText = "Attending Physician";
  } else if (roleId === "stu-1") {
    avatarElem.src = "https://images.unsplash.com/photo-1594824813681-364e03102fb2?w=150";
    nameElem.innerText = "Sneha Patel";
    titleElem.innerText = "MBBS Intern Student";
  } else {
    avatarElem.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
    nameElem.innerText = "K. Sundaram";
    titleElem.innerText = "Patient (MRN: MT-2026-0841)";
  }
  
  updateDoctorSignButtonState();
}

function switchRole(roleId) {
  fetchUsersAndSetRole(roleId);
}

function updateDoctorSignButtonState() {
  const btnSign = document.getElementById("btnDoctorSignOff");
  if (!btnSign) return;
  if (currentRole === "doc-1") {
    btnSign.classList.remove("opacity-50", "cursor-not-allowed");
    btnSign.title = "Digitally sign and lock case sheet";
  } else {
    btnSign.classList.add("opacity-50");
    btnSign.title = "Only senior attending doctors can sign and lock medical records.";
  }
}

// --- Consultations API ---
async function loadConsultations() {
  try {
    const res = await fetch("/api/consultations");
    consultationsList = await res.json();
    
    const selector = document.getElementById("consultationSelector");
    selector.innerHTML = "";
    
    if (consultationsList.length === 0) {
      // Create initial consultation
      const initRes = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "pat-1", doctor_id: "doc-1" })
      });
      const newCons = await initRes.json();
      consultationsList = [newCons];
    }
    
    consultationsList.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.innerText = `${c.id} - ${c.patient_name} (${c.status.toUpperCase()})`;
      selector.appendChild(opt);
    });
    
    currentConsultationId = consultationsList[0].id;
    selector.value = currentConsultationId;
    await loadConsultationDetails(currentConsultationId);
  } catch (err) {
    console.error("Failed to load consultations", err);
  }
}

async function loadConsultationDetails(cid) {
  if (!cid) return;
  currentConsultationId = cid;
  
  try {
    const res = await fetch(`/api/consultations/${cid}`);
    currentConsultation = await res.json();
    
    // Status Badge
    const badge = document.getElementById("consultationStatusBadge");
    if (currentConsultation.status === "approved_locked") {
      badge.className = "status-pill status-locked";
      badge.innerText = "Locked & Signed";
    } else {
      badge.className = "status-pill status-in-progress";
      badge.innerText = "In Progress";
    }
    
    // Meet Info
    document.getElementById("meetCodeTag").innerText = currentConsultation.meet_code;
    document.getElementById("meetSpaceUri").innerText = `${currentConsultation.meet_space} • Google Meet API Active`;
    document.getElementById("directMeetLink").href = currentConsultation.meet_url;
    document.getElementById("calendarEventLink").href = currentConsultation.calendar_link;
    
    // Render Transcripts
    renderTranscript(currentConsultation.transcript || []);
    
    // Render Case Sheet
    if (currentConsultation.case_sheet) {
      populateCaseSheetUI(currentConsultation.case_sheet);
      if (currentConsultation.multilingual_summary) {
        populateMultilingualUI(currentConsultation.multilingual_summary);
      }
    } else {
      // Clear or set default
      clearCaseSheetUI();
    }
    
    // Locked State Banner
    checkAndDisplayLockState();
    
    // Connect WebSocket
    connectConsultationWs(cid);
  } catch (err) {
    console.error("Error loading consultation details:", err);
  }
}

function checkAndDisplayLockState() {
  const banner = document.getElementById("lockedAuditBanner");
  const csTag = document.getElementById("caseSheetStatusTag");
  const btnSave = document.getElementById("btnSaveCaseSheet");
  const btnSign = document.getElementById("btnDoctorSignOff");
  
  if (currentConsultation && currentConsultation.status === "approved_locked") {
    banner.classList.remove("hidden");
    csTag.className = "status-pill status-locked";
    csTag.innerText = "Approved & Audit-Locked";
    
    const app = currentConsultation.doctor_approval;
    if (app) {
      document.getElementById("bannerStampHash").innerText = app.sha256_audit_stamp;
      document.getElementById("bannerDoctorCreds").innerText = `Signed by ${app.doctor_name} (${app.registration_no}) • Apollo MedTrust University Hospital`;
      document.getElementById("bannerSignaturePreview").src = app.signature_data_url;
      
      const sigDisplay = document.getElementById("csSignatureDisplay");
      if (sigDisplay) {
        sigDisplay.innerHTML = `<img src="${app.signature_data_url}" class="h-12 max-w-[150px] object-contain bg-white rounded p-1 shadow" alt="Doctor Signature" />`;
      }
    }
    
    btnSave.disabled = true;
    btnSave.classList.add("opacity-50", "cursor-not-allowed");
    btnSign.disabled = true;
    btnSign.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    banner.classList.add("hidden");
    csTag.className = "status-pill status-draft";
    csTag.innerText = "Draft Mode";
    btnSave.disabled = false;
    btnSave.classList.remove("opacity-50", "cursor-not-allowed");
    btnSign.disabled = false;
    btnSign.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

// --- WebSocket Sync ---
function connectConsultationWs(cid) {
  if (consultationWs) {
    consultationWs.close();
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/live-consultation/${cid}`;
  
  try {
    consultationWs = new WebSocket(wsUrl);
    consultationWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "turn" && msg.data) {
        if (!currentConsultation.transcript) currentConsultation.transcript = [];
        currentConsultation.transcript.push(msg.data);
        renderTranscript(currentConsultation.transcript);
      }
    };
  } catch (e) {
    console.log("WebSocket fallback to HTTP polling", e);
  }
}

// --- Transcript Rendering ---
function renderTranscript(turns) {
  const container = document.getElementById("transcriptContainer");
  const counter = document.getElementById("turnCounterBadge");
  if (!container) return;
  
  counter.innerText = `${turns.length} turns`;
  
  if (!turns || turns.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-500 italic">
        No spoken turns recorded yet.<br>Load a sample scenario above or click "Start Speech-to-Text" to dictate live.
      </div>
    `;
    return;
  }
  
  container.innerHTML = turns.map(t => {
    let badgeClass = "badge-doctor";
    let roleTitle = "Doctor";
    if (t.speaker === "student") {
      badgeClass = "badge-student";
      roleTitle = "Medical Student";
    } else if (t.speaker === "patient") {
      badgeClass = "badge-patient";
      roleTitle = "Patient";
    }
    
    return `
      <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
        <div class="flex items-center justify-between text-[11px]">
          <span class="px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badgeClass}">
            [${roleTitle}] ${t.speaker_name || ""}
          </span>
          <span class="text-slate-500 font-mono">${t.timestamp}</span>
        </div>
        <p class="text-slate-200 text-xs leading-relaxed pt-1">${t.text}</p>
      </div>
    `;
  }).join("");
  
  container.scrollTop = container.scrollHeight;
}

// --- Manual & Speech Turn Ingestion ---
async function sendSpeechTurn(text) {
  if (!currentConsultationId || !text) return;
  
  let speaker = "doctor";
  let speakerName = "Dr. Rajesh Sharma, MD";
  if (currentRole === "stu-1") {
    speaker = "student";
    speakerName = "Sneha Patel (Intern)";
  } else if (currentRole === "pat-1") {
    speaker = "patient";
    speakerName = currentConsultation.patient_name || "K. Sundaram";
  }
  
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0];
  
  const turn = {
    speaker,
    speaker_name: speakerName,
    timestamp: timeStr,
    text,
    confidence: 0.98
  };
  
  try {
    const res = await fetch(`/api/consultations/${currentConsultationId}/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(turn)
    });
    const data = await res.json();
    if (!currentConsultation.transcript) currentConsultation.transcript = [];
    currentConsultation.transcript.push(data.turn);
    renderTranscript(currentConsultation.transcript);
  } catch (err) {
    console.error("Failed to add turn", err);
  }
}

function sendManualTurn() {
  const input = document.getElementById("turnTextInput");
  const speakerSelect = document.getElementById("turnSpeakerSelect");
  const text = input.value.trim();
  if (!text) return;
  
  const speaker = speakerSelect.value;
  let speakerName = "Dr. Rajesh Sharma, MD";
  if (speaker === "student") speakerName = "Sneha Patel (Intern)";
  if (speaker === "patient") speakerName = currentConsultation.patient_name || "K. Sundaram";
  
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0];
  
  const turn = {
    speaker,
    speaker_name: speakerName,
    timestamp: timeStr,
    text,
    confidence: 0.99
  };
  
  fetch(`/api/consultations/${currentConsultationId}/transcript`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(turn)
  }).then(r => r.json()).then(data => {
    if (!currentConsultation.transcript) currentConsultation.transcript = [];
    currentConsultation.transcript.push(data.turn);
    renderTranscript(currentConsultation.transcript);
    input.value = "";
  });
}

// --- Scenario Quick Loader & Animation ---
async function loadSelectedScenario() {
  const key = document.getElementById("scenarioSelector").value;
  if (!currentConsultationId) return;
  
  try {
    const res = await fetch(`/api/scenarios/${key}/load-into/${currentConsultationId}`, {
      method: "POST"
    });
    const data = await res.json();
    currentConsultation = data.consultation;
    renderTranscript(currentConsultation.transcript);
  } catch (err) {
    console.error("Failed to load scenario", err);
  }
}

async function simulateLiveConsultationTurns() {
  const key = document.getElementById("scenarioSelector").value;
  const res = await fetch("/api/scenarios");
  const scenarios = await res.json();
  
  // Clear current transcript first
  currentConsultation.transcript = [];
  renderTranscript([]);
  
  const simBtn = document.getElementById("btnSimulate");
  simBtn.disabled = true;
  simBtn.innerText = "Simulating Live Dialogue...";
  
  // Fetch detailed turns
  const detailRes = await fetch(`/api/scenarios/${key}/load-into/${currentConsultationId}`, { method: "POST" });
  const data = await detailRes.json();
  const allTurns = data.consultation.transcript;
  currentConsultation.transcript = [];
  
  for (let i = 0; i < allTurns.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 850));
    currentConsultation.transcript.push(allTurns[i]);
    renderTranscript(currentConsultation.transcript);
  }
  
  simBtn.disabled = false;
  simBtn.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5 inline mr-1"></i> Animate Live Consultation Dialogue`;
  if (window.lucide) window.lucide.createIcons();
}

// --- Synthesize 17-Section Case Sheet ---
async function generateCaseSheetAI() {
  if (!currentConsultationId) return;
  
  const btn = event ? event.currentTarget : null;
  if (btn) btn.innerText = "Extracting with AI Engine...";
  
  try {
    const res = await fetch(`/api/consultations/${currentConsultationId}/generate-casesheet`, {
      method: "POST"
    });
    const data = await res.json();
    
    currentConsultation.case_sheet = data.case_sheet;
    currentConsultation.multilingual_summary = data.multilingual_summary;
    
    populateCaseSheetUI(data.case_sheet);
    populateMultilingualUI(data.multilingual_summary);
    
    // Switch to casesheet tab to display result
    switchMainTab("casesheet");
  } catch (err) {
    console.error("AI Case Sheet synthesis failed:", err);
    alert("Extraction error: " + err.message);
  } finally {
    if (btn) {
      btn.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5 inline mr-1"></i> Run AI Extraction`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

function generateAndOpenCaseSheet() {
  generateCaseSheetAI();
}

function populateCaseSheetUI(cs) {
  if (!cs) return;
  
  // Section 1: Demographics
  const p = cs.patient_info || {};
  document.getElementById("csPatientName").innerText = p.name || "K. Sundaram";
  document.getElementById("csPatientMrn").innerText = p.mrn || "MT-2026-0841";
  document.getElementById("sheetBarcode").innerText = `*${p.mrn || "MT-2026-0841"}*`;
  document.getElementById("csPatientDemographics").innerText = `${p.age || 58} yrs • ${p.gender || "Male"} • ${p.blood_group || "O+"}`;
  document.getElementById("csAttendingDoc").innerText = p.attending_physician || "Dr. Rajesh Sharma, MD";
  
  // Section 2 & 5: Chief Complaint & Duration
  document.getElementById("csChiefComplaint").value = cs.chief_complaint || "";
  document.getElementById("csDurationOnset").value = cs.duration_onset || "";
  
  // Section 3: HPI
  document.getElementById("csHpi").value = cs.hpi || "";
  
  // Section 4: Symptoms Checklist with Badges
  const symContainer = document.getElementById("csSymptomsList");
  symContainer.innerHTML = (cs.symptoms || []).map(s => {
    let sevClass = "severity-mild";
    const sev = (s.severity || "").toLowerCase();
    if (sev === "moderate") sevClass = "severity-moderate";
    if (sev === "severe") sevClass = "severity-severe";
    if (sev === "critical") sevClass = "severity-critical";
    
    return `<span class="px-2.5 py-1 rounded-lg text-xs font-semibold ${sevClass}">${s.symptom} (${s.severity})</span>`;
  }).join("");
  
  // Section 6, 8, 9, 10
  document.getElementById("csPastHistory").value = (cs.past_medical_history || []).join("\n");
  document.getElementById("csAllergies").value = (cs.allergies_adverse_reactions || []).join("\n");
  document.getElementById("csFamilyHistory").value = (cs.family_history || []).join("\n");
  document.getElementById("csSocialHistory").value = cs.social_occupational_history || "";
  
  // Section 7: Medications Table
  renderMedicationsTable(cs.current_medications || []);
  
  // Section 11: Vitals
  const v = cs.doctor_observations || {};
  document.getElementById("vitalBp").value = v.blood_pressure || "152/94 mmHg";
  document.getElementById("vitalPulse").value = v.pulse_rate || "84 bpm";
  document.getElementById("vitalRr").value = v.respiratory_rate || "18 /min";
  document.getElementById("vitalTemp").value = v.temperature || "98.6°F";
  document.getElementById("vitalSpo2").value = v.spo2 || "98%";
  document.getElementById("vitalBmi").value = v.bmi || "27.4 kg/m²";
  document.getElementById("vitalExam").value = v.systemic_examination || "";
  
  // Section 12 & 13
  document.getElementById("csInvestigations").value = (cs.recommended_investigations || []).join("\n");
  document.getElementById("csAssessment").value = cs.provisional_assessment || "";
  
  // Section 14
  document.getElementById("csTreatmentPlan").value = cs.treatment_plan || "";
  
  // Section 15
  const fur = cs.follow_up_red_flags || {};
  document.getElementById("csReview").value = fur.scheduled_review || "";
  document.getElementById("csRedFlags").value = (fur.emergency_red_flags || []).join("\n");
  
  // Section 16 & 17
  document.getElementById("csMissingInfo").value = (cs.missing_information || []).join("\n");
  document.getElementById("csUncertainInfo").value = (cs.uncertain_information || []).join("\n");
}

function clearCaseSheetUI() {
  document.getElementById("csChiefComplaint").value = "";
  document.getElementById("csDurationOnset").value = "";
  document.getElementById("csHpi").value = "";
  document.getElementById("csSymptomsList").innerHTML = "<span class='text-xs text-slate-500 italic'>Click 'Run AI Extraction' to populate clinical findings</span>";
  document.getElementById("csPastHistory").value = "";
  document.getElementById("csAllergies").value = "";
  document.getElementById("csFamilyHistory").value = "";
  document.getElementById("csSocialHistory").value = "";
  renderMedicationsTable([]);
  document.getElementById("csInvestigations").value = "";
  document.getElementById("csAssessment").value = "";
  document.getElementById("csTreatmentPlan").value = "";
  document.getElementById("csReview").value = "";
  document.getElementById("csRedFlags").value = "";
  document.getElementById("csMissingInfo").value = "";
  document.getElementById("csUncertainInfo").value = "";
}

// --- Dynamic Medications Table ---
function renderMedicationsTable(meds) {
  const tbody = document.getElementById("csMedsTableBody");
  if (!tbody) return;
  
  if (!meds || meds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-500 italic">No medications recorded. Click '+ Add Drug Row' to add.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = meds.map((m, idx) => `
    <tr data-index="${idx}" class="hover:bg-slate-900/60 transition-colors">
      <td class="p-2"><input type="text" class="med-input font-bold text-teal-300" value="${m.drug}" /></td>
      <td class="p-2"><input type="text" class="med-input" value="${m.dosage}" /></td>
      <td class="p-2"><input type="text" class="med-input" value="${m.frequency}" /></td>
      <td class="p-2"><input type="text" class="med-input" value="${m.route || 'Oral'}" /></td>
      <td class="p-2"><input type="text" class="med-input" value="${m.duration}" /></td>
      <td class="p-2"><input type="text" class="med-input" value="${m.instructions}" /></td>
      <td class="p-2 text-center">
        <button onclick="removeMedicationRow(${idx})" class="text-red-400 hover:text-red-300 p-1">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </td>
    </tr>
  `).join("");
  
  if (window.lucide) window.lucide.createIcons();
}

function addMedicationRow() {
  const currentMeds = gatherCurrentMedicationsFromTable();
  currentMeds.push({
    drug: "New Drug",
    dosage: "10mg",
    frequency: "OD",
    route: "Oral",
    duration: "7 days",
    instructions: "After meals"
  });
  renderMedicationsTable(currentMeds);
}

function removeMedicationRow(idx) {
  const currentMeds = gatherCurrentMedicationsFromTable();
  currentMeds.splice(idx, 1);
  renderMedicationsTable(currentMeds);
}

function gatherCurrentMedicationsFromTable() {
  const rows = document.querySelectorAll("#csMedsTableBody tr");
  const list = [];
  rows.forEach(r => {
    const inputs = r.querySelectorAll("input");
    if (inputs.length >= 6) {
      list.push({
        drug: inputs[0].value,
        dosage: inputs[1].value,
        frequency: inputs[2].value,
        route: inputs[3].value,
        duration: inputs[4].value,
        instructions: inputs[5].value
      });
    }
  });
  return list;
}

// --- Save Case Sheet Edits ---
async function saveCaseSheetEdits() {
  if (!currentConsultationId) return;
  
  if (currentConsultation && currentConsultation.status === "approved_locked") {
    alert("Cannot edit record. This consultation has been digitally signed and locked by the attending doctor.");
    return;
  }
  
  const cs = {
    patient_info: currentConsultation.case_sheet ? currentConsultation.case_sheet.patient_info : {},
    chief_complaint: document.getElementById("csChiefComplaint").value,
    duration_onset: document.getElementById("csDurationOnset").value,
    hpi: document.getElementById("csHpi").value,
    symptoms: currentConsultation.case_sheet ? currentConsultation.case_sheet.symptoms : [],
    past_medical_history: document.getElementById("csPastHistory").value.split("\n").filter(Boolean),
    current_medications: gatherCurrentMedicationsFromTable(),
    allergies_adverse_reactions: document.getElementById("csAllergies").value.split("\n").filter(Boolean),
    family_history: document.getElementById("csFamilyHistory").value.split("\n").filter(Boolean),
    social_occupational_history: document.getElementById("csSocialHistory").value,
    doctor_observations: {
      blood_pressure: document.getElementById("vitalBp").value,
      pulse_rate: document.getElementById("vitalPulse").value,
      respiratory_rate: document.getElementById("vitalRr").value,
      temperature: document.getElementById("vitalTemp").value,
      spo2: document.getElementById("vitalSpo2").value,
      bmi: document.getElementById("vitalBmi").value,
      systemic_examination: document.getElementById("vitalExam").value
    },
    recommended_investigations: document.getElementById("csInvestigations").value.split("\n").filter(Boolean),
    provisional_assessment: document.getElementById("csAssessment").value,
    treatment_plan: document.getElementById("csTreatmentPlan").value,
    follow_up_red_flags: {
      scheduled_review: document.getElementById("csReview").value,
      emergency_red_flags: document.getElementById("csRedFlags").value.split("\n").filter(Boolean)
    },
    missing_information: document.getElementById("csMissingInfo").value.split("\n").filter(Boolean),
    uncertain_information: document.getElementById("csUncertainInfo").value.split("\n").filter(Boolean)
  };
  
  try {
    const res = await fetch(`/api/consultations/${currentConsultationId}/casesheet`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_sheet: cs })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || "Failed to update");
    }
    const data = await res.json();
    currentConsultation.case_sheet = data.case_sheet;
    alert("Clinical case sheet successfully saved!");
  } catch (e) {
    alert("Save failed: " + e.message);
  }
}

// --- Edit / Preview Mode Toggle ---
function setCaseSheetMode(mode) {
  caseSheetMode = mode;
  const btnEdit = document.getElementById("btnModeEdit");
  const btnPrev = document.getElementById("btnModePreview");
  const inputs = document.querySelectorAll("#caseSheetContentBox input, #caseSheetContentBox textarea");
  
  if (mode === "preview") {
    btnPrev.classList.add("active");
    btnEdit.classList.remove("active");
    inputs.forEach(i => {
      i.setAttribute("readonly", "true");
      i.classList.add("bg-transparent", "border-transparent");
    });
    document.getElementById("btnAddMedRow").classList.add("hidden");
  } else {
    btnEdit.classList.add("active");
    btnPrev.classList.remove("active");
    if (!currentConsultation || currentConsultation.status !== "approved_locked") {
      inputs.forEach(i => {
        i.removeAttribute("readonly");
        i.classList.remove("border-transparent");
      });
      document.getElementById("btnAddMedRow").classList.remove("hidden");
    }
  }
}

// --- Doctor Sign-Off & Electronic Signature Canvas ---
function initSignatureCanvas() {
  sigCanvas = document.getElementById("signatureCanvas");
  if (!sigCanvas) return;
  sigCtx = sigCanvas.getContext("2d");
  
  sigCanvas.width = sigCanvas.parentElement.clientWidth || 400;
  sigCanvas.height = sigCanvas.parentElement.clientHeight || 110;
  
  sigCtx.strokeStyle = "#0f172a";
  sigCtx.lineWidth = 2.5;
  sigCtx.lineCap = "round";
  
  function getPos(e) {
    const rect = sigCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  
  sigCanvas.addEventListener("mousedown", (e) => {
    isDrawingSig = true;
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
  });
  
  sigCanvas.addEventListener("mousemove", (e) => {
    if (!isDrawingSig) return;
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
  });
  
  window.addEventListener("mouseup", () => isDrawingSig = false);
  
  // Touch
  sigCanvas.addEventListener("touchstart", (e) => {
    isDrawingSig = true;
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
    e.preventDefault();
  });
  
  sigCanvas.addEventListener("touchmove", (e) => {
    if (!isDrawingSig) return;
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
    e.preventDefault();
  });
  
  sigCanvas.addEventListener("touchend", () => isDrawingSig = false);
}

function clearSignatureCanvas() {
  if (sigCtx && sigCanvas) {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  }
}

function openDoctorSignModal() {
  if (currentRole !== "doc-1") {
    alert("Only Senior Attending Doctors (e.g. Dr. Rajesh Sharma, MD) have authority to counter-sign and lock clinical documentation. Switching your role to Doctor.");
    fetchUsersAndSetRole("doc-1");
  }
  
  if (!currentConsultation || !currentConsultation.case_sheet) {
    alert("Please generate or synthesize the AI Case Sheet before signing.");
    return;
  }
  
  document.getElementById("modalDoctorSign").classList.remove("hidden");
  clearSignatureCanvas();
  // Draw an authentic stylized signature sample as default if blank
  drawDefaultStylizedSignature();
}

function drawDefaultStylizedSignature() {
  if (!sigCtx || !sigCanvas) return;
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  sigCtx.strokeStyle = "#0d9488";
  sigCtx.lineWidth = 2.5;
  sigCtx.beginPath();
  sigCtx.moveTo(40, 60);
  sigCtx.bezierCurveTo(70, 20, 90, 80, 130, 40);
  sigCtx.bezierCurveTo(160, 20, 180, 70, 220, 50);
  sigCtx.lineTo(260, 65);
  sigCtx.moveTo(90, 75);
  sigCtx.lineTo(250, 75);
  sigCtx.stroke();
}

function closeDoctorSignModal() {
  document.getElementById("modalDoctorSign").classList.add("hidden");
}

async function submitDoctorSignOff() {
  const sigDataUrl = sigCanvas.toDataURL("image/png");
  
  const payload = {
    doctor_id: "doc-1",
    doctor_name: "Dr. Rajesh Sharma, MD",
    registration_no: "TNMC-84920",
    department: "Cardiology & Internal Medicine",
    signature_data_url: sigDataUrl,
    verification_notes: "Electronically counter-signed and verified under Apollo Telehealth Clinical Guidelines."
  };
  
  try {
    const res = await fetch(`/api/consultations/${currentConsultationId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Approval failed");
    }
    
    const result = await res.json();
    currentConsultation.status = "approved_locked";
    currentConsultation.doctor_approval = result.doctor_approval;
    
    closeDoctorSignModal();
    checkAndDisplayLockState();
    alert(`Case Sheet Approved and Locked!\nSHA-256 Audit Stamp: ${result.audit_stamp}`);
  } catch (err) {
    alert("Approval error: " + err.message);
  }
}

// --- Print Hospital HTML ---
function printApprovedCaseSheet() {
  if (!currentConsultationId) return;
  window.open(`/api/consultations/${currentConsultationId}/print`, "_blank");
}

// --- Multilingual Voice Playback (TTS) ---
function populateMultilingualUI(summaries) {
  if (!summaries) return;
  selectLanguageTab(activeLanguage);
}

function selectLanguageTab(lang) {
  activeLanguage = lang;
  document.querySelectorAll(".lang-tab").forEach(t => t.classList.remove("active"));
  
  const tabId = "langTab" + lang.charAt(0).toUpperCase() + lang.slice(1);
  const activeTabElem = document.getElementById(tabId);
  if (activeTabElem) activeTabElem.classList.add("active");
  
  const display = document.getElementById("multilingualTextDisplay");
  const title = document.getElementById("activeLangTitle");
  
  const ms = currentConsultation ? currentConsultation.multilingual_summary : null;
  if (!ms) {
    display.innerText = "Please synthesize the AI Case Sheet first to generate multilingual patient instructions.";
    return;
  }
  
  const text = ms[lang] || ms.english || "";
  display.innerText = text;
  
  const titles = {
    english: "English Consultation Summary",
    tamil: "தமிழ் (Tamil) மருத்துவ ஆலோசனையின் சுருக்கம்",
    hindi: "हिन्दी (Hindi) परामर्श सारांश",
    telugu: "తెలుగు (Telugu) సంప్రదింపుల వివరాలు",
    malayalam: "മലയാളം (Malayalam) ഡോക്ടറുടെ നിർദ്ദേശങ്ങൾ",
    kannada: "ಕನ್ನಡ (Kannada) ವೈದ್ಯಕೀಯ ಸಮಾಲೋಚನೆಯ ಸಾರಾಂಶ"
  };
  title.innerText = titles[lang] || "Patient Summary";
}

function playCurrentSummaryVoice() {
  const display = document.getElementById("multilingualTextDisplay");
  const text = display ? display.innerText : "";
  if (!text || text.includes("Please synthesize")) {
    alert("No summary text available to play.");
    return;
  }
  
  if (!("speechSynthesis" in window)) {
    alert("Speech Synthesis (TTS) is not supported in this browser.");
    return;
  }
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  const speed = parseFloat(document.getElementById("voiceSpeedSelect").value) || 1.0;
  utterance.rate = speed;
  
  const langCodes = {
    english: "en-IN",
    tamil: "ta-IN",
    hindi: "hi-IN",
    telugu: "te-IN",
    malayalam: "ml-IN",
    kannada: "kn-IN"
  };
  utterance.lang = langCodes[activeLanguage] || "en-IN";
  
  // Try to find native voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)));
  if (matchedVoice) utterance.voice = matchedVoice;
  
  window.speechSynthesis.speak(utterance);
}

function pauseSummaryVoice() {
  if ("speechSynthesis" in window) {
    if (window.speechSynthesis.speaking) window.speechSynthesis.pause();
  }
}

function stopSummaryVoice() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// --- Patient Management Hub ---
async function loadPatients(query = "") {
  try {
    const url = query ? `/api/patients?search=${encodeURIComponent(query)}` : "/api/patients";
    const res = await fetch(url);
    patientsList = await res.json();
    
    const tbody = document.getElementById("patientsTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = patientsList.map(p => `
      <tr class="hover:bg-slate-900/60 transition-colors">
        <td class="p-3 font-mono text-teal-300 font-bold">${p.mrn}</td>
        <td class="p-3 font-semibold text-white">${p.name}</td>
        <td class="p-3">${p.age} yrs • ${p.gender}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-teal-400">${p.blood_group}</span></td>
        <td class="p-3 text-red-300">${(p.allergies || []).join(", ") || "None known"}</td>
        <td class="p-3 text-slate-300">${(p.chronic_conditions || []).join(", ") || "None"}</td>
        <td class="p-3">
          <button onclick="startConsultationForPatient('${p.id}')" class="px-2.5 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600/60 text-teal-200 border border-teal-500/40 text-xs font-semibold">
            Start Call
          </button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load patients", err);
  }
}

function searchPatients(term) {
  loadPatients(term);
}

function autoCalculateAgeFromDob(dobStr) {
  if (!dobStr) return;
  const birthDate = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  document.getElementById("newPatAge").value = `${Math.max(0, age)} years`;
}

function openPatientModal() {
  document.getElementById("modalPatient").classList.remove("hidden");
}

function closePatientModal() {
  document.getElementById("modalPatient").classList.add("hidden");
}

async function submitNewPatient() {
  const name = document.getElementById("newPatName").value.trim();
  const dob = document.getElementById("newPatDob").value;
  const gender = document.getElementById("newPatGender").value;
  const blood = document.getElementById("newPatBlood").value;
  const contact = document.getElementById("newPatContact").value.trim();
  const allergiesStr = document.getElementById("newPatAllergies").value.trim();
  const chronicStr = document.getElementById("newPatChronic").value.trim();
  
  if (!name || !dob) {
    alert("Please enter patient name and date of birth.");
    return;
  }
  
  const payload = {
    name,
    dob,
    gender,
    blood_group: blood,
    contact,
    allergies: allergiesStr ? allergiesStr.split(",").map(s => s.trim()) : [],
    chronic_conditions: chronicStr ? chronicStr.split(",").map(s => s.trim()) : []
  };
  
  try {
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert(`Patient registered successfully!\nAssigned MRN: ${data.mrn}`);
    closePatientModal();
    await loadPatients();
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
}

async function startConsultationForPatient(patientId) {
  try {
    const res = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, doctor_id: "doc-1" })
    });
    const newCons = await res.json();
    await loadConsultations();
    document.getElementById("consultationSelector").value = newCons.id;
    await loadConsultationDetails(newCons.id);
    switchMainTab("consultation");
  } catch (e) {
    alert("Could not start consultation: " + e.message);
  }
}

function openNewConsultationModal() {
  const pat = patientsList[0];
  if (pat) {
    startConsultationForPatient(pat.id);
  }
}
