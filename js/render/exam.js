/**
 * ====================================================================
 * RENDER/EXAM.JS — Exam at a Glance, Day 0 Sprint & Master Timetable
 * Features:
 * 1. Two side-by-side dossiers (AFCAT 01/2027 & CodeVita S14)
 * 2. Strict portal verification labels ("confirm on official portal")
 * 3. "Rules that catch people out" gotcha panels
 * 4. Day 0 Onboarding Sprint with shared store IDs (0|check|n)
 * 5. Master Weekday Timetable with live local-time active slot ("Now")
 * ====================================================================
 */

import { isDone, setDone, subscribe } from "../store.js";
import { getNow } from "../dates.js";

let cachedPlanData = null;
let timetableTimer = null;

/**
 * Initializes and renders the Exam section
 * @param {object} [planData]
 */
export async function renderExam(planData) {
  const container = document.getElementById("examContainer");
  if (!container) return;

  if (planData) {
    cachedPlanData = planData;
  } else if (!cachedPlanData) {
    try {
      const res = await fetch("data/plan-data.json");
      if (res.ok) cachedPlanData = await res.json();
    } catch (e) {
      console.warn("[exam] Failed to load plan-data.json:", e);
    }
  }

  const pData = cachedPlanData || {};
  const afcatFacts = pData.afcat_facts || {};
  const cvRules = pData.cv_rules || {};
  const keyDates = pData.key_dates || [];
  const day0List = pData.day0 || [];
  const timetable = pData.weekday_timetable || [];

  container.innerHTML = `
    <!-- 1. DUAL EXAM DOSSIERS (AFCAT 01/2027 & CODEVITA S14) -->
    <div class="exam-dossiers-grid">
      <!-- CARD 1: AFCAT 01/2027 DOSSIER -->
      <article class="dossier-card afcat" id="dossierAfcat">
        <div class="dossier-head">
          <div>
            <div class="dossier-badge-row">
              <span class="tag afcat">Indian Air Force</span>
              <span class="confirm-pill">confirm on official portal</span>
            </div>
            <h3 class="dossier-title">AFCAT 01/2027</h3>
            <p class="dossier-sub">Air Force Common Admission Test for Flying & Ground Duty Branches</p>
          </div>
          <a class="portal-link-btn afcat" href="https://afcat.edcil.co.in/" target="_blank" rel="noopener noreferrer" title="Open official AFCAT registration portal">
            afcat.edcil.co.in ↗
          </a>
        </div>

        <div class="dossier-body">
          <div class="fact-section">
            <h4 class="fact-sec-title">Exam Pattern & Marking</h4>
            <div class="fact-pill-row">
              <span class="fact-pill">100 Questions</span>
              <span class="fact-pill">300 Marks</span>
              <span class="fact-pill">2 Hours (120 Mins)</span>
              <span class="fact-pill highlight">+3 / -1 Negative</span>
              <span class="fact-pill">English Only</span>
            </div>
          </div>

          <div class="fact-section">
            <h4 class="fact-sec-title">Four Exam Sections</h4>
            <ul class="dossier-list">
              <li><strong>Verbal Ability in English:</strong> Comprehension, error detection, sentence completion, synonyms/antonyms, idioms.</li>
              <li><strong>Numerical Ability:</strong> Decimal fraction, ratio & proportion, percentage, profit & loss, average, time & work, time & distance, simple interest.</li>
              <li><strong>Reasoning & Military Aptitude:</strong> Verbal skills and spatial ability, pattern completion, dot situation, analogy, classification.</li>
              <li><strong>General Awareness:</strong> History, geography, polity, defence acquisitions, joint exercises, general science, sports, current affairs.</li>
            </ul>
          </div>

          <div class="fact-section">
            <h4 class="fact-sec-title">Key Milestones & Timeline <small class="confirm-label">(confirm on official portal)</small></h4>
            <div class="dossier-timeline">
              <div class="timeline-step">
                <span class="step-date">11 Dec 2026</span>
                <span class="step-desc">Form registration closes at 11:30 PM (Submit early)</span>
              </div>
              <div class="timeline-step">
                <span class="step-date">27 Jan 2027</span>
                <span class="step-desc">Admit card release (Download from 11:00 AM)</span>
              </div>
              <div class="timeline-step highlight">
                <span class="step-date">31 Jan 2027</span>
                <span class="step-desc"><strong>Exam Day:</strong> 10:00 AM – 12:00 Noon (Report 8:00 AM, last entry 9:00 AM)</span>
              </div>
            </div>
          </div>

          <div class="fact-section">
            <h4 class="fact-sec-title">Candidate Focus & Fee</h4>
            <p class="fact-text"><strong>Application Fee:</strong> Rs 550 + 18% GST (Non-refundable).</p>
            <p class="fact-text"><strong>Targeted Branches:</strong> Ground Duty (Non-Technical): Administration & Logistics (Minimum 60% aggregate in graduation).</p>
          </div>
        </div>

        <!-- Rules That Catch People Out (AFCAT) -->
        <div class="gotchas-box afcat">
          <h4 class="gotchas-title">⚠️ Rules That Catch People Out in AFCAT</h4>
          <ul class="gotchas-list">
            <li><strong>Negative Marking:</strong> Negative marking -1 for every incorrect answer. (+3 for correct).</li>
            <li><strong>Entry Timings:</strong> Report 8:00 AM, last entry 9:00 AM.</li>
            <li><strong>Identity Document:</strong> Original Aadhaar required.</li>
            <li><strong>Form Submission:</strong> No corrections after form payment.</li>
          </ul>
        </div>
      </article>

      <!-- CARD 2: TCS CODEVITA SEASON 14 DOSSIER -->
      <article class="dossier-card cv" id="dossierCv">
        <div class="dossier-head">
          <div>
            <div class="dossier-badge-row">
              <span class="tag cv">Tata Consultancy Services</span>
              <span class="confirm-pill">confirm on official portal</span>
            </div>
            <h3 class="dossier-title">TCS CodeVita Season 14</h3>
            <p class="dossier-sub">Global Programming Competition & Premier Coding Placement Benchmark</p>
          </div>
          <a class="portal-link-btn cv" href="https://codevita.tcsapps.com/" target="_blank" rel="noopener noreferrer" title="Open official TCS CodeVita portal">
            codevita.tcsapps.com ↗
          </a>
        </div>

        <div class="dossier-body">
          <div class="fact-section">
            <h4 class="fact-sec-title">Contest Format & Allowed Languages</h4>
            <div class="fact-pill-row">
              <span class="fact-pill highlight">3 Hours Per Round</span>
              <span class="fact-pill">4 Languages Only</span>
              <span class="fact-pill">C</span>
              <span class="fact-pill">C++</span>
              <span class="fact-pill">Java</span>
              <span class="fact-pill">Python</span>
            </div>
            <p class="verified-quote">"Participants will get 3 hours to prove their mettle. 4 programming languages allowed this season: C, C++, Java, Python." — <a href="https://codevita.tcsapps.com/" target="_blank" rel="noopener">Official CodeVita Portal</a></p>
          </div>

          <div class="fact-section">
            <h4 class="fact-sec-title">Eligibility & Advancement Criteria</h4>
            <ul class="dossier-list">
              <li><strong>Eligible Batches:</strong> Students pursuing graduation or post-graduation in any stream of science or engineering graduating in <strong>2027, 2028, 2029, or 2030</strong>.</li>
              <li><strong>Progression:</strong> <span class="quote-span">"Solve more questions, advance further. Only the top coders in each round move on."</span></li>
              <li><strong>Beyond Round 1:</strong> Rounds 2 & 3 may involve technologies beyond traditional competitive programming.</li>
            </ul>
          </div>

          <div class="fact-section">
            <h4 class="fact-sec-title">Prize Pool & Career Impact <small class="confirm-label">(confirm on official portal)</small></h4>
            <div class="dossier-timeline">
              <div class="timeline-step">
                <span class="step-date">USD 20,000</span>
                <span class="step-desc">Total global prize purse shared by top 3 rankers worldwide.</span>
              </div>
              <div class="timeline-step highlight">
                <span class="step-date">Grand Finale</span>
                <span class="step-desc">Global finalists travel to India for Season 14 Grand Finale (conditions apply).</span>
              </div>
              <div class="timeline-step">
                <span class="step-date">Round 1 Date</span>
                <span class="step-desc">Round dates not published yet — check on official portal. Enter date in hero when announced.</span>
              </div>
            </div>
          </div>

          <div class="fact-section">
            <h4 class="fact-sec-title">Our 56-Day Preparation Blueprint</h4>
            <p class="fact-text"><strong>Curriculum:</strong> 56 days structured across 8 weeks (5 learning days Mon–Fri + Saturday simulation + Sunday rest).</p>
            <p class="fact-text"><strong>Daily Commitment:</strong> 1.5 hours focused video lecture + 1.5 hours hands-on problem solving (5 full 3-hour mocks in Weeks 4–8).</p>
          </div>
        </div>

        <!-- Rules That Catch People Out (CodeVita) -->
        <div class="gotchas-box cv">
          <h4 class="gotchas-title">⚠️ Rules That Catch People Out in CodeVita</h4>
          <ul class="gotchas-list">
            <li><strong>Story-Style Problem Statements:</strong> Long story-style questions; isolate constraints and math first.</li>
            <li><strong>Strict Output Formatting:</strong> Check the output format carefully.</li>
            <li><strong>Custom Input Formats:</strong> Custom input formats (space-separated, matrix inputs, EOF handling).</li>
            <li><strong>Account Lockout:</strong> <span class="quote-span">"If your account is locked, wait 15 minutes before retrying."</span></li>
          </ul>
        </div>
      </article>
    </div>

    <!-- 2. DAY 0 ONBOARDING SPRINT (12–15 NOV 2026) -->
    <div class="day0-sprint-container" id="day0Sprint">
      <div class="sub-section-header">
        <div>
          <span class="tag amber">Pre-Launch Kickoff</span>
          <h3 class="sub-sec-title">Day 0 Onboarding Sprint (12–15 Nov 2026)</h3>
          <p class="sub-sec-desc">Four crucial foundation days before Day 1. Ticking items here connects directly to the master plan registry and updates your overall progress.</p>
        </div>
        <div class="day0-counter-badge" id="day0CounterBadge">
          0 / 8 Setup Tasks Completed
        </div>
      </div>

      <div class="day0-cards-grid">
        ${renderDay0Cards(day0List)}
      </div>
    </div>

    <!-- 3. MASTER WEEKDAY TIMETABLE (06:00 – 22:30) -->
    <div class="timetable-section-container" id="timetableSection">
      <div class="sub-section-header">
        <div>
          <span class="tag afcat">Daily Operational Routine</span>
          <h3 class="sub-sec-title">Master Weekday Timetable (Monday – Friday)</h3>
          <p class="sub-sec-desc">Hour-by-hour balanced schedule designed for maximum cognitive stamina. The current slot is highlighted live using your local device clock.</p>
        </div>
        <div class="live-clock-badge" id="liveClockBadge">
          <span class="pulse-dot"></span>
          <span id="liveClockText">Local Time: --:--</span>
        </div>
      </div>

      <!-- Weekend Notice Banner (Shown on Saturday & Sunday) -->
      <div class="timetable-weekend-banner" id="weekendBanner" hidden>
        <strong>📅 Weekend Mode Active:</strong> The Monday–Friday hourly timetable is paused today. Saturdays are dedicated to Sectional Tests / 3-Hour Mocks, and Sundays are reserved for Weekly Revision & Rest.
      </div>

      <div class="timetable-grid" id="timetableGrid" role="table" aria-label="Master Weekday Timetable">
        <div class="timetable-header-row" role="row">
          <div class="th-time" role="columnheader">Time Slot</div>
          <div class="th-track" role="columnheader">Track</div>
          <div class="th-task" role="columnheader">Scheduled Activity & Focus</div>
          <div class="th-status" role="columnheader">Status</div>
        </div>
        ${renderTimetableRows(timetable)}
      </div>
    </div>
  `;

  attachDay0Listeners(container);
  updateDay0Checkboxes(container);
  initTimetableClock(timetable);

  // Subscribe to store updates for reactive Day 0 ticks
  subscribe(() => {
    updateDay0Checkboxes(container);
  });
}

/**
 * Builds HTML for Day 0 setup cards
 */
function renderDay0Cards(day0List) {
  let taskGlobalIdx = 0;

  return day0List.map((d0Group, groupIdx) => {
    const tasksHtml = (d0Group.tasks || []).map((taskDesc) => {
      const itemId = `0|check|${taskGlobalIdx}`;
      const checked = isDone(itemId);
      taskGlobalIdx++;

      return `
        <label class="day0-task-item ${checked ? 'checked' : ''}" data-item-id="${itemId}">
          <input type="checkbox" class="day0-cb" data-item-id="${itemId}" ${checked ? 'checked' : ''}>
          <span class="day0-task-text">${escapeHTML(taskDesc)}</span>
        </label>
      `;
    }).join("");

    return `
      <div class="day0-group-card">
        <div class="day0-group-header">
          <span class="day0-date-badge">${escapeHTML(d0Group.label)}</span>
          <span class="day0-sub-label">Sprint Day ${groupIdx + 1}</span>
        </div>
        <div class="day0-tasks-list">
          ${tasksHtml}
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Attaches event listeners for Day 0 checkboxes
 */
function attachDay0Listeners(container) {
  const checkboxes = container.querySelectorAll(".day0-cb");
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const itemId = e.target.getAttribute("data-item-id");
      if (itemId) {
        setDone(itemId, e.target.checked);
      }
    });
  });
}

/**
 * Updates Day 0 checkboxes from current store state
 */
function updateDay0Checkboxes(container) {
  const checkboxes = container.querySelectorAll(".day0-cb");
  let doneCount = 0;
  let totalCount = checkboxes.length;

  checkboxes.forEach((cb) => {
    const itemId = cb.getAttribute("data-item-id");
    const done = isDone(itemId);
    cb.checked = !!done;

    const parentLabel = cb.closest(".day0-task-item");
    if (parentLabel) {
      if (done) {
        parentLabel.classList.add("checked");
        doneCount++;
      } else {
        parentLabel.classList.remove("checked");
      }
    }
  });

  const counterBadge = container.querySelector("#day0CounterBadge");
  if (counterBadge) {
    counterBadge.textContent = `${doneCount} / ${totalCount} Setup Tasks Completed`;
  }
}

/**
 * Builds HTML for Timetable rows
 */
function renderTimetableRows(timetable) {
  return timetable.map((slot, idx) => {
    const trackInfo = getTrackForTimetableSlot(slot.task);

    return `
      <div class="timetable-row" role="row" data-slot-idx="${idx}" data-time="${escapeHTML(slot.time)}">
        <div class="slot-time-col" role="cell">
          <span class="time-text">${escapeHTML(slot.time)}</span>
        </div>
        <div class="slot-track-col" role="cell">
          <span class="tag ${trackInfo.tagClass}">${escapeHTML(trackInfo.label)}</span>
        </div>
        <div class="slot-task-col" role="cell">
          <p class="task-description">${escapeHTML(slot.task)}</p>
        </div>
        <div class="slot-status-col" role="cell">
          <span class="slot-now-badge" hidden>Now</span>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Categorizes timetable slot into track and style
 */
function getTrackForTimetableSlot(taskText) {
  const t = (taskText || "").toLowerCase();
  if (t.includes("codevita")) {
    return { label: "CodeVita", tagClass: "cv" };
  } else if (t.includes("afcat")) {
    return { label: "AFCAT", tagClass: "afcat" };
  } else if (t.includes("job") || t.includes("resume") || t.includes("application")) {
    return { label: "Career", tagClass: "amber" };
  } else if (t.includes("running") || t.includes("exercise") || t.includes("lunch") || t.includes("sleep")) {
    return { label: "Routine", tagClass: "muted" };
  }
  return { label: "Habit", tagClass: "muted" };
}

/**
 * Parses time string like "07:30-09:30" or "06:00" into start and end minutes from midnight
 * @param {string} timeStr
 * @returns {{ startMins: number, endMins: number }}
 */
export function parseSlotMinutes(timeStr) {
  if (!timeStr) return { startMins: 0, endMins: 0 };

  if (timeStr.includes("-")) {
    const [startPart, endPart] = timeStr.split("-");
    const [sH, sM] = startPart.split(":").map(Number);
    const [eH, eM] = endPart.split(":").map(Number);
    return {
      startMins: (sH || 0) * 60 + (sM || 0),
      endMins: (eH || 0) * 60 + (eM || 0)
    };
  }

  const [h, m] = timeStr.split(":").map(Number);
  const startMins = (h || 0) * 60 + (m || 0);
  return {
    startMins,
    endMins: startMins + 15 // Default 15 min slot for single point times
  };
}

/**
 * Computes which timetable slot index is active for a given date
 * Returns -1 if it's weekend (Sat/Sun) or no slot matches
 * @param {Date} [nowDate]
 * @param {Array<{ time: string, task: string }>} [timetable]
 * @returns {number}
 */
export function getCurrentSlotIndex(nowDate = getNow(), timetable = []) {
  const dayOfWeek = nowDate.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return -1; // Weekend pause
  }

  const currentMins = nowDate.getHours() * 60 + nowDate.getMinutes();

  for (let i = 0; i < timetable.length; i++) {
    const { startMins, endMins } = parseSlotMinutes(timetable[i].time);
    if (currentMins >= startMins && currentMins < endMins) {
      return i;
    }
  }

  return -1;
}

/**
 * Initializes live timetable clock and slot highlight
 */
function initTimetableClock(timetable) {
  if (timetableTimer) clearInterval(timetableTimer);

  const urlP = new URLSearchParams(window.location.search);
  const simTime = urlP.get("simTime");
  if (simTime) {
    const [h, m] = simTime.split(":").map(Number);
    const mockD = new Date("2026-11-17T00:00:00"); // Tuesday
    mockD.setHours(h || 8, m || 0, 0, 0);
    const clockText = document.getElementById("liveClockText");
    if (clockText) {
      clockText.textContent = `Local Time: ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    applySlotHighlight(mockD, timetable);
    return;
  }

  function update() {
    const now = getNow();
    const clockText = document.getElementById("liveClockText");
    if (clockText) {
      const hStr = String(now.getHours()).padStart(2, "0");
      const mStr = String(now.getMinutes()).padStart(2, "0");
      clockText.textContent = `Local Time: ${hStr}:${mStr}`;
    }

    applySlotHighlight(now, timetable);
  }

  update();
  timetableTimer = setInterval(update, 60000);
}

/**
 * Applies active slot highlight and weekend notice
 * @param {Date} dateObj
 * @param {Array<object>} timetable
 */
export function applySlotHighlight(dateObj, timetable) {
  const weekendBanner = document.getElementById("weekendBanner");
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  if (weekendBanner) {
    weekendBanner.hidden = !isWeekend;
  }

  const activeIdx = getCurrentSlotIndex(dateObj, timetable);
  const rows = document.querySelectorAll(".timetable-row");

  rows.forEach((row, idx) => {
    const nowBadge = row.querySelector(".slot-now-badge");
    if (idx === activeIdx) {
      row.classList.add("active");
      if (nowBadge) nowBadge.hidden = false;
    } else {
      row.classList.remove("active");
      if (nowBadge) nowBadge.hidden = true;
    }
  });

  return activeIdx;
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
