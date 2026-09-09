# 🌐 Global Intel & Telemetry (UGI)

Production-grade planetary intelligence, geopolitical crisis telemetry, and 3D globe visualization platform with real-time news ingestion and Supabase PostgreSQL persistence.

---

## 🚀 Quick Start

### 1. Database Setup (Supabase)
1. In your [Supabase Dashboard](https://supabase.com), create a new project.
2. Go to the **SQL Editor** in Supabase and paste the contents of `database/schema.sql`.
3. Click **Run** to generate the four core tables (`users`, `news`, `alerts`, `logs`) and RLS policies.
4. Go to **Project Settings -> API** to retrieve your Project URL and `anon` public key.

### 2. Backend Setup & Run
```bash
cd backend
# (Optional) Add your Supabase URL & Key to .env
cp .env.example .env

# Install dependencies (already installed if done previously)
npm install

# Start Express telemetry backend server (port 5000)
npm start
```

### 3. Frontend Setup & Run
```bash
cd ../frontend
# (Optional) Add your Supabase credentials to .env
cp .env.example .env

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🗄️ Database Architecture (Supabase Tables)

| Table | Columns | Purpose |
|---|---|---|
| **`users`** | `id`, `name`, `persona`, `created_at` | Stores operational user personas (`Analyst`, `Casual user`, `Accessibility mode`) |
| **`news`** | `id`, `title`, `description`, `url`, `country`, `topic`, `source`, `sentiment`, `created_at` | Real-time verified articles ingested with clickable direct publisher links |
| **`alerts`** | `id`, `message`, `severity`, `country`, `source_url`, `created_at` | Autonomous threats flagged via keyword scanning (`war`, `crisis`, `cyberattack`, etc.) |
| **`logs`** | `id`, `user_action`, `persona`, `metadata`, `timestamp` | Full telemetry audit trail recording user navigations and sector switches |

---

## 🌟 Key Features

1. **100% Real Authentic News**: Direct verified feeds from international publications with click-through redirection to original articles.
2. **Interactive 3D WebGL Globe**: 3D orbital cyber earth (`globe.gl` / Three.js) with real-time threat heatmap rings, telemetry signal arcs, and click-to-focus navigation.
3. **Autonomous Alert Engine**: Sentiment and critical keyword scanning with multi-tier severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
4. **Adaptive Persona Matrix**:
   - **Analyst**: Deep telemetry metrics, raw sentiment scores, JSON telemetry views.
   - **Casual Observer**: Digestible headlines, high-level planetary summary.
   - **Accessibility Mode**: High contrast, audio narrations, large buttons.
5. **Complete Accessibility Suite**:
   - **Text-to-Speech (TTS)**: Web Speech API narration on any news card.
   - **Voice Summary**: One-click audio briefing synthesizing sector alerts and top dispatches.
   - **High Contrast**: Yellow/cyan on ultra-black palette.
   - **Large Text**: Scaled typography for low-vision readability.
   - **Cognitive Simplified UI**: Intuitive pictogram interface.
6. **Supabase Live Explorer**: In-dashboard inspector for browsing rows in `users`, `news`, `alerts`, and `logs`.
7. **Autonomous Live Ingestion**: Automatic 30-second interval refresh and background worker.
