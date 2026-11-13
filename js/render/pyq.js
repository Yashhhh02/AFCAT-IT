/**
 * ====================================================================
 * RENDER/PYQ.JS — Dual Question Bank (CodeVita Archive + AFCAT PYQ)
 * Features: Real-time search, filters (track, source, topic, level),
 * sortable columns, reactive counter, day-linking, and mobile cards.
 * ====================================================================
 */

import { isDone, setDone, subscribe } from "../store.js";
import { openAndScrollToDay } from "./plan.js";

let questionsList = [];
let activeFilters = {
  search: "",
  track: "all",     // "all" | "CodeVita" | "AFCAT"
  source: "all",    // "all" | specific source
  topic: "all",     // "all" | specific topic
  level: "all"      // "all" | "Easy" | "Medium" | "Hard"
};
let sortState = {
  column: "day",
  ascending: true
};

/**
 * Initializes and renders the Question Bank
 * @param {Array<object>} [loadedQuestions]
 */
export async function renderPyq(loadedQuestions) {
  const container = document.getElementById("pyqContainer");
  if (!container) return;

  if (loadedQuestions && Array.isArray(loadedQuestions)) {
    questionsList = loadedQuestions;
  } else if (!questionsList.length) {
    try {
      const res = await fetch("data/questions.json");
      if (res.ok) {
        const data = await res.json();
        questionsList = data.questions || [];
      }
    } catch (e) {
      console.warn("[pyq] Failed to fetch data/questions.json:", e);
    }
  }

  // Read URL params if any
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("track")) {
    activeFilters.track = urlParams.get("track");
  }
  if (urlParams.get("search")) {
    activeFilters.search = urlParams.get("search");
  }
  if (urlParams.get("level")) {
    activeFilters.level = urlParams.get("level");
  }

  // Subscribe to store updates to keep solved state in sync with plan
  subscribe(() => {
    updateSolvedCounter();
    updateCheckboxesInDOM();
  });

  drawQuestionBankUI(container);
}

export const renderPYQ = renderPyq;

/**
 * Renders the filter controls, counter, and table container
 * @param {HTMLElement} container
 */
function drawQuestionBankUI(container) {
  const distinctSources = ["all", ...new Set(questionsList.map(q => q.source))].filter(Boolean);
  const distinctTopics = ["all", ...new Set(questionsList.map(q => q.topic))].filter(Boolean);
  const distinctLevels = ["all", "Easy", "Medium", "Hard"];

  const trackCvCount = questionsList.filter(q => q.track === "CodeVita").length;
  const trackAfcatCount = questionsList.filter(q => q.track === "AFCAT").length;

  container.innerHTML = `
    <div class="pyq-controls-wrap">
      <!-- Search & Quick Filters -->
      <div class="pyq-search-row">
        <div class="search-input-box">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="search" id="pyqSearchInput" class="search-input" placeholder="Search by problem title, topic, or source..." value="${escapeHTML(activeFilters.search)}">
        </div>
        <div class="pyq-track-pills">
          <button class="track-pill ${activeFilters.track === 'all' ? 'active' : ''}" data-track="all">All (${questionsList.length})</button>
          <button class="track-pill cv ${activeFilters.track === 'CodeVita' ? 'active' : ''}" data-track="CodeVita">CodeVita (${trackCvCount})</button>
          <button class="track-pill afcat ${activeFilters.track === 'AFCAT' ? 'active' : ''}" data-track="AFCAT">AFCAT (${trackAfcatCount})</button>
        </div>
      </div>

      <!-- Dropdown Filter Strip -->
      <div class="pyq-dropdowns-row">
        <div class="filter-group">
          <label for="pyqSourceFilter">Source:</label>
          <select id="pyqSourceFilter" class="filter-select">
            ${distinctSources.map(s => `<option value="${escapeHTML(s)}" ${activeFilters.source === s ? 'selected' : ''}>${s === 'all' ? 'All Sources' : escapeHTML(s)}</option>`).join("")}
          </select>
        </div>

        <div class="filter-group">
          <label for="pyqTopicFilter">Topic:</label>
          <select id="pyqTopicFilter" class="filter-select">
            ${distinctTopics.map(t => `<option value="${escapeHTML(t)}" ${activeFilters.topic === t ? 'selected' : ''}>${t === 'all' ? 'All Topics' : escapeHTML(t)}</option>`).join("")}
          </select>
        </div>

        <div class="filter-group">
          <label for="pyqLevelFilter">Level:</label>
          <select id="pyqLevelFilter" class="filter-select">
            ${distinctLevels.map(l => `<option value="${escapeHTML(l)}" ${activeFilters.level === l ? 'selected' : ''}>${l === 'all' ? 'All Levels' : escapeHTML(l)}</option>`).join("")}
          </select>
        </div>

        <button id="pyqResetFiltersBtn" class="btn small text" title="Clear all filters">Reset</button>
      </div>

      <!-- Stats Counter -->
      <div class="pyq-counter-bar">
        <span id="pyqStatsText" class="pyq-stats-text">Calculating questions...</span>
      </div>
    </div>

    <!-- Questions Table / Mobile Card Stream -->
    <div class="pyq-table-responsive" id="pyqTableContainer">
      <!-- Injected by renderQuestionsTable() -->
    </div>
  `;

  attachFilterListeners(container);
  renderQuestionsTable();
}

/**
 * Binds events for search, track pills, dropdowns, and reset
 */
function attachFilterListeners(container) {
  const searchInput = container.querySelector("#pyqSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeFilters.search = e.target.value.trim().toLowerCase();
      renderQuestionsTable();
    });
  }

  const trackPills = container.querySelectorAll(".track-pill");
  trackPills.forEach(pill => {
    pill.addEventListener("click", () => {
      trackPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      activeFilters.track = pill.dataset.track;
      renderQuestionsTable();
    });
  });

  const sourceFilter = container.querySelector("#pyqSourceFilter");
  if (sourceFilter) {
    sourceFilter.addEventListener("change", (e) => {
      activeFilters.source = e.target.value;
      renderQuestionsTable();
    });
  }

  const topicFilter = container.querySelector("#pyqTopicFilter");
  if (topicFilter) {
    topicFilter.addEventListener("change", (e) => {
      activeFilters.topic = e.target.value;
      renderQuestionsTable();
    });
  }

  const levelFilter = container.querySelector("#pyqLevelFilter");
  if (levelFilter) {
    levelFilter.addEventListener("change", (e) => {
      activeFilters.level = e.target.value;
      renderQuestionsTable();
    });
  }

  const resetBtn = container.querySelector("#pyqResetFiltersBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      activeFilters = { search: "", track: "all", source: "all", topic: "all", level: "all" };
      const searchBox = container.querySelector("#pyqSearchInput");
      if (searchBox) searchBox.value = "";
      trackPills.forEach(p => p.classList.toggle("active", p.dataset.track === "all"));
      if (sourceFilter) sourceFilter.value = "all";
      if (topicFilter) topicFilter.value = "all";
      if (levelFilter) levelFilter.value = "all";
      renderQuestionsTable();
    });
  }
}

/**
 * Filters, sorts, and renders the questions table
 */
function renderQuestionsTable() {
  const tableContainer = document.getElementById("pyqTableContainer");
  if (!tableContainer) return;

  // 1. Filter Questions
  let filtered = questionsList.filter(q => {
    if (activeFilters.track !== "all" && q.track !== activeFilters.track) return false;
    if (activeFilters.source !== "all" && q.source !== activeFilters.source) return false;
    if (activeFilters.topic !== "all" && q.topic !== activeFilters.topic) return false;
    if (activeFilters.level !== "all" && q.level !== activeFilters.level) return false;
    if (activeFilters.search) {
      const qText = `${q.title} ${q.source} ${q.topic} ${q.track} ${q.level}`.toLowerCase();
      if (!qText.includes(activeFilters.search)) return false;
    }
    return true;
  });

  // 2. Sort Questions
  filtered.sort((a, b) => {
    let valA = a[sortState.column];
    let valB = b[sortState.column];

    if (sortState.column === "day") {
      valA = Number(valA);
      valB = Number(valB);
      return sortState.ascending ? valA - valB : valB - valA;
    }

    valA = String(valA || "").toLowerCase();
    valB = String(valB || "").toLowerCase();
    if (valA < valB) return sortState.ascending ? -1 : 1;
    if (valA > valB) return sortState.ascending ? 1 : -1;
    return 0;
  });

  // 3. Update Solved Counter
  const totalShown = filtered.length;
  const solvedCount = filtered.filter(q => isDone(q.planItemId)).length;
  const statsEl = document.getElementById("pyqStatsText");
  if (statsEl) {
    statsEl.innerHTML = `Showing <b>${totalShown}</b> questions · <b>${solvedCount} of ${totalShown} solved</b> (${totalShown ? Math.round((solvedCount / totalShown) * 100) : 0}%)`;
  }

  // 4. Empty State
  if (totalShown === 0) {
    tableContainer.innerHTML = `
      <div class="empty-state">
        <p>No questions found matching your filter criteria.</p>
        <button class="btn small primary" id="clearEmptyPyqBtn">Clear Filters</button>
      </div>
    `;
    const clearBtn = tableContainer.querySelector("#clearEmptyPyqBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const resetBtn = document.getElementById("pyqResetFiltersBtn");
        if (resetBtn) resetBtn.click();
      });
    }
    return;
  }

  // 5. Construct Table & Card HTML
  const sortArrow = (col) => {
    if (sortState.column !== col) return '<span class="sort-indicator">↕</span>';
    return sortState.ascending ? '<span class="sort-indicator active">▲</span>' : '<span class="sort-indicator active">▼</span>';
  };

  let html = `
    <table class="pyq-table" role="table">
      <thead>
        <tr>
          <th style="width: 44px; text-align: center;">Done</th>
          <th class="sortable-th" data-col="title">Title ${sortArrow("title")}</th>
          <th class="sortable-th" data-col="track" style="width: 100px;">Track ${sortArrow("track")}</th>
          <th class="sortable-th" data-col="source" style="width: 130px;">Source ${sortArrow("source")}</th>
          <th class="sortable-th" data-col="topic" style="width: 130px;">Topic ${sortArrow("topic")}</th>
          <th class="sortable-th" data-col="level" style="width: 90px;">Level ${sortArrow("level")}</th>
          <th class="sortable-th" data-col="day" style="width: 90px; text-align: center;">Day ${sortArrow("day")}</th>
        </tr>
      </thead>
      <tbody>
  `;

  filtered.forEach(q => {
    const done = isDone(q.planItemId);
    const linkIcon = q.link ? `<a href="${escapeHTML(q.link)}" target="_blank" rel="noopener" class="pyq-external-link" title="Open question in new tab">↗</a>` : '';
    const trackBadge = q.track === "CodeVita" ? '<span class="tag cv">CodeVita</span>' : '<span class="tag afcat">AFCAT</span>';
    const sourceClass = q.source.toLowerCase().includes("leetcode") ? 'lc' : q.source.toLowerCase().includes("pyq") ? 'pyq' : q.source.toLowerCase().includes("official") ? 'official' : 'other';

    html += `
      <tr class="pyq-row ${done ? 'solved' : ''}" data-row-id="${q.planItemId}">
        <td class="col-status" data-label="Status">
          <input type="checkbox" class="pyq-checkbox" data-plan-item-id="${q.planItemId}" ${done ? 'checked' : ''} aria-label="Mark ${escapeHTML(q.title)} as solved">
        </td>
        <td class="col-title" data-label="Title">
          <span class="pyq-title-text">${escapeHTML(q.title)}</span>
          ${linkIcon}
          ${q.isStretch ? '<span class="tag stretch">Stretch</span>' : ''}
        </td>
        <td class="col-track" data-label="Track">${trackBadge}</td>
        <td class="col-source" data-label="Source"><span class="tag ${sourceClass}">${escapeHTML(q.source)}</span></td>
        <td class="col-topic" data-label="Topic">${escapeHTML(q.topic)}</td>
        <td class="col-level" data-label="Level"><span class="diff ${escapeHTML(q.level)}">${escapeHTML(q.level)}</span></td>
        <td class="col-day" data-label="Schedule">
          <button class="btn-day-jump" data-day="${q.day}" title="Open Week & Day ${q.day} in Plan">Day ${q.day}</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  tableContainer.innerHTML = html;

  attachTableInteractiveEvents(tableContainer);
}

/**
 * Attaches checkbox ticking, sorting, and day jumping
 */
function attachTableInteractiveEvents(container) {
  // 1. Column Sorting
  const sortHeaders = container.querySelectorAll(".sortable-th");
  sortHeaders.forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.col;
      if (sortState.column === col) {
        sortState.ascending = !sortState.ascending;
      } else {
        sortState.column = col;
        sortState.ascending = true;
      }
      renderQuestionsTable();
    });
  });

  // 2. Checkbox Ticking (1:1 with Plan)
  container.addEventListener("change", (e) => {
    const cb = e.target.closest(".pyq-checkbox");
    if (!cb) return;

    const planItemId = cb.dataset.planItemId;
    const isChecked = cb.checked;

    setDone(planItemId, isChecked);

    const row = cb.closest(".pyq-row");
    if (row) row.classList.toggle("solved", isChecked);

    // Also update matching checkbox in the Plan if currently in the DOM
    const planInputs = document.querySelectorAll(`input[type="checkbox"][data-item-id="${planItemId}"]`);
    planInputs.forEach(pi => {
      pi.checked = isChecked;
      const li = pi.closest(".task-item");
      if (li) li.classList.toggle("done", isChecked);
    });

    updateSolvedCounter();
  });

  // 3. Day Button Jump
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-day-jump");
    if (!btn) return;
    const day = Number(btn.dataset.day);
    if (day) {
      openAndScrollToDay(day);
    }
  });
}

function updateSolvedCounter() {
  const tableContainer = document.getElementById("pyqTableContainer");
  if (!tableContainer) return;
  const checkboxes = tableContainer.querySelectorAll(".pyq-checkbox");
  const total = checkboxes.length;
  let solved = 0;
  checkboxes.forEach(cb => { if (cb.checked) solved++; });

  const statsEl = document.getElementById("pyqStatsText");
  if (statsEl && total > 0) {
    statsEl.innerHTML = `Showing <b>${total}</b> questions · <b>${solved} of ${total} solved</b> (${Math.round((solved / total) * 100)}%)`;
  }
}

function updateCheckboxesInDOM() {
  const checkboxes = document.querySelectorAll(".pyq-checkbox");
  checkboxes.forEach(cb => {
    const planItemId = cb.dataset.planItemId;
    const done = isDone(planItemId);
    if (cb.checked !== done) {
      cb.checked = done;
      const row = cb.closest(".pyq-row");
      if (row) row.classList.toggle("solved", done);
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

export { renderPyq as renderPYQ };
