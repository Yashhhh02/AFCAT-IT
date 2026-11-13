/**
 * ====================================================================
 * RENDER/HERO.JS — Hero Section Countdowns, Progress Bars & Controls
 * ====================================================================
 */

import {
  AFCAT_EXAM_DATE,
  AFCAT_FORM_LAST_DATE,
  CV_REG_DEADLINE,
  getRemainingTime,
  formatCountdownString,
  calculateFitNote,
  formatShortDate
} from "../dates.js";
import {
  getState,
  updateState,
  counts,
  extraCounts,
  resetProgress,
  exportProgress,
  importProgress,
  subscribe
} from "../store.js";

/**
 * Initializes and wires the hero section logic
 * @param {(() => void) | null} onDateChangeCallback
 */
export function renderHero(onDateChangeCallback = null) {
  const afcatExamDigitsEl = document.getElementById("afcatCountdown");
  const afcatFormDigitsEl = document.getElementById("afcatFormCountdown");
  const cvDigitsEl = document.getElementById("cvCountdown");
  const cvSubEl = document.getElementById("cvCountdownSub");
  const cvLabelEl = document.getElementById("cvCardLabel");

  const progressPctEl = document.getElementById("progressPct");
  const progressBarEl = document.getElementById("progressBar");
  const progressTextEl = document.getElementById("progressText");

  const afcatSubPctEl = document.getElementById("afcatSubPct");
  const afcatSubBarEl = document.getElementById("afcatSubBar");
  const cvSubPctEl = document.getElementById("cvSubPct");
  const cvSubBarEl = document.getElementById("cvSubBar");

  const startDateInput = document.getElementById("startDateInput");
  const round1DateInput = document.getElementById("round1DateInput");
  const fitNoteEl = document.getElementById("fitNote");

  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFileInput = document.getElementById("importFileInput");

  // 1. Initialize Date Inputs from Stored State
  const state = getState();
  if (startDateInput) {
    startDateInput.value = state.startDate || "2026-11-16";
    startDateInput.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val) {
        updateState({ startDate: val });
        updateHeroUI();
        if (onDateChangeCallback) onDateChangeCallback();
      }
    });
  }

  if (round1DateInput) {
    round1DateInput.value = state.round1Date || "";
    round1DateInput.addEventListener("change", (e) => {
      const val = e.target.value.trim() || null;
      updateState({ round1Date: val });
      updateHeroUI();
      if (onDateChangeCallback) onDateChangeCallback();
    });
  }

  // 2. Wire Action Buttons
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetProgress();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const jsonStr = exportProgress();
      downloadJSONFile(jsonStr, "afcat-cv-progress-backup.json");
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener("click", () => {
      importFileInput.value = "";
      importFileInput.click();
    });

    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const res = importProgress(text);
        if (res.success) {
          alert("Progress successfully restored from backup!");
          const updated = getState();
          if (startDateInput) startDateInput.value = updated.startDate;
          if (round1DateInput) round1DateInput.value = updated.round1Date || "";
          updateHeroUI();
          if (onDateChangeCallback) onDateChangeCallback();
        } else {
          alert("Failed to import progress: " + (res.error || "Invalid file format"));
        }
      };
      reader.readAsText(file);
    });
  }

  // 3. Update Function for Live Timers & Progress
  function updateTimers() {
    const curState = getState();

    // A. AFCAT Exam Countdown (31 Jan 2027 10:00 AM IST)
    if (afcatExamDigitsEl) {
      const afcatTime = getRemainingTime(AFCAT_EXAM_DATE);
      afcatExamDigitsEl.textContent = formatCountdownString(afcatTime, "Done");
    }

    // B. AFCAT Form Deadline (11 Dec 2026, 11:30 PM IST)
    if (afcatFormDigitsEl) {
      const formTime = getRemainingTime(AFCAT_FORM_LAST_DATE);
      afcatFormDigitsEl.textContent = formatCountdownString(formTime, "Done");
    }

    // C. CodeVita Countdown Card
    if (cvDigitsEl) {
      const regTime = getRemainingTime(CV_REG_DEADLINE);
      if (!regTime.closed) {
        if (cvLabelEl) cvLabelEl.textContent = "CodeVita Registration";
        cvDigitsEl.textContent = formatCountdownString(regTime, "Done");
        if (cvSubEl) cvSubEl.textContent = "Closes 13 Nov 2026 (confirm on official portal)";
      } else if (curState.round1Date) {
        if (cvLabelEl) cvLabelEl.textContent = "CodeVita Round 1";
        const r1Time = getRemainingTime(curState.round1Date + "T09:00:00+05:30");
        cvDigitsEl.textContent = formatCountdownString(r1Time, "Done");
        if (cvSubEl) cvSubEl.textContent = `Target: ${formatShortDate(curState.round1Date, true)} (confirm on portal)`;
      } else {
        if (cvLabelEl) cvLabelEl.textContent = "CodeVita S14";
        cvDigitsEl.textContent = "Done";
        if (cvSubEl) cvSubEl.textContent = "Registration closed · Enter Round 1 date in controls";
      }
    }
  }

  function updateProgressBars() {
    const overall = counts();
    if (progressPctEl) progressPctEl.textContent = `${overall.pct}%`;
    if (progressBarEl) progressBarEl.style.width = `${overall.pct}%`;
    if (progressTextEl) progressTextEl.textContent = `${overall.done} of ${overall.total} items done`;

    const afcat = counts({ track: "afcat" });
    if (afcatSubPctEl) afcatSubPctEl.textContent = `${afcat.done}/${afcat.total} (${afcat.pct}%)`;
    if (afcatSubBarEl) afcatSubBarEl.style.width = `${afcat.pct}%`;

    const cv = counts({ track: "cv" });
    if (cvSubPctEl) cvSubPctEl.textContent = `${cv.done}/${cv.total} (${cv.pct}%)`;
    if (cvSubBarEl) cvSubBarEl.style.width = `${cv.pct}%`;

    const extra = extraCounts();
    const extraEl = document.getElementById("extraPracticeText");
    if (extraEl) extraEl.textContent = `Extra practice: ${extra.done} of ${extra.total} done`;
  }

  function updateFitNote() {
    if (!fitNoteEl) return;
    const curState = getState();
    const fit = calculateFitNote(curState.startDate, curState.round1Date);

    if (!fit.hasFitNote) {
      fitNoteEl.hidden = true;
      fitNoteEl.innerHTML = "";
    } else {
      fitNoteEl.hidden = false;
      const icon = fit.isWarning ? "⚠️" : "ℹ️";
      fitNoteEl.innerHTML = `<span class="icon">${icon}</span><span>${fit.message}</span>`;
    }
  }

  function updateHeroUI() {
    updateTimers();
    updateProgressBars();
    updateFitNote();
  }

  // Initial render & timer tick
  updateHeroUI();
  setInterval(updateTimers, 30000); // 30-second interval

  // Subscribe to store updates for instant reactive progress updates
  subscribe(() => {
    updateProgressBars();
    updateFitNote();
  });
}

/**
 * Triggers a client-side file download for the JSON backup
 * @param {string} content
 * @param {string} fileName
 */
function downloadJSONFile(content, fileName) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
