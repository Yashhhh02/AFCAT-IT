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
 * Safe HTML escaping helper
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Loads JSON data from /data/ with error handling and failing file identification
 * @returns {Promise<{ planData: any, cvDaysData: any, questionsData?: any, bonusData?: any } | null>}
 */
async function loadApplicationData() {
  const fetchFile = async (url, required = false) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (required) throw new Error(`HTTP ${res.status} (${res.statusText || "Not Found"}) on ${url}`);
        console.warn(`[main] Optional file not loaded: ${url} (HTTP ${res.status})`);
        return null;
      }
      return await res.json();
    } catch (err) {
      if (required) throw new Error(`Failed to fetch ${url}: ${err.message}`);
      console.warn(`[main] Optional file fetch error: ${url}`, err);
      return null;
    }
  };

  try {
    const [planData, cvDaysData, questionsDataWrapper, bonusData] = await Promise.all([
      fetchFile("data/plan-data.json", true),
      fetchFile("data/cv-days.json", true),
      fetchFile("data/questions.json", false),
      fetchFile("data/bonus.json", false)
    ]);

    const questionsData = questionsDataWrapper && questionsDataWrapper.questions ? questionsDataWrapper.questions : null;

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
      <strong>⚠️ Error Loading Study Data:</strong> ${escapeHTML(errorDetails)}.<br>
      <small>Note: If running locally, browsers block <code>fetch()</code> on <code>file://</code> URLs for security. Please serve via a local server (e.g. <code>http://127.0.0.1:3000/</code>).</small>
    `;
    try {
      banner.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (_) {}
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
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

    console.log("[A+C Plan] Ready.");
  } catch (err) {
    console.error("[main] Bootstrap failed:", err);
    showDataErrorBanner(`Application Bootstrap Exception: ${err.message}`);
  }
});
