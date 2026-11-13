/**
 * ====================================================================
 * RENDER/CHECKLIST.JS — Dual Exam-Day Checklists & Fall-Behind Guide
 * Features:
 * 1. AFCAT Exam Centre Checklist (IDs: check|afcat-<n>)
 * 2. CodeVita Online Contest Checklist (IDs: check|cv-<n>)
 * 3. Local persistence via store, excluded from overall plan progress
 * 4. Individual "Reset this checklist" buttons with confirm
 * 5. "What to do if you fall behind" accordion with 4 strategic rules
 * ====================================================================
 */

import { isDone, setDone, resetChecklist, subscribe } from "../store.js";

let cachedPlanData = null;

/**
 * Initializes and renders the Exam-Day Checklists section
 * @param {object} [planData]
 */
export async function renderChecklist(planData) {
  const container = document.getElementById("checklistContainer");
  if (!container) return;

  if (planData) {
    cachedPlanData = planData;
  } else if (!cachedPlanData) {
    try {
      const res = await fetch("data/plan-data.json");
      if (res.ok) cachedPlanData = await res.json();
    } catch (e) {
      console.warn("[checklist] Failed to load plan-data.json:", e);
    }
  }

  const pData = cachedPlanData || {};
  const checklists = pData.checklists || {};
  const afcatItems = checklists.afcat_exam_day || [
    "Admit card printout x2",
    "Aadhaar (original)",
    "Reach before 9:00 AM (last entry), report 8:00 AM",
    "Centre checked one day before",
    "Sleep by 10:00 PM, no new topics"
  ];
  const cvItems = checklists.codevita_exam_day || [
    "Login + system/internet/compiler test",
    "Read all problems first (15 min)",
    "Easiest first; test sample + own edge cases",
    "Follow output format strictly"
  ];

  container.innerHTML = `
    <!-- 1. DUAL EXAM-DAY CHECKLIST CARDS -->
    <div class="checklists-grid">
      <!-- AFCAT Physical Centre Checklist -->
      <article class="checklist-card afcat" id="afcatChecklistCard">
        <div class="checklist-card-head">
          <div class="checklist-badge-row">
            <span class="tag afcat">In-Person Centre</span>
            <span class="checklist-count-badge" id="afcatChecklistCounter">0 / ${afcatItems.length} verified</span>
          </div>
          <h3 class="checklist-title">AFCAT 01/2027 Centre Kit</h3>
          <p class="checklist-desc">Strict mandatory physical requirements for the offline/CBT test center on 31 Jan 2027.</p>
        </div>

        <div class="checklist-items-wrap">
          ${afcatItems.map((item, idx) => {
            const itemId = `check|afcat-${idx}`;
            const checked = isDone(itemId);
            return `
              <label class="checklist-item-row ${checked ? 'checked' : ''}" data-item-id="${itemId}">
                <input type="checkbox" class="exam-checklist-cb" data-item-id="${itemId}" ${checked ? 'checked' : ''}>
                <span class="custom-cb-box"></span>
                <span class="checklist-item-text">${escapeHTML(item)}</span>
              </label>
            `;
          }).join("")}
        </div>

        <div class="checklist-card-footer">
          <button class="btn-reset-checklist afcat" id="resetAfcatChecklistBtn">Reset this checklist</button>
        </div>
      </article>

      <!-- CodeVita Online Contest Checklist -->
      <article class="checklist-card cv" id="cvChecklistCard">
        <div class="checklist-card-head">
          <div class="checklist-badge-row">
            <span class="tag cv">Online Environment</span>
            <span class="checklist-count-badge" id="cvChecklistCounter">0 / ${cvItems.length} verified</span>
          </div>
          <h3 class="checklist-title">CodeVita S14 Contest Setup</h3>
          <p class="checklist-desc">Tactical protocols and system verification for the 3-hour competitive programming round.</p>
        </div>

        <div class="checklist-items-wrap">
          ${cvItems.map((item, idx) => {
            const itemId = `check|cv-${idx}`;
            const checked = isDone(itemId);
            return `
              <label class="checklist-item-row ${checked ? 'checked' : ''}" data-item-id="${itemId}">
                <input type="checkbox" class="exam-checklist-cb" data-item-id="${itemId}" ${checked ? 'checked' : ''}>
                <span class="custom-cb-box"></span>
                <span class="checklist-item-text">${escapeHTML(item)}</span>
              </label>
            `;
          }).join("")}
        </div>

        <div class="checklist-card-footer">
          <button class="btn-reset-checklist cv" id="resetCvChecklistBtn">Reset this checklist</button>
        </div>
      </article>
    </div>

    <!-- 2. "WHAT TO DO IF YOU FALL BEHIND" ACCORDION -->
    <div class="fall-behind-accordion-wrap">
      <details class="fall-behind-details" id="fallBehindDetails" open>
        <summary class="fall-behind-summary">
          <div class="summary-left">
            <span class="tag amber">Emergency Strategy</span>
            <h3 class="summary-heading">What to do if you fall behind schedule</h3>
          </div>
          <span class="summary-toggle-icon">▾</span>
        </summary>

        <div class="fall-behind-content">
          <div class="fall-behind-grid">
            <div class="rule-card">
              <div class="rule-number">1</div>
              <h4 class="rule-title">Do Not Repeat a Week</h4>
              <p class="rule-desc">Do not repeat a past week. Always move forward with the current calendar week to stay on track for the exam.</p>
            </div>

            <div class="rule-card">
              <div class="rule-number">2</div>
              <h4 class="rule-title">Move Weak Topics to Saturday / Sunday</h4>
              <p class="rule-desc">Move weak or incomplete topics to Saturday's practice block or Sunday's revision window.</p>
            </div>

            <div class="rule-card">
              <div class="rule-number">3</div>
              <h4 class="rule-title">Never Skip Mocks and Revision</h4>
              <p class="rule-desc">Never skip mocks and revision. Full timed practice and post-mock error logs are essential for exam preparation.</p>
            </div>

            <div class="rule-card">
              <div class="rule-number">4</div>
              <h4 class="rule-title">Take One Half-Day When Exhausted</h4>
              <p class="rule-desc">Take one half-day when exhausted. Proper rest and sleep prevent fatigue and keep your study routine sustainable.</p>
            </div>
          </div>
        </div>
      </details>
    </div>
  `;

  attachChecklistListeners(container);
  updateChecklistCounts(container, afcatItems.length, cvItems.length);

  // Subscribe to store updates for multi-tab / reactive syncing
  subscribe(() => {
    updateChecklistCounts(container, afcatItems.length, cvItems.length);
  });
}

/**
 * Attaches event listeners for checklist items and reset buttons
 */
function attachChecklistListeners(container) {
  const checkboxes = container.querySelectorAll(".exam-checklist-cb");
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const itemId = e.target.getAttribute("data-item-id");
      if (itemId) {
        setDone(itemId, e.target.checked);
      }
    });
  });

  // Reset AFCAT Checklist
  const resetAfcatBtn = container.querySelector("#resetAfcatChecklistBtn");
  if (resetAfcatBtn) {
    resetAfcatBtn.addEventListener("click", () => {
      const ok = window.confirm("Are you sure you want to reset the AFCAT exam-day checklist?");
      if (ok) {
        resetChecklist("check|afcat-");
      }
    });
  }

  // Reset CodeVita Checklist
  const resetCvBtn = container.querySelector("#resetCvChecklistBtn");
  if (resetCvBtn) {
    resetCvBtn.addEventListener("click", () => {
      const ok = window.confirm("Are you sure you want to reset the CodeVita exam-day checklist?");
      if (ok) {
        resetChecklist("check|cv-");
      }
    });
  }
}

/**
 * Updates checkbox visually and counts in DOM
 */
function updateChecklistCounts(container, afcatTotal, cvTotal) {
  const checkboxes = container.querySelectorAll(".exam-checklist-cb");
  let afcatDone = 0;
  let cvDone = 0;

  checkboxes.forEach((cb) => {
    const itemId = cb.getAttribute("data-item-id");
    const done = isDone(itemId);
    cb.checked = !!done;

    const row = cb.closest(".checklist-item-row");
    if (row) {
      if (done) {
        row.classList.add("checked");
      } else {
        row.classList.remove("checked");
      }
    }

    if (itemId.startsWith("check|afcat-") && done) afcatDone++;
    if (itemId.startsWith("check|cv-") && done) cvDone++;
  });

  const afcatCounter = container.querySelector("#afcatChecklistCounter");
  if (afcatCounter) {
    afcatCounter.textContent = `${afcatDone} / ${afcatTotal} verified`;
  }

  const cvCounter = container.querySelector("#cvChecklistCounter");
  if (cvCounter) {
    cvCounter.textContent = `${cvDone} / ${cvTotal} verified`;
  }
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
