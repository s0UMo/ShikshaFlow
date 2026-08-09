# 🎓 ShikshaFlow (शिक्षाFlow)

> **Personalized, Adaptive & Regional Multilingual Learning Platform for Mathematics.**  
> *Empowering K-12 education in India and emerging markets with real-time AI difficulty adaptation, 12+ native Indian languages, and offline-first PWA resilience.*

---

## 🌟 Key Features

### 🧠 1. Adaptive Difficulty Engine
* **Real-Time Skill Evaluation:** Dynamic algorithm evaluates student accuracy and response times (`lastResponseTimeMs`) to automatically adjust question difficulty.
* **3 Adaptive Tiers:** **EASY** (Foundational) ➔ **MEDIUM** (Application) ➔ **HARD** (Problem Solving).
* **Instant Level-Up Feedback:** Celebratory toasts and achievement badges unlocked upon streak milestones.

### 🌐 2. 12+ Native Indian Language Engine
* **Zero-Latency Localization:** Instant switching between **English, Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, and Urdu**.
* **Formula Preservation:** Keeps mathematical notation (`3/8 + 2/8 = 5/8`) intact while translating problem statements, explanations, and options.
* **Hybrid Translation Pipeline:** Uses a high-speed pre-compiled local dictionary combined with on-demand AI translation for unseen questions.

### 🤖 3. AI Custom Quiz Generator
* **Topic-Based Generation:** Teachers and students can generate curriculum-aligned quizzes on any math topic (e.g., *Fractions, Decimals, Ratios, Geometry*).
* **Comprehensive Explanations:** Every generated question comes with step-by-step solutions and option breakdowns.

### 📶 4. Offline-First Progressive Web App (PWA)
* **Zero Bandwidth Dependency:** Built using Workbox Service Workers. Once loaded, the app runs completely offline.
* **Local Attempt Queue:** Quizzes and attempts taken offline are queued in `LocalStorage` and automatically synced when connection is restored.
* **Ultra-Lightweight Footprint:** Optimized asset bundle (<3MB) tailored for low-cost $50 smartphones and budget school hardware.

### 📊 5. Real-Time Teacher Analytics & Telemetry
* **Classroom Dashboard:** Gives educators real-time visibility into student proficiency, average completion times, and mastery gaps.
* **Custom Question Authoring:** Teachers can create custom questions with automated English-to-Hindi/Regional translation.

### 🎨 6. Modern Tech UI & WebGL Shader Animations
* **State-of-the-Art Dark Aesthetic:** Custom dark theme `#0a0a0a` with emerald green accents (`#3ecf8e`).
* **GPU-Accelerated Shaders:** Features custom WebGL shaders (`DarkVeil`, `Aurora`) and Canvas 2D displacement text (`FuzzyText`).

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Core** | React 18, TypeScript, Vite 8 |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Custom CSS Design System |
| **Graphics & Shaders** | WebGL (`OGL`), Three.js (`three`), Canvas 2D |
| **PWA & Offline** | Workbox Service Worker, Web App Manifest, Cache API |
| **Database & Auth** | Firebase Firestore, Firebase Auth |
| **AI Translation & Generation** | Groq AI (Llama 3), Google Gemini API |

---

## 📂 Project Structure

```
shikshaflow/
├── src/
│   ├── components/       # Reusable UI & WebGL shader components (DarkVeil, Aurora, FuzzyText, Navbar)
│   ├── data/             # Seed math question databases & regional translations
│   ├── pages/            # Main application views
│   │   ├── Home.tsx              # Landing page with interactive live preview
│   │   ├── StudentDashboard.tsx  # Student progress & topic selector
│   │   ├── StudentQuiz.tsx       # Adaptive quiz environment & multi-lingual engine
│   │   ├── AIQuizGenerator.tsx   # Custom AI quiz creation interface
│   │   ├── TeacherDashboard.tsx  # Analytics telemetry & question management
│   │   ├── Login.tsx             # Role-based authentication (Student/Teacher)
│   │   └── NotFound.tsx          # Branded custom 404 page
│   ├── services/         # Core business logic
│   │   ├── aiQuizService.ts         # AI quiz generation pipeline
│   │   ├── aiTranslationService.ts  # Multi-lingual AI translation service
│   │   ├── translationEngine.ts     # Local zero-latency dictionary & phrase engine
│   │   ├── questionService.ts       # Firebase Firestore question CRUD & sync
│   │   └── i18nService.ts           # Language configuration registry
│   ├── types/            # TypeScript schemas & data models
│   └── App.tsx           # Router configuration & ambient layout
├── public/               # PWA icons & manifest assets
├── .env.example          # Environment variable template
├── package.json          # Dependencies & build scripts
└── vite.config.ts        # Vite & PWA plugin build setup
```

---

## ⚡ Quick Start & Installation

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/s0UMo/ShikshaFlow.git
cd ShikshaFlow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and insert your API keys:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=shikshaflow-1196a
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```

---

## 🌐 Regional Language Support Matrix

| Language | Code | Local Dictionary | AI Fallback |
| :--- | :---: | :---: | :---: |
| **English** | `en` | ✅ Native | ✅ |
| **Hindi (हिंदी)** | `hi` | ✅ Native | ✅ |
| **Bengali (বাংলা)** | `bn` | ✅ Native | ✅ |
| **Telugu (తెలుగు)** | `te` | ✅ Native | ✅ |
| **Tamil (தமிழ்)** | `ta` | ✅ Native | ✅ |
| **Marathi (मराठी)** | `mr` | ✅ Native | ✅ |
| **Gujarati (ગુજરાતી)** | `gu` | ✅ Native | ✅ |
| **Kannada (ಕನ್ನಡ)** | `kn` | ✅ Native | ✅ |
| **Malayalam (മലയാളം)** | `ml` | ✅ Native | ✅ |
| **Punjabi (ਪੰਜਾਬੀ)** | `pa` | ✅ Native | ✅ |
| **Odia (ଓଡ଼ିଆ)** | `or` | ✅ Native | ✅ |
| **Assamese (অসমীয়া)** | `as` | ✅ Native | ✅ |
| **Urdu (اردو)** | `ur` | ✅ Native | ✅ |

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p center>Crafted for regional education equality. 💚 <strong>ShikshaFlow Team</strong></p>
