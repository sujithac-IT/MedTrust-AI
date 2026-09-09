# 🏥 MediTrust AI — AI-Powered Clinical Consultation Platform

> **Building Trust. Saving Lives. Caring Beyond Consultation.**
>
> An AI-powered healthcare consultation platform centered around Google Meet, with structured clinical case-sheet generation, doctor review/approval workflow, and patient medical history.

---

## ✨ Key Features

### 1. Google Meet Consultation Studio
* **Dominant visual interface** with Google Meet integration
* Live webcam preview with audio waveform visualization
* Meeting creation via Google Meet Spaces API & Calendar API
* Real-time call timer and controls (mute, camera, screen share)
* Automatic meeting URL generation

### 2. AI-Powered Transcript Processing
* Transcript retrieval via Google Meet REST API (`spaces/{space}/transcripts`)
* Real-time live transcription display during consultation
* Normalized doctor/patient turn separation
* Rich demonstration mode with clinical sample transcripts

### 3. 17-Section Structured Case Sheet
* **Gemini AI** structured clinical extraction (or local NLP fallback)
* Sections: Patient Info, Chief Complaint, HPI, Symptoms, Duration, Past Medical History, Medications, Allergies, Family History, Social History, Doctor Observations, Investigations, Assessment, Treatment Plan, Follow-up, Missing Information, Uncertain Information
* Edit/Preview toggle with inline field editing
* Medications table with add/remove support
* Print/PDF-ready layout with hospital branding
* Multilingual summary with voice playback (English, Tamil, Hindi, Telugu, Malayalam, Kannada)

### 4. Doctor Approval Workflow
* Clinical verification modal with review checkbox
* Doctor credentials display and electronic sign-off
* Approval timestamp recording
* Approved records become read-only

### 5. Patient Management
* Patient list with search functionality
* New patient creation with validated demographics
* Auto-calculated age from date of birth
* Allergy and medical condition tracking

### 6. Medical History
* Complete consultation history per patient
* Historical case sheet viewer with full 17-section display
* Cross-consultation record viewer on Dashboard

### 7. Multi-Role Authentication
* Doctor and Patient role-based access
* Firebase Authentication with demo mode fallback
* Protected routes and session management

---

## 🛠️ Technology Stack

* **Frontend**: React 18, React Router v6, Vite 5
* **Styling**: CSS Custom Properties, Google Material Design aesthetic, Inter & Plus Jakarta Sans fonts
* **AI Engine**: Google Gemini 1.5 Flash API + Built-in Clinical NLP extraction
* **Backend & Auth**: Firebase Authentication, Firestore
* **Video**: Google Meet API, Google Calendar API, WebRTC (webcam preview)
* **Voice**: Web Speech Synthesis API (multilingual TTS)
* **Build**: Vite 5, Node.js

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ and npm

### Installation
```bash
git clone <repo-url>
cd medtrust-ai
npm install
```

### Development
```bash
npm run dev
```

The application runs in **full Demo Mode** without any external credentials. All workflows (Google Meet, transcription, AI extraction, approval, history) are fully functional.

### Production Build
```bash
npm run build
npm run preview
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Firebase Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy Web App credentials to `.env.local`

### Google Meet Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Meet API** and **Google Calendar API**
3. Create **OAuth 2.0 Client ID** (Web application type)
4. Add authorized redirect URIs
5. Copy Client ID and API Key to `.env.local`

### Gemini AI Setup
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Add to `.env.local` as `VITE_GEMINI_API_KEY`

---

## 📁 Project Structure

```
src/
├── components/
│   ├── CaseSheetEditor.jsx      # 17-section editable case sheet
│   ├── DoctorApprovalModal.jsx   # Approval verification dialog
│   ├── GoogleMeetStudio.jsx      # Google Meet video consultation
│   ├── InteractiveBackground.jsx # Parallax background
│   ├── MedicalCanvas.jsx         # 3D particle network
│   ├── Navbar.jsx                # Navigation bar
│   ├── PatientManagementModal.jsx # New patient creation
│   └── Toast.jsx                 # Toast notifications
├── contexts/
│   └── AuthContext.jsx           # Authentication state
├── pages/
│   ├── DoctorWorkspace.jsx       # Main consultation workflow
│   ├── Landing.jsx               # Landing page
│   ├── Login.jsx                 # Authentication page
│   └── PatientView.jsx           # Patient medical records
├── services/
│   ├── geminiService.js          # Gemini AI extraction
│   ├── googleMeet.js             # Google Meet integration
│   └── patientService.js         # Patient CRUD
├── types/
│   └── consultation.js           # Data schemas & state machine
├── utils/
│   └── gemini.js                 # Legacy AI pipeline + TTS
├── styles/
│   └── index.css                 # Complete design system
├── firebase.js                   # Firebase configuration
├── App.jsx                       # Router & protected routes
└── main.jsx                      # Entry point
```

---

## 🔐 Security

* Authentication required for all clinical functionality
* Role-based access control (Doctor/Patient)
* Server-side API key handling (Gemini called from client only with user's own key)
* No sensitive medical data in URLs, client logs, or error messages
* Input validation on all forms
* Secure error handling with user-friendly messages

---

## 📋 Workflow

```
Doctor Login
→ Dashboard (Patient List + History)
→ Select/Create Patient
→ Consultation Created (Google Meet)
→ Start Consultation (Live Transcription)
→ End Consultation
→ Transcript Processing
→ Gemini AI / Local NLP Extraction
→ 17-Section Case Sheet
→ Doctor Review & Edit
→ Doctor Approval (Verification Modal)
→ Saved to Patient Medical History
```

---

## 🧪 Demo Logins

* **Doctor Portal**: `doctor@demo.com` (any password)
* **Patient Hub**: `patient@demo.com` (any password)

---

## 📌 Status

### Implemented ✅
- [x] Doctor authentication & session management
- [x] Patient management (list, search, create)
- [x] Consultation creation with state machine
- [x] Google Meet Studio with webcam & controls
- [x] Live transcription display
- [x] Gemini API structured extraction
- [x] Built-in clinical NLP fallback
- [x] 17-section editable case sheet
- [x] Doctor approval workflow with verification
- [x] Patient medical history
- [x] Multilingual summary & voice
- [x] Print-ready case sheets
- [x] Demo mode (full functionality without credentials)

### Requires External Configuration 🔧
- [ ] Live Google Meet video via Google Meet API (needs OAuth credentials)
- [ ] Real transcript retrieval from Google Meet (needs Google Meet API access)
- [ ] Gemini AI extraction (needs API key; falls back to local NLP)
- [ ] Firestore persistence (needs Firebase project; falls back to in-memory)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
