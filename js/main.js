/**
 * ====================================================================
 * MAIN.JS — Application Entry Point & Data Orchestration
 * Phase 4: Plan Section & Unified 77-Day Schedule Integration
 * ====================================================================
 */

import { initTheme, toggleTheme } from "./store.js";
import { initStore, buildCountableRegistry } from "./store.js";
import { renderHero } from "./render/hero.js";
import { renderExam } from "./render/exam.js";
import { renderPlan } from "./render/plan.js";
import { renderPYQ } from "./render/pyq.js";
import { renderMocks } from "./render/mocks.js";
import { renderBonus } from "./render/bonus.js";
import { renderChecklist } from "./render/checklist.js";

/**
 * Loads JSON data from /data/ with error handling
 * @returns {Promise<{ planData: any, cvDaysData: any, questionsData?: any, bonusData?: any } | null>}
 */
async function loadApplicationData() {
  try {
    const [planRes, cvRes, questionsRes, bonusRes] = await Promise.all([
      fetch("data/plan-data.json"),
      fetch("data/cv-days.json"),
      fetch("data/questions.json").catch(() => null),
      fetch("data/bonus.json").catch(() => null)
    ]);

    if (!planRes.ok) {
      throw new Error(`Failed to load plan-data.json (HTTP ${planRes.status})`);
    }
    if (!cvRes.ok) {
      throw new Error(`Failed to load cv-days.json (HTTP ${cvRes.status})`);
    }

    const planData = await planRes.json();
    const cvDaysData = await cvRes.json();
    const questionsData = questionsRes && questionsRes.ok ? (await questionsRes.json()).questions : null;
    const bonusData = bonusRes && bonusRes.ok ? await bonusRes.json() : null;

    return { planData, cvDaysData, questionsData, bonusData };
  } catch (err) {
    console.error("[main] Data loading failed:", err);
    showDataErrorBanner(err.message);
    return null;
  }
}

/**
 * Displays user-friendly error banner if JSON data files fail to load
 * @param {string} errorDetails
 */
function showDataErrorBanner(errorDetails) {
  const banner = document.getElementById("dataErrorBanner");
  if (banner) {
    banner.hidden = false;
    banner.innerHTML = `
      <strong>⚠️ Error Loading Study Data:</strong> ${errorDetails}.<br>
      <small>Note: Browsers block <code>fetch()</code> on <code>file://</code> URLs for security. Please serve this folder via a local server (e.g. <code>http://127.0.0.1:3000/</code>).</small>
    `;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize Theme & Storage
  initTheme();
  initStore();

  // 2. Bind Theme Toggle Button
  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      toggleTheme();
    });
  }

  // 3. Fetch Data Files
  const data = await loadApplicationData();

  if (data) {
    // 4. Compile Master Registry (Day 0 + Plan Weeks + Mocks)
    buildCountableRegistry(data.planData, data.cvDaysData);
  }

  // 5. Wire Hero (Countdowns, Date Inputs, Progress, Fit Note)
  renderHero(() => {
    // Callback when start date or Round 1 date changes in hero
    if (data) {
      renderPlan(data.planData, data.cvDaysData);
    }
  });

  // 6. Render Section Containers
  renderExam(data ? data.planData : null);
  if (data) {
    renderPlan(data.planData, data.cvDaysData);
  }
  renderPYQ(data ? data.questionsData : null);
  renderMocks();
  renderBonus(data ? data.bonusData : null);
  renderChecklist(data ? data.planData : null);

  // 7. Handle focus mode or auto-scroll to view section if specified
  const urlParams = new URLSearchParams(window.location.search);
  const focusParam = urlParams.get("focus");
  if (focusParam) {
    document.body.classList.add(`focus-${focusParam}`);
  }

  const targetView = urlParams.get("view") || window.location.hash.replace("#", "");
  if (targetView && !focusParam) {
    setTimeout(() => {
      const el = document.getElementById(targetView);
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }, 150);
  }

  console.log("[A+C Plan] Phase 5 Question Bank, Mocks & Bonus ready.");
});
