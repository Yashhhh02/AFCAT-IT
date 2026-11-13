/**
 * ====================================================================
 * RENDER/MOCKS.JS — AFCAT & CodeVita Mocks Tracker
 * Features:
 * - 12 AFCAT Full Mocks derived from plan
 * - Score inputs (0-300, validated, saved locally)
 * - Delta badges (green >= target, amber within 15, red below)
 * - Shared plan completion checkboxes (1:1 with plan items)
 * - Pure SVG line chart: Target vs Actual scores + 180 Safe Zone
 * - 5 CodeVita 3-hour Mocks with strategy notes
 * - Error Log mini panel for weak topics recording
 * ====================================================================
 */

import { getState, isDone, setDone, setMockScore, setMockNotes, setMockErrorLog, getMock, subscribe } from "../store.js";
import { getDateForDay, formatShortDate } from "../dates.js";
import { openAndScrollToDay } from "./plan.js";

// Master AFCAT Mocks Definition (Derived from the 11-Week Plan)
export const AFCAT_MOCKS_SCHEDULE = [
  { num: 1, day: 28, target: 110, planItemId: "28|afcat|sun", label: "AFCAT Full Mock 1" },
  { num: 2, day: 35, target: 120, planItemId: "35|afcat|sun", label: "AFCAT Full Mock 2" },
  { num: 3, day: 42, target: 130, planItemId: "42|afcat|sun", label: "AFCAT Full Mock 3" },
  { num: 4, day: 49, target: 140, planItemId: "49|afcat|sun", label: "AFCAT Full Mock 4" },
  { num: 5, day: 55, target: 150, planItemId: "55|afcat|sat", label: "AFCAT Full Mock 5" },
  { num: 6, day: 57, target: 160, planItemId: "57|afcat|blockA", label: "AFCAT Full Mock 6" },
  { num: 7, day: 59, target: 170, planItemId: "59|afcat|blockA", label: "AFCAT Full Mock 7" },
  { num: 8, day: 62, target: 175, planItemId: "62|afcat|sat", label: "AFCAT Full Mock 8" },
  { num: 9, day: 64, target: 180, planItemId: "64|afcat|blockA", label: "AFCAT Full Mock 9" },
  { num: 10, day: 66, target: 185, planItemId: "66|afcat|blockA", label: "AFCAT Full Mock 10" },
  { num: 11, day: 68, target: 190, planItemId: "68|afcat|blockA", label: "AFCAT Full Mock 11" },
  { num: 12, day: 71, target: 195, planItemId: "71|afcat|blockA", label: "AFCAT Full Mock 12" }
];

// Master CodeVita Mocks Definition (Days 27, 34, 41, 48, 54)
export const CODEVITA_MOCKS_SCHEDULE = [
  { num: 1, day: 27, label: "CodeVita Mock 1", title: "Full 3-Hour Simulation (Div. 3 + Sample)", planItemId: "27|cv|d27-m1" },
  { num: 2, day: 34, label: "CodeVita Mock 2", title: "Full 3-Hour Simulation (Div. 3 + Sample)", planItemId: "34|cv|d34-m1" },
  { num: 3, day: 41, label: "CodeVita Mock 3", title: "Full 3-Hour Simulation (Div. 3 + Speed)", planItemId: "41|cv|d41-m1" },
  { num: 4, day: 48, label: "CodeVita Mock 4", title: "Full 3-Hour Simulation (Div. 3 + Hard PYQ)", planItemId: "48|cv|d48-m1" },
  { num: 5, day: 54, label: "CodeVita Mock 5", title: "Final Dress Rehearsal (MockVita / Live Simulation)", planItemId: "54|cv|d54-m1" }
];

/**
 * Renders the entire Mocks Tracker section
 */
export function renderMocks() {
  const container = document.getElementById("mocksContainer");
  if (!container) return;

  const state = getState();
  const startISO = state.startDate || "2026-11-16";

  container.innerHTML = `
    <!-- Top Chart & Trajectory Section -->
    <div class="mock-chart-card">
      <div class="chart-header">
        <div>
          <h3 class="chart-title">AFCAT Target Trajectory vs Actual Scores</h3>
          <p class="chart-sub" id="chartLatestSentence">Enter mock scores below to track your trajectory towards 180+.</p>
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot target"></span>Target Score</span>
          <span class="legend-item"><span class="legend-dot actual"></span>Actual Score</span>
          <span class="legend-item"><span class="legend-dot safe"></span>Safe Zone (180)</span>
        </div>
      </div>

      <div class="chart-svg-wrap" id="mockSvgChartContainer">
        <!-- Injected by renderSvgChart() -->
      </div>
    </div>

    <!-- Dual Mocks Navigation Tabs -->
    <div class="mock-tabs-strip">
      <button class="mock-tab active" data-tab="afcat">AFCAT Full Mocks (12)</button>
      <button class="mock-tab" data-tab="cv">CodeVita 3h Mocks (5)</button>
      <button class="mock-tab" data-tab="error-log">Error Log & Topics to Repair</button>
    </div>

    <!-- Tab 1: AFCAT Full Mocks Grid -->
    <div class="mock-tab-pane active" id="paneAfcatMocks">
      <div class="mock-cards-grid">
        ${AFCAT_MOCKS_SCHEDULE.map(m => renderAfcatMockCard(m, startISO)).join("")}
      </div>
    </div>

    <!-- Tab 2: CodeVita Mocks Grid -->
    <div class="mock-tab-pane" id="paneCvMocks">
      <div class="mock-cards-grid">
        ${CODEVITA_MOCKS_SCHEDULE.map(m => renderCvMockCard(m, startISO)).join("")}
      </div>
    </div>

    <!-- Tab 3: Error Log Mini Panel -->
    <div class="mock-tab-pane" id="paneErrorLog">
      <div class="error-log-panel">
        <div class="error-log-header">
          <h3>Mock Error Log & Weak Topics</h3>
          <p class="muted">Record recurring traps, silly mistakes, and topics needing revision after each mock analysis.</p>
        </div>
        <div class="error-log-list">
          ${AFCAT_MOCKS_SCHEDULE.map(m => renderErrorLogEntry(m, startISO)).join("")}
        </div>
      </div>
    </div>
  `;

  renderSvgChart();
  attachMockEventListeners(container);

  // Subscribe to store updates to keep checkboxes in sync
  subscribe(() => {
    updateAllCheckboxStates();
    renderSvgChart();
  });
}

/**
 * Builds HTML for an AFCAT mock card
 */
function renderAfcatMockCard(m, startISO) {
  const mockId = `m${m.num}`;
  const mockData = getMock(mockId);
  const done = isDone(m.planItemId);
  const dateObj = getDateForDay(m.day, startISO);
  const dateFormatted = formatShortDate(dateObj, false);

  const deltaBadge = getDeltaBadgeHtml(mockData.score, m.target);

  return `
    <article class="mock-card afcat ${done ? 'completed' : ''}" data-mock-id="${mockId}">
      <div class="mock-card-top">
        <div>
          <span class="tag afcat">Mock ${m.num} · Day ${m.day}</span>
          <h4 class="mock-title">${escapeHTML(m.label)}</h4>
          <span class="mock-date">${escapeHTML(dateFormatted)}</span>
        </div>
        <label class="mock-complete-label" title="Mark mock completed in Plan">
          <input type="checkbox" class="mock-complete-cb" data-plan-item-id="${m.planItemId}" ${done ? 'checked' : ''}>
          <span>Done</span>
        </label>
      </div>

      <div class="mock-scores-row">
        <div class="score-field">
          <span class="score-label">Target</span>
          <span class="target-number">${m.target}</span>
        </div>
        <div class="score-field">
          <label class="score-label" for="scoreInput-${mockId}">Your Score</label>
          <input type="number" id="scoreInput-${mockId}" class="score-input" min="0" max="300" placeholder="0–300" value="${mockData.score !== null ? mockData.score : ''}" data-mock-id="${mockId}" data-target="${m.target}">
        </div>
        <div class="score-field delta-field" id="deltaWrap-${mockId}">
          <span class="score-label">Result</span>
          ${deltaBadge}
        </div>
      </div>

      <div class="mock-card-footer">
        <button class="btn-day-jump-link" data-day="${m.day}">Jump to Day ${m.day} in Plan ↗</button>
      </div>
    </article>
  `;
}

/**
 * Builds HTML for a CodeVita mock card
 */
function renderCvMockCard(m, startISO) {
  const mockId = `cv-m${m.num}`;
  const mockData = getMock(mockId);
  const done = isDone(m.planItemId);
  const dateObj = getDateForDay(m.day, startISO);
  const dateFormatted = formatShortDate(dateObj, false);

  return `
    <article class="mock-card cv ${done ? 'completed' : ''}" data-mock-id="${mockId}">
      <div class="mock-card-top">
        <div>
          <span class="tag mock">Mock ${m.num} · Day ${m.day}</span>
          <h4 class="mock-title">${escapeHTML(m.label)}</h4>
          <p class="mock-desc">${escapeHTML(m.title)}</p>
          <span class="mock-date">${escapeHTML(dateFormatted)}</span>
        </div>
        <label class="mock-complete-label" title="Mark mock completed in Plan">
          <input type="checkbox" class="mock-complete-cb" data-plan-item-id="${m.planItemId}" ${done ? 'checked' : ''}>
          <span>Done</span>
        </label>
      </div>

      <div class="mock-notes-box">
        <label class="score-label" for="notesInput-${mockId}">Contest Strategy & Upsolve Notes</label>
        <textarea id="notesInput-${mockId}" class="mock-notes-textarea" data-mock-id="${mockId}" placeholder="What went wrong? (e.g. Q1 solved in 25 min, Q2 timed out on Python recursion, need to upsolve with BFS)...">${escapeHTML(mockData.notes)}</textarea>
      </div>

      <div class="mock-card-footer">
        <button class="btn-day-jump-link" data-day="${m.day}">Jump to Day ${m.day} in Plan ↗</button>
      </div>
    </article>
  `;
}

/**
 * Builds HTML for Error Log entry
 */
function renderErrorLogEntry(m, startISO) {
  const mockId = `m${m.num}`;
  const mockData = getMock(mockId);
  const dateObj = getDateForDay(m.day, startISO);
  const dateFormatted = formatShortDate(dateObj, false);

  return `
    <div class="error-log-entry" data-mock-id="${mockId}">
      <div class="entry-head">
        <strong>${escapeHTML(m.label)} (Day ${m.day} · ${escapeHTML(dateFormatted)})</strong>
        <span class="muted">Target: ${m.target}</span>
      </div>
      <textarea class="error-log-textarea" data-mock-id="${mockId}" placeholder="Record concepts or question types you missed (e.g. Maths: Time & Work alternate days; Reasoning: dot situation; English: prepositions with 'prohibit')...">${escapeHTML(mockData.errorLog)}</textarea>
    </div>
  `;
}

/**
 * Returns formatted delta badge HTML
 */
export function getDeltaBadgeHtml(score, target) {
  if (score === null || score === undefined || score === "") {
    return `<span class="badge muted">Not Taken</span>`;
  }
  const s = Number(score);
  const delta = s - target;

  if (s >= target) {
    return `<span class="badge pass">+${delta} (Target Met)</span>`;
  } else if (s >= target - 15) {
    return `<span class="badge amber">${delta} (Within 15)</span>`;
  } else {
    return `<span class="badge fail">${delta} (Below Target)</span>`;
  }
}

/**
 * Draws the SVG line chart: Actual vs Target with 180 Safe Zone
 */
export function renderSvgChart() {
  const container = document.getElementById("mockSvgChartContainer");
  const sentenceEl = document.getElementById("chartLatestSentence");
  if (!container) return;

  const w = 740;
  const h = 260;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 35;
  const padBottom = 45;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const maxScore = 300;
  const safeScore = 180;

  // Scale helpers
  const getX = (index) => padLeft + (index / (AFCAT_MOCKS_SCHEDULE.length - 1)) * plotW;
  const getY = (val) => padTop + plotH - (val / maxScore) * plotH;

  // Collect data points
  let latestMock = null;
  let hasAnyScore = false;
  const targetPoints = [];
  const actualPoints = [];

  AFCAT_MOCKS_SCHEDULE.forEach((m, idx) => {
    const x = getX(idx);
    const yTarget = getY(m.target);
    targetPoints.push({ x, y: yTarget, mock: m });

    const mockData = getMock(`m${m.num}`);
    if (mockData.score !== null) {
      hasAnyScore = true;
      const yActual = getY(mockData.score);
      actualPoints.push({ x, y: yActual, mock: m, score: mockData.score });
      latestMock = { mock: m, score: mockData.score };
    }
  });

  // Dynamic sentence
  if (sentenceEl) {
    if (latestMock) {
      const diff180 = latestMock.score - safeScore;
      const diffWord = diff180 >= 0 ? `${diff180} pts above` : `${Math.abs(diff180)} pts below`;
      sentenceEl.innerHTML = `Latest: <b>${latestMock.mock.label}</b> score: <b>${latestMock.score}/300</b> (${diffWord} the 180 safe zone · Target was ${latestMock.mock.target}).`;
    } else {
      sentenceEl.textContent = "Enter mock scores below to track your trajectory towards 180+.";
    }
  }

  // Construct target polyline string
  const targetPathStr = targetPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Construct actual polyline string
  const actualPathStr = actualPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Safe zone line Y
  const safeZoneY = getY(safeScore);

  let svg = `
    <svg class="mock-svg" viewBox="0 0 ${w} ${h}" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mock scores line chart">
      <!-- Background Grid Lines & Y-Axis Labels -->
      <g class="chart-grid">
        ${[0, 100, 150, 180, 200, 250, 300].map(val => {
          const y = getY(val);
          const isSafe = val === 180;
          return `
            <line x1="${padLeft}" y1="${y}" x2="${w - padRight}" y2="${y}" stroke="${isSafe ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}" stroke-width="${isSafe ? '1.5' : '1'}" stroke-dasharray="${isSafe ? '6,4' : 'none'}" />
            <text x="${padLeft - 10}" y="${y + 4}" text-anchor="end" fill="${isSafe ? '#10b981' : '#94a3b8'}" font-size="11" font-family="'JetBrains Mono', monospace" font-weight="${isSafe ? '700' : '500'}">${val}</text>
          `;
        }).join("")}
      </g>

      <!-- Safe Zone Callout Tag -->
      <g class="safe-zone-tag">
        <rect x="${w - padRight - 110}" y="${safeZoneY - 12}" width="110" height="20" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1" />
        <text x="${w - padRight - 55}" y="${safeZoneY + 2}" text-anchor="middle" fill="#10b981" font-size="10" font-family="'JetBrains Mono', monospace" font-weight="700">SAFE ZONE (180)</text>
      </g>

      <!-- X-Axis Mock Labels -->
      <g class="chart-x-labels">
        ${targetPoints.map((p, idx) => `
          <text x="${p.x}" y="${h - 18}" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="'JetBrains Mono', monospace">M${idx + 1}</text>
        `).join("")}
      </g>

      <!-- Target Score Line (Dotted Blue) -->
      <polyline points="${targetPathStr}" fill="none" stroke="rgba(56, 189, 248, 0.6)" stroke-width="2" stroke-dasharray="4,4" />

      <!-- Target Score Nodes -->
      ${targetPoints.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#38bdf8" />
      `).join("")}

      <!-- Actual Score Line (Solid Emerald) -->
      ${actualPoints.length > 1 ? `
        <polyline points="${actualPathStr}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ` : ''}

      <!-- Actual Score Circles & Tooltips -->
      ${actualPoints.map(p => `
        <g class="actual-point-node">
          <circle cx="${p.x}" cy="${p.y}" r="6" fill="#10b981" stroke="#0b1120" stroke-width="2" />
          <rect x="${p.x - 18}" y="${p.y - 24}" width="36" height="18" rx="4" fill="#162033" stroke="#10b981" stroke-width="1" />
          <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" fill="#f8fafc" font-size="10" font-family="'JetBrains Mono', monospace" font-weight="800">${p.score}</text>
        </g>
      `).join("")}

      <!-- Empty State if no scores entered -->
      ${!hasAnyScore ? `
        <rect x="${padLeft + 40}" y="${padTop + 45}" width="${plotW - 80}" height="70" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255, 255, 255, 0.1)" />
        <text x="${w / 2}" y="${padTop + 85}" text-anchor="middle" fill="#94a3b8" font-size="13" font-family="'Plus Jakarta Sans', sans-serif">No mock scores entered yet. Enter your scores in the cards below to trace your score curve.</text>
      ` : ''}
    </svg>
  `;

  container.innerHTML = svg;
}

/**
 * Binds tabs, score inputs, completion checkboxes, and notes
 */
function attachMockEventListeners(container) {
  // 1. Tabs switching
  const tabs = container.querySelectorAll(".mock-tab");
  const panes = container.querySelectorAll(".mock-tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPane = document.getElementById(tab.dataset.tab === "afcat" ? "paneAfcatMocks" : tab.dataset.tab === "cv" ? "paneCvMocks" : "paneErrorLog");
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // 2. Score input changes (0-300 validation)
  container.addEventListener("input", (e) => {
    const input = e.target.closest(".score-input");
    if (!input) return;

    const mockId = input.dataset.mockId;
    const target = Number(input.dataset.target);
    const val = input.value.trim();

    const res = setMockScore(mockId, val);
    const deltaWrap = document.getElementById(`deltaWrap-${mockId}`);

    if (res.success) {
      input.classList.remove("invalid");
      if (deltaWrap) {
        deltaWrap.innerHTML = `
          <span class="score-label">Result</span>
          ${getDeltaBadgeHtml(res.score, target)}
        `;
      }
      renderSvgChart();
    } else {
      input.classList.add("invalid");
      if (deltaWrap) {
        deltaWrap.innerHTML = `
          <span class="score-label">Result</span>
          <span class="badge fail">0–300 only</span>
        `;
      }
    }
  });

  // 3. CodeVita Mock Strategy Notes
  container.addEventListener("input", (e) => {
    const textarea = e.target.closest(".mock-notes-textarea");
    if (!textarea) return;
    const mockId = textarea.dataset.mockId;
    setMockNotes(mockId, textarea.value);
  });

  // 4. Error Log Textareas
  container.addEventListener("input", (e) => {
    const textarea = e.target.closest(".error-log-textarea");
    if (!textarea) return;
    const mockId = textarea.dataset.mockId;
    setMockErrorLog(mockId, textarea.value);
  });

  // 5. Completed Checkbox Ticking (1:1 with Plan)
  container.addEventListener("change", (e) => {
    const cb = e.target.closest(".mock-complete-cb");
    if (!cb) return;

    const planItemId = cb.dataset.planItemId;
    const isChecked = cb.checked;

    setDone(planItemId, isChecked);

    const card = cb.closest(".mock-card");
    if (card) card.classList.toggle("completed", isChecked);

    // Sync with Plan checkbox in DOM
    const planInputs = document.querySelectorAll(`input[type="checkbox"][data-item-id="${planItemId}"]`);
    planInputs.forEach(pi => {
      pi.checked = isChecked;
      const li = pi.closest(".task-item");
      if (li) li.classList.toggle("done", isChecked);
    });
  });

  // 6. Jump to Day link
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-day-jump-link");
    if (!btn) return;
    const day = Number(btn.dataset.day);
    if (day) {
      openAndScrollToDay(day);
    }
  });
}

function updateAllCheckboxStates() {
  const cbs = document.querySelectorAll(".mock-complete-cb");
  cbs.forEach(cb => {
    const planItemId = cb.dataset.planItemId;
    const done = isDone(planItemId);
    if (cb.checked !== done) {
      cb.checked = done;
      const card = cb.closest(".mock-card");
      if (card) card.classList.toggle("completed", done);
    }
  });
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}
