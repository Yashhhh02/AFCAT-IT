/**
 * ====================================================================
 * RENDER/BONUS.JS — Bonus Lectures, Recall Modules & Shortcuts
 * Features: Starter sections for AFCAT English, Current Affairs, Maths,
 * and CodeVita Problem Patterns. Non-countable checkboxes (bonus|<id>).
 * ====================================================================
 */

import { isDone, setDone, subscribe } from "../store.js";

let cachedBonusData = null;

/**
 * Initializes and renders the Bonus section
 * @param {object} [loadedBonusData]
 */
export async function renderBonus(loadedBonusData) {
  const container = document.getElementById("bonusContainer");
  if (!container) return;

  if (loadedBonusData && loadedBonusData.sections) {
    cachedBonusData = loadedBonusData;
  } else if (!cachedBonusData) {
    try {
      const res = await fetch("data/bonus.json");
      if (res.ok) {
        cachedBonusData = await res.json();
      }
    } catch (e) {
      console.warn("[bonus] Failed to load data/bonus.json:", e);
    }
  }

  const sections = (cachedBonusData && cachedBonusData.sections) || [];

  container.innerHTML = `
    <div class="bonus-grid">
      ${sections.map(sec => renderBonusSectionCard(sec)).join("")}
    </div>

    <!-- Section Footer Attribution -->
    <div class="bonus-footer-credit">
      <p>Layout and CodeVita bonus video lectures inspired by <b>Padho with Pratyush</b> (Padho with Pratyush YouTube channel). AFCAT recall sheets prepared for AFCAT 01/2027.</p>
    </div>
  `;

  attachBonusEventListeners(container);

  subscribe(() => {
    updateBonusCheckboxesInDOM();
  });
}

/**
 * Builds HTML for a bonus section category card
 */
function renderBonusSectionCard(sec) {
  const trackClass = sec.track === "CodeVita" ? "cv" : "afcat";

  return `
    <article class="bonus-category-card">
      <div class="bonus-cat-header">
        <div class="bonus-cat-title-row">
          <span class="tag ${trackClass}">${escapeHTML(sec.track)}</span>
          <h3 class="bonus-cat-title">${escapeHTML(sec.title)}</h3>
        </div>
        <p class="bonus-cat-desc">${escapeHTML(sec.description || "")}</p>
      </div>

      <ul class="bonus-items-list">
        ${sec.items.map(item => renderBonusItemRow(item)).join("")}
      </ul>
    </article>
  `;
}

/**
 * Builds HTML for an individual bonus resource item row
 */
function renderBonusItemRow(item) {
  const bonusId = `bonus|${item.id}`;
  const done = isDone(bonusId);
  const hasUrl = Boolean(item.url && item.url.trim());
  const linkHtml = hasUrl ? `<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener" class="bonus-link" title="Open resource">↗</a>` : '';

  return `
    <li class="bonus-item-row ${done ? 'watched' : ''}" data-bonus-id="${bonusId}">
      <label class="bonus-item-label">
        <input type="checkbox" class="bonus-checkbox" data-bonus-id="${bonusId}" ${done ? 'checked' : ''} aria-label="Mark ${escapeHTML(item.title)} as reviewed">
        <span class="bonus-item-content">
          <span class="bonus-item-title">${escapeHTML(item.title)} ${linkHtml}</span>
          <span class="bonus-topic-pill">${escapeHTML(item.topic || "")}</span>
        </span>
      </label>
    </li>
  `;
}

/**
 * Binds checkbox change events
 */
function attachBonusEventListeners(container) {
  container.addEventListener("change", (e) => {
    const cb = e.target.closest(".bonus-checkbox");
    if (!cb) return;

    const bonusId = cb.dataset.bonusId;
    const isChecked = cb.checked;

    setDone(bonusId, isChecked);

    const row = cb.closest(".bonus-item-row");
    if (row) row.classList.toggle("watched", isChecked);
  });
}

function updateBonusCheckboxesInDOM() {
  const checkboxes = document.querySelectorAll(".bonus-checkbox");
  checkboxes.forEach(cb => {
    const bonusId = cb.dataset.bonusId;
    const done = isDone(bonusId);
    if (cb.checked !== done) {
      cb.checked = done;
      const row = cb.closest(".bonus-item-row");
      if (row) row.classList.toggle("watched", done);
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
