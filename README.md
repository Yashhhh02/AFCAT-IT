# AFCAT 01/2027 + TCS CodeVita Unified Dual-Track Preparation Tracker

> An offline-first, dual-target study dashboard designed to balance full-time preparation for **AFCAT 01/2027 (Flying / Ground Duty branches)** and **TCS CodeVita Season 13** competitive programming.

Built with pure vanilla web technologies (HTML5, CSS3 with modern CSS custom properties, vanilla ES Modules, and `localStorage`). Zero dependencies, zero build steps, and 100% private.

---

## 🎯 What This Project Is

This tracker combines two high-stakes technical preparation tracks into one synchronized daily workflow:

1. **AFCAT 01/2027 Track**:
   - Structured 77-day syllabus covering Numerical Ability, Reasoning & Military Aptitude, English Comprehension, and General Awareness.
   - Key target timestamp: **31 January 2027 at 10:00 AM IST** (Report 08:00 AM, Last Entry 09:00 AM).
   - Targeted branches: Ground Duty (Non-Technical: Administration, Logistics).
   - Integrated full-length 100-question mock exams on days 28, 35, 42, 49, and 55.

2. **TCS CodeVita Season 13 Track**:
   - 56-day core algorithmic problem-solving sprint + 21 days of daily maintenance (Days 57–77).
   - Covers official CodeVita PYQs, curated video masterclasses, LeetCode patterns, and Saturday 3-hour mock contest simulations (Days 27, 34, 41, 48, and Day 54 Mock 5).
   - Fallback reference integration: If you need additional practice problems, day cards link directly to corresponding days on the open-source reference tracker.

3. **Daily Habit & Career Engine**:
   - Fixed daily time blocks for morning stamina runs, active recall note reviews, 5 daily job applications, and nightly vocabulary/formula drills.
   - Interactive live 24-hour daily timetable showing current time slot highlights.

---

## 🚀 How to Run Locally

Because this project utilizes standard ECMAScript modules (`import`/`export`) and fetches local JSON datasets (`fetch('data/...')`), browsers prevent direct execution via `file://` due to CORS/security sandboxing. You must serve the directory using a lightweight local web server.

### Option 1: Python (Recommended, Pre-installed on most systems)
Open PowerShell or your terminal in this repository directory and run:

```bash
python -m http.server 3000 --bind 127.0.0.1
```

Then open your browser and navigate to:
```
http://127.0.0.1:3000/
```

### Option 2: Node.js / npx serve
If you have Node.js installed:

```bash
npx serve -l 3000
```
Then navigate to `http://localhost:3000/`.

---

## 🧪 Running Automated Tests

A dedicated test suite containing **52 comprehensive test cases across 8 suites** verifies all date math, storage persistence, countable registries, schedule types, and question filters:

1. Start your local server using either method above.
2. Open your browser and navigate to:
   ```
   http://127.0.0.1:3000/tests.html
   ```
3. All suites run automatically in real-time, verifying:
   - Timezone-safe midnight calendar math and leap-year compliance.
   - Item key generation and countable status.
   - CodeVita Sunday rest exclusions and Day 54/55/56 mock configurations.
   - Question bank real-time search, multi-filter logic, and stable item synchronization.

---

## 🛠️ How to Edit or Customize Data

All schedule and content metadata is separated into clean JSON files inside the `data/` folder:

| File | Purpose | What You Can Edit |
|---|---|---|
| `data/plan-data.json` | Master plan structure | Week themes, AFCAT topics (Maths, English, GA), timetable blocks, exam facts, and Day 0 setup checklist items. |
| `data/cv-days.json` | 56-day CodeVita curriculum | Problem titles, video links, PYQs, platform tags, and topic groupings. |
| `data/questions.json` | Master question bank | Curated coding problems and AFCAT sectional practice questions. |
| `data/bonus.json` | Extra reference links | YouTube playlists, documentation portals, and community resources. |

Any modifications made to these JSON files take effect immediately upon refreshing the page.

---

## 📅 Start Date Flexibility & Progress Persistence

### How "My Start Date" Works
- The default plan start date is **16 November 2026** (a Monday).
- If your schedule shifts, enter your new start date in the **"My start date"** input located in the Hero header or Plan controls.
- **Progress is never lost when dates change**: Every checklist item is identified by a stable key (e.g. `1|afcat|blockA` or `1|cv|d1-v1`). Changing the start date simply shifts the calendar dates assigned to Day 1, Day 2, etc., while all checked items, notes, and mock scores remain pinned to their respective plan days.

### `localStorage` Storage Model
All user data is stored entirely in your browser under the key:
```
afcat-cv-plan-v1
```

The stored schema:
```json
{
  "startDate": "2026-11-16",
  "round1Date": null,
  "theme": "dark",
  "trackFilter": "both",
  "completed": [
    "0|check|0",
    "1|afcat|blockA",
    "1|cv|d1-v1"
  ],
  "mockScores": {
    "afcat-1": { "score": "182", "max": "300", "notes": "Quant accurate; need speed in English" }
  },
  "errorLog": {
    "day-1": "Formulas to review: Time & Work shortcuts"
  }
}
```

### Export & Import (Backup Your Data)
1. **Export**: In the top navigation bar, click **"Export"** to download your complete progress as a timestamped JSON file (`afcat-cv-progress-<date>.json`).
2. **Import**: Click **"Import"**, select your previously saved JSON backup file, and your progress, custom dates, and mock logs will be fully restored.
3. **Reset**: The **"Reset my progress"** button allows you to clear completed items while prompting for confirmation.

---

## 🌐 Deploying to GitHub Pages

This repository is pre-configured for instant zero-configuration deployment to GitHub Pages. All internal links, stylesheet paths, script imports, and data fetch URLs are strictly relative.

### 1. Initialize and Push to GitHub (PowerShell)
Run the following commands in your local project folder:

```powershell
# 1. Initialize git repository (if not already initialized)
git init

# 2. Stage all deployable project files (.gitignore keeps scratch & screenshots out)
git add .

# 3. Create initial commit
git commit -m "feat: complete AFCAT + CodeVita dual-track tracker with Phase 8 deploy readiness"

# 4. Ensure branch is named 'main'
git branch -M main

# 5. Link to your personal GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. Push to GitHub
git push -u origin main
```

### 2. Enable GitHub Pages
1. Open your repository on GitHub.
2. Go to **Settings** -> **Pages** (under the "Code and automation" section).
3. Under **Build and deployment -> Source**, select **"Deploy from a branch"**.
4. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
5. Within 1–2 minutes, your live site will be accessible at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

---

## ⚖️ Credits & Disclaimers

- **CodeVita Curriculum & Problem Picks**: The 56-day schedule, curated problems, and video recommendations are adapted from **Perry Vegehan's CodeVita tracker** ([https://perryvegehan.github.io/Codevita/](https://perryvegehan.github.io/Codevita/)) under fair-use educational reference. All original problem links and video sources have been preserved with direct attribution.
- **AFCAT Syllabus & Timelines**: AFCAT 01/2027 syllabus structure, exam pattern, branch eligibility, marking scheme, and reporting schedules are compiled from official **Indian Air Force** notifications published on official portals ([afcat.cdac.in](https://afcat.cdac.in) / [afcat.edcil.co.in](https://afcat.edcil.co.in)).
- **TCS CodeVita Rules**: TCS CodeVita competition structure, mock formatting, and platform rules are sourced from official **TCS NextStep & CodeVita** portals.
- **Disclaimer**: This is an independent, open-source personal study tracker created strictly for educational purposes. It is **not** affiliated with, endorsed by, or connected to the Indian Air Force, Centre for Development of Advanced Computing (C-DAC), or Tata Consultancy Services (TCS).

