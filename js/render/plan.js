/**
 * ====================================================================
 * RENDER/PLAN.JS — 11-Week (77-Day) Unified Dual-Track Plan Engine
 * Features: Lazy DOM rendering, Split-Track Day Cards, Track Filter,
 * Day 0 Sprint, Live Reactivity, and "Jump to Today".
 * ====================================================================
 */

import {
  getDateForDay,
  formatShortDate,
  toISODate,
  jumpToToday,
  isDateToday,
  getPlanPreStartInfo,
  getDayScheduleType,
  weekNumber,
  CV_TOTAL_DAYS,
  TOTAL_PLAN_DAYS
} from "../dates.js";

import {
  getState,
  updateState,
  isDone,
  setDone,
  counts,
  dayCounts,
  extraCounts,
  getCoreProblemsPerDay,
  setCoreProblemsPerDay,
  setDayOpen,
  isDayOpen,
  setTrackFilter,
  getTrackFilter,
  resetProgress,
  subscribe,
  makeItemId
} from "../store.js";

const CV_REFERENCE_URL = "https://perryvegehan.github.io/Codevita/";

// Cache of loaded data files
let cachedPlanData = null;
let cachedCvDaysData = null;
let cachedAfcatLecturesData = null;

// Track which weeks have been rendered to support lazy DOM generation
const renderedWeeks = new Set();

/**
 * Main render function for the Plan section
 * @param {object} planData - from /data/plan-data.json
 * @param {object} cvDaysData - from /data/cv-days.json
 * @param {object} [afcatLecturesData] - from /data/afcat-lectures.json
 */
export function renderPlan(planData, cvDaysData, afcatLecturesData) {
  const container = document.getElementById("planContainer");
  if (!container) return;

  if (planData) cachedPlanData = planData;
  if (cvDaysData) cachedCvDaysData = cvDaysData;
  if (afcatLecturesData !== undefined) cachedAfcatLecturesData = afcatLecturesData;

  const state = getState();
  const startISO = state.startDate || "2026-11-16";
  const todayDayIndex = jumpToToday(startISO);
  const currentWeekNum = weekNumber(todayDayIndex);

  // Apply initial track filter to document body
  document.body.setAttribute("data-track-filter", getTrackFilter());

  const preStart = getPlanPreStartInfo(startISO);
  const preStartBannerHTML = preStart.isBeforeStart
    ? `<div id="planPreStartBanner" class="plan-prestart-banner" role="status">
        <span class="banner-icon">📅</span>
        <span class="banner-text">${escapeHTML(preStart.message)}</span>
      </div>`
    : "";

  // 1. Build Plan Controls & Legend Shell
  container.innerHTML = `
    ${preStartBannerHTML}
    <!-- CONTROLS ROW -->
    <div class="plan-controls-row">
      <div class="plan-info-badges">
        <span class="badge afcat" id="planStartBadge">Start: ${formatShortDate(startISO, true)}</span>
        <span class="badge cv" id="planR1Badge">${state.round1Date ? `Round 1: ${formatShortDate(state.round1Date, true)}` : "Round 1: TBA"}</span>
        <button class="btn small primary" id="planJumpTodayBtn" title="Scroll to today's schedule">Jump to today</button>
      </div>

      <div class="plan-actions-bar">
        <!-- Track Filter Segmented Control -->
        <div class="track-filter-group" role="group" aria-label="Filter Track">
          <button class="filter-btn ${getTrackFilter() === 'both' ? 'active' : ''}" data-filter="both">Both</button>
          <button class="filter-btn ${getTrackFilter() === 'afcat' ? 'active' : ''}" data-filter="afcat">AFCAT</button>
          <button class="filter-btn ${getTrackFilter() === 'cv' ? 'active' : ''}" data-filter="cv">CodeVita</button>
        </div>

        <!-- Core Problems per Day Setting -->
        <div class="core-problems-control">
          <label for="coreProblemsSelect">Core problems/day:</label>
          <select id="coreProblemsSelect" aria-label="Core problems per day">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="all">All</option>
          </select>
        </div>

        <button class="btn small ghost" id="planToggleWeeksBtn">Expand all</button>
        <button class="btn small ghost" id="planResetBtn">Reset progress</button>
      </div>
    </div>

    <!-- TYPE LEGEND CHIPS -->
    <div class="plan-legend" aria-label="Task Type Legend">
      <span class="tag afcat">Lecture</span>
      <span class="tag afcat">Practice</span>
      <span class="tag pyq">PYQ</span>
      <span class="tag mock">Mock</span>
      <span class="tag amber">Revision</span>
      <span class="tag other">Job</span>
      <span class="tag cv">CodeVita video</span>
      <span class="tag lc">CodeVita problems</span>
      <span class="tag stretch">Stretch (optional)</span>
      <span class="tag rest">Rest (green)</span>
    </div>

    <!-- DAY 0 SETUP SPRINT BLOCK -->
    <div id="day0Container"></div>

    <!-- 11 COLLAPSIBLE WEEKS CONTAINER -->
    <div id="weeksList" class="weeks-list"></div>
  `;

  // 2. Render Day 0 Setup Block
  renderDay0Block(document.getElementById("day0Container"));

  // 3. Render 11 Week Skeletons
  renderWeekSkeletons(document.getElementById("weeksList"), currentWeekNum);

  // 4. Wire Controls & Event Delegation
  wirePlanControls();

  // 5. Subscribe to store changes to keep week progress bars and badges synchronized
  subscribe(() => {
    updateAllWeekProgressBars();
    updateDay0Progress();
    updateAllRenderedDays();
    const coreSelect = document.getElementById("coreProblemsSelect");
    if (coreSelect && coreSelect.value !== String(getCoreProblemsPerDay())) {
      coreSelect.value = String(getCoreProblemsPerDay());
    }
  });
}

/**
 * Renders Day 0 Setup Sprint (12-15 Nov) before Week 1
 * @param {HTMLElement} container
 */
function renderDay0Block(container) {
  if (!container || !cachedPlanData || !Array.isArray(cachedPlanData.day0)) return;

  let taskCount = 0;
  let html = `
    <article class="day0-card" id="day0Block">
      <button class="day0-head" aria-expanded="false" id="day0ToggleBtn">
        <div class="day0-title">
          <span class="badge amber">Day 0</span>
          <span>Pre-Launch Setup Sprint (12–15 Nov 2026)</span>
        </div>
        <div class="day0-progress" id="day0ProgressText">0/8 done</div>
      </button>
      <div class="day0-body" id="day0Body" style="display: none;">
  `;

  cachedPlanData.day0.forEach((group) => {
    html += `
      <div class="day0-group">
        <div class="day0-group-label">${group.label}</div>
        <ul class="task-items-list">
    `;

    group.tasks.forEach((taskDesc) => {
      const id = makeItemId(0, "check", String(taskCount));
      const checked = isDone(id);
      html += `
        <li>
          <label class="task-item-label ${checked ? 'checked' : ''}" data-id="${id}">
            <input type="checkbox" data-id="${id}" ${checked ? 'checked' : ''}>
            <span class="task-content">${escapeHTML(taskDesc)}</span>
          </label>
        </li>
      `;
      taskCount++;
    });

    html += `</ul></div>`;
  });

  html += `</div></article>`;
  container.innerHTML = html;

  const toggleBtn = document.getElementById("day0ToggleBtn");
  const bodyEl = document.getElementById("day0Body");
  if (toggleBtn && bodyEl) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = bodyEl.style.display !== "none";
      bodyEl.style.display = isOpen ? "none" : "grid";
      toggleBtn.setAttribute("aria-expanded", !isOpen);
    });
  }

  updateDay0Progress();
}

/**
 * Updates Day 0 progress text
 */
function updateDay0Progress() {
  const el = document.getElementById("day0ProgressText");
  if (!el || !cachedPlanData || !Array.isArray(cachedPlanData.day0)) return;

  let done = 0;
  let total = 0;
  let taskIdx = 0;

  cachedPlanData.day0.forEach((g) => {
    (g.tasks || []).forEach(() => {
      const id = makeItemId(0, "check", String(taskIdx));
      if (isDone(id)) done++;
      total++;
      taskIdx++;
    });
  });

  el.textContent = `${done}/${total} done`;
}

/**
 * Renders skeletons for all 11 weeks.
 * Days inside a week are rendered LAZILY when that week is expanded.
 * @param {HTMLElement} container
 * @param {number} currentWeekNum
 */
function renderWeekSkeletons(container, currentWeekNum) {
  if (!container || !cachedPlanData) return;

  const state = getState();
  const startISO = state.startDate || "2026-11-16";
  const weeks = cachedPlanData.weeks || [];

  renderedWeeks.clear();

  let html = "";
  for (let w = 1; w <= 11; w++) {
    const weekData = weeks[w - 1] || {};
    const weekStartDay = (w - 1) * 7 + 1;
    const weekEndDay = w * 7;
    const startDate = getDateForDay(weekStartDay, startISO);
    const endDate = getDateForDay(weekEndDay, startISO);
    const dateRangeStr = `${formatShortDate(startDate)} – ${formatShortDate(endDate, true)}`;

    const isCurrentWeek = w === currentWeekNum;
    const isOpen = isCurrentWeek; // Current week open by default

    // Week Theme Line
    let themeLine = "";
    if (w <= 8) {
      const blockATheme = weekData.afcat_weekdays && weekData.afcat_weekdays[0] ? weekData.afcat_weekdays[0].blockA.split(":")[0] : "Maths/Reasoning";
      themeLine = `AFCAT ${blockATheme} & Sectionals · CodeVita Days ${weekStartDay}–${weekEndDay}`;
    } else {
      themeLine = w === 11 ? "AFCAT Exam Week: Final Recall, Rest & Exam Day (31 Jan)" : "AFCAT Full Mock Simulations & Revision Sprint";
    }

    html += `
      <section class="week-block ${isCurrentWeek ? 'current-week' : ''} ${isOpen ? 'open' : ''}" data-week="${w}" id="week-${w}">
        <button class="week-head" aria-expanded="${isOpen}" aria-controls="weekDays-${w}" data-week="${w}">
          <div class="week-info">
            <div class="week-top-line">
              <span class="week-badge">Week ${w}</span>
              <span class="week-dates">${dateRangeStr}</span>
            </div>
            <div class="week-title">${w === 11 ? 'Final Lap & Exam Day' : `Week ${w} Sprint`}</div>
            <div class="week-theme">${escapeHTML(themeLine)}</div>
          </div>
          <div class="week-right">
            <div class="week-progress-wrap">
              <span class="week-progress-num" id="weekProgText-${w}">0/0</span>
              <div class="week-progress-track">
                <div class="week-progress-fill" id="weekProgFill-${w}"></div>
              </div>
            </div>
            <svg class="chev-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </button>

        <div class="week-days-container" id="weekDays-${w}">
          <!-- Days lazily rendered upon expansion -->
        </div>
      </section>
    `;
  }

  container.innerHTML = html;

  // Lazily render current week immediately
  if (currentWeekNum >= 1 && currentWeekNum <= 11) {
    lazyRenderWeekDays(currentWeekNum);
  }

  // Update week progress bars
  updateAllWeekProgressBars();
}

/**
 * Lazily generates the 7 day cards for a given week if not already rendered
 * @param {number} weekNum
 * @returns {number} render duration in milliseconds
 */
export function lazyRenderWeekDays(weekNum) {
  const container = document.getElementById(`weekDays-${weekNum}`);
  if (!container) return 0;

  if (renderedWeeks.has(weekNum)) {
    return 0; // Already rendered
  }

  const startTime = performance.now();

  const state = getState();
  const startISO = state.startDate || "2026-11-16";
  const todayDayIndex = jumpToToday(startISO);
  const weekData = (cachedPlanData && cachedPlanData.weeks && cachedPlanData.weeks[weekNum - 1]) || {};

  const weekStartDay = (weekNum - 1) * 7 + 1;
  let html = "";

  for (let i = 0; i < 7; i++) {
    const day = weekStartDay + i;
    const date = getDateForDay(day, startISO);
    const isToday = isDateToday(date);
    const defaultOpen = isToday;
    const open = isDayOpen(day, defaultOpen);
    const sched = getDayScheduleType(day);

    const isMockDay = sched.cvType === "mock";
    const isExamDay = day === 77;

    // Day Counts for Mini Badges
    const countsData = dayCounts(day);

    // Summary Topic Text
    let summaryText = "";
    if (i < 5 && weekData.afcat_weekdays && weekData.afcat_weekdays[i]) {
      const dTopic = weekData.afcat_weekdays[i];
      summaryText = `${dTopic.blockA} · ${dTopic.english}`;
    } else if (sched.isSaturday) {
      const cvSatLabel = day === 55 ? "CodeVita Final Revision" : (sched.cvType === "mock" ? "CodeVita 3h Mock" : "Weekend Practice");
      summaryText = `${weekData.afcat_saturday || "Sectional Test"} · ${cvSatLabel}`;
    } else if (sched.isSunday) {
      const cvSunLabel = day === 56 ? "CodeVita Exam Eve" : "Rest Day";
      summaryText = isExamDay ? "AFCAT 01/2027 EXAM DAY" : `${weekData.afcat_sunday || "Weekly Revision"} · ${cvSunLabel}`;
    }

    html += `
      <article class="day-card ${isToday ? 'today' : ''} ${isMockDay ? 'mock-day' : ''} ${isExamDay ? 'exam-day' : ''} ${open ? 'open' : ''}" data-day="${day}" id="dayCard-${day}">
        <button class="day-card-head" aria-expanded="${open}" aria-controls="dayBody-${day}" data-day="${day}">
          <div class="day-num-tile">
            <span class="tile-label">${sched.isSaturday ? 'SAT' : sched.isSunday ? 'SUN' : formatShortDate(date).split(',')[0]}</span>
            <span class="tile-num">${day}</span>
          </div>

          <div class="day-main-info">
            <div class="day-title-row">
              <span class="day-date-text">${formatShortDate(date)}</span>
              ${isToday ? '<span class="badge amber">Today</span>' : ''}
              ${isMockDay ? '<span class="tag mock">Mock</span>' : ''}
              ${isExamDay ? '<span class="badge amber">EXAM DAY</span>' : ''}
            </div>
            <div class="day-summary-text">${escapeHTML(summaryText)}</div>
          </div>

          <div class="day-right-controls">
            <span class="mini-badge afcat" id="badgeAfcat-${day}">AFCAT ${countsData.afcat.done}/${countsData.afcat.total}</span>
            <span class="mini-badge cv" id="badgeCv-${day}">CV ${countsData.cv.done}/${countsData.cv.total}</span>
            <svg class="chev-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </button>

        <div class="day-card-body" id="dayBody-${day}" style="${open ? 'display: grid;' : 'display: none;'}">
          ${renderDayCardBody(day, weekNum, i, weekData, sched, isExamDay)}
        </div>
      </article>
    `;
  }

  container.innerHTML = html;
  renderedWeeks.add(weekNum);

  const durationMs = Math.round(performance.now() - startTime);
  console.log(`[plan] Week ${weekNum} rendered lazily in ${durationMs}ms`);
  return durationMs;
}

/**
 * Renders the 3 track blocks inside a Day Card body
 * @param {number} day
 * @param {number} weekNum
 * @param {number} dayOffsetInWeek (0=Mon..6=Sun)
 * @param {object} weekData
 * @param {object} sched
 * @param {boolean} isExamDay
 * @returns {string} HTML string
 */
function renderDayCardBody(day, weekNum, dayOffsetInWeek, weekData, sched, isExamDay) {
  let html = "";

  // ========================================================
  // 1. AFCAT TRACK BLOCK
  // ========================================================
  html += `
    <div class="track-block afcat">
      <div class="track-block-header">
        <span class="track-block-title">🔵 AFCAT Track</span>
        <span class="track-time-slot">${dayOffsetInWeek < 5 ? '07:30–10:45 & 16:00–16:45' : 'Test & Revision'}</span>
      </div>
      <p class="track-header-note">Lecture links open a YouTube search. Pick a teacher you like.</p>
      <ul class="task-items-list">
  `;

  if (dayOffsetInWeek < 5 && weekData.afcat_weekdays && weekData.afcat_weekdays[dayOffsetInWeek]) {
    const topics = weekData.afcat_weekdays[dayOffsetInWeek];
    const dayLectures = (cachedAfcatLecturesData && cachedAfcatLecturesData.days && cachedAfcatLecturesData.days[String(day)]) || null;

    const makeLectureLink = (kindKey, topicText) => {
      if (!dayLectures || !dayLectures[kindKey] || !dayLectures[kindKey].url || dayLectures[kindKey].no_video_found) return "";
      const lec = dayLectures[kindKey];
      const ariaTopic = lec.title || topicText || "topic";
      let labelText = "Lecture ▶";
      if (lec.channel && lec.duration) {
        labelText = `Lecture ▶ ${lec.channel}, ${lec.duration}${lec.long ? " (long)" : ""}`;
      }
      return `<a class="lecture-link" href="${escapeHTML(lec.url)}" target="_blank" rel="noopener noreferrer" aria-label="Watch lecture on YouTube: ${escapeHTML(ariaTopic)}" onclick="event.stopPropagation();">${escapeHTML(labelText)}</a>`;
    };

    if (topics.blockA && topics.blockA !== "-") {
      const link = makeLectureLink("blockA", topics.blockA);
      html += renderTaskCheckboxItem(day, "afcat", "blockA", `Block A (Maths/Reasoning): ${escapeHTML(topics.blockA)} ${link}`, "07:30–09:30");
    }
    if (topics.english && topics.english !== "-") {
      const link = makeLectureLink("english", topics.english);
      html += renderTaskCheckboxItem(day, "afcat", "english", `English: ${escapeHTML(topics.english)} ${link}`, "09:45–10:45");
    }
    if (topics.ga && topics.ga !== "-") {
      const link = makeLectureLink("ga", topics.ga);
      html += renderTaskCheckboxItem(day, "afcat", "ga", `General Awareness: ${escapeHTML(topics.ga)} ${link}`, "16:00–16:45");
    }
  } else if (sched.isSaturday) {
    html += renderTaskCheckboxItem(day, "afcat", "sat", weekData.afcat_saturday || "Saturday Sectional Test", "Morning test block");
  } else if (sched.isSunday) {
    html += renderTaskCheckboxItem(day, "afcat", "sun", weekData.afcat_sunday || "Sunday Weekly Revision", "Recall & error log");
  }

  html += `</ul></div>`;

  // ========================================================
  // 2. CODEVITA TRACK BLOCK
  // ========================================================
  html += `
    <div class="track-block cv">
      <div class="track-block-header">
        <span class="track-block-title">🟢 CodeVita Track</span>
        <span class="track-time-slot">${day <= CV_TOTAL_DAYS ? '11:00–15:00' : '45 min daily'}</span>
      </div>
      <p class="track-header-note">Core = about 3 hours (1.5h video + 1.5h problems). Extra is optional.</p>
  `;

  if (day <= CV_TOTAL_DAYS) {
    const userCvItems = cachedCvDaysData && cachedCvDaysData.days && cachedCvDaysData.days[day - 1] ? cachedCvDaysData.days[day - 1].items : null;

    const getItemBadge = (item, isStretch) => {
      if (isStretch) return '<span class="tag stretch">Stretch</span>';
      if (item.type === "optional") return '<span class="tag stretch">Optional</span>';
      if (item.type === "video") return '<span class="tag vid">Video</span>';
      if (item.type === "mock") return '<span class="tag mock">Mock</span>';
      if (item.type === "official") return '<span class="tag official">Official</span>';
      if (item.type === "leetcode") return '<span class="tag lc">LeetCode</span>';
      if (item.type === "pyq") return '<span class="tag pyq">PYQ</span>';
      if (item.type === "other") return '<span class="tag other">Other</span>';
      return '<span class="tag cv">DSA</span>';
    };

    const renderCvItem = (item, isStretch = false, customKind = null, timeSlot = "") => {
      const stableId = item.id;
      const isActuallyStretch = isStretch || item.type === "stretch" || item.type === "optional" || item.s === true;
      const badge = getItemBadge(item, isActuallyStretch);
      const titleLink = item.url
        ? `<a class="cv-item-link" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">${escapeHTML(item.title)} <span class="ext-icon" aria-hidden="true">↗</span></a>`
        : `<span class="task-title-text">${escapeHTML(item.title)}</span>`;
      const diff = item.level && item.level !== "Tutorial" && item.level !== "Practice"
        ? `<span class="diff-badge">${escapeHTML(item.level)}</span>`
        : "";
      const textHtml = `${badge} ${titleLink}${diff ? ' ' + diff : ''}`;
      const kind = customKind || (isActuallyStretch ? "stretch" : "cv");
      return renderTaskCheckboxItem(day, kind, stableId, textHtml, timeSlot || item.topic || "");
    };

    if (sched.isSunday) {
      // Sunday is CodeVita Rest Day / Exam Eve
      const isExamEve = day === 56;
      html += `
        <ul class="task-items-list">
          <li>
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px;">
              <span class="tag ${isExamEve ? 'exam' : 'rest'}">${isExamEve ? 'Exam Eve' : 'Rest day'}</span>
              <span style="font-size: var(--text-sm); color: var(--ink-secondary);">${isExamEve ? 'CodeVita Exam Eve · Rules, checklist & sleep early.' : 'CodeVita Rest Day · No new coding topics. Rest and prepare for next week.'}</span>
            </div>
          </li>
      `;
      // Preserve any Sunday items (e.g. Day 7, Day 35, Day 56 videos) without silently dropping them
      if (userCvItems && userCvItems.length > 0) {
        userCvItems.forEach((item) => {
          html += renderCvItem(item, true);
        });
      }
      html += `</ul>`;
    } else if (sched.isSaturday) {
      // Saturday is Weekend Practice, 3-Hour Mock, or Day 55 Final Revision
      const isFinalRevisionDay = day === 55;
      html += `<ul class="task-items-list">`;
      if (isFinalRevisionDay) {
        html += `
          <li>
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px;">
              <span class="tag rest">Final Revision</span>
              <span style="font-size: var(--text-sm); color: var(--ink-secondary);">CodeVita Final Revision · Review error log & formula sheets, sleep early. No new topics.</span>
            </div>
          </li>
        `;
      }
      if (userCvItems && userCvItems.length > 0) {
        userCvItems.forEach((item) => {
          const isStretch = isFinalRevisionDay || item.type === "stretch" || item.type === "optional" || item.s === true;
          html += renderCvItem(item, isStretch);
        });
      } else if (isFinalRevisionDay) {
        html += renderTaskCheckboxItem(day, "stretch", `d${day}-revision`, "CodeVita Final Revision: Review error log & formula sheets", "Early sleep");
      } else {
        const satTitle = weekNum <= 3 ? "Weekend Practice (3 Hours)" : `CodeVita Mock ${weekNum - 3} (3-Hour Contest Simulation)`;
        html += renderTaskCheckboxItem(day, "cv", `d${day}-practice`, satTitle, "Timed session");
      }
      html += `</ul>`;
    } else {
      // Weekday Learning Days (Mon-Fri, days 1-56): Core vs Extra Classification
      const N = getCoreProblemsPerDay();
      const problemTypes = new Set(["leetcode", "pyq", "official", "other"]);
      const coreItems = [];
      const extraItems = [];
      const stretchItems = [];

      if (userCvItems && userCvItems.length > 0) {
        let probCount = 0;
        userCvItems.forEach((item, itemIdx) => {
          const isStretch = item.type === "stretch" || item.type === "optional" || item.s === true;
          if (isStretch) {
            stretchItems.push({ item, itemIdx });
          } else if (item.type === "video" || item.type === "mock") {
            coreItems.push({ item, itemIdx });
          } else if (problemTypes.has(item.type)) {
            probCount++;
            if (N === "all" || probCount <= N) {
              coreItems.push({ item, itemIdx });
            } else {
              extraItems.push({ item, itemIdx });
            }
          } else {
            coreItems.push({ item, itemIdx });
          }
        });

        // 1. Core Group (counted)
        html += `
          <div class="cv-group core-group">
            <span class="cv-group-title">Core</span>
            <ul class="task-items-list core-list">
        `;
        coreItems.forEach(({ item }) => {
          html += renderCvItem(item, false);
        });
        html += `</ul></div>`;

        // 2. Extra Practice Group (Optional & Collapsed)
        if (extraItems.length > 0 || stretchItems.length > 0) {
          const dayExtra = extraCounts(day);
          html += `
            <details class="extra-practice-details" id="extraDetails-${day}">
              <summary class="extra-practice-summary">
                <span class="extra-title">Extra practice (optional)</span>
                <span class="badge muted" id="extraBadge-${day}">Extra ${dayExtra.done}/${dayExtra.total} done</span>
              </summary>
              <ul class="task-items-list extra-list">
          `;
          extraItems.forEach(({ item }) => {
            html += renderCvItem(item, false);
          });
          stretchItems.forEach(({ item }) => {
            html += renderCvItem(item, true);
          });
          html += `</ul></details>`;
        }
      } else {
        // Default video & problem slots with reference site fallback
        const refLink = `${CV_REFERENCE_URL}#day-${day}`;
        html += `
          <div class="cv-group core-group">
            <span class="cv-group-title">Core</span>
            <ul class="task-items-list core-list">
              ${renderTaskCheckboxItem(
                day, "cv", `d${day}-v1`,
                `Site Day ${day}: Video lecture <a class="cv-item-link" href="${refLink}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">Open Day ${day} on reference site <span class="ext-icon" aria-hidden="true">↗</span></a>`,
                "11:00–12:30"
              )}
              ${renderTaskCheckboxItem(
                day, "cv", `d${day}-p1`,
                `Site Day ${day}: Problem solving <a class="cv-item-link" href="${refLink}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">Open problems on reference site <span class="ext-icon" aria-hidden="true">↗</span></a>`,
                "13:30–15:00"
              )}
            </ul>
          </div>
        `;
      }
    }
  } else {
    // Days 57-77: Maintenance problem
    html += `
      <ul class="task-items-list">
        ${renderTaskCheckboxItem(day, "cv", `d${day}-maint`, "Maintenance: 1 Coding Problem (45 min)", "Keep problem-solving intuition sharp")}
      </ul>
    `;
  }

  html += `</div>`;

  // ========================================================
  // 3. HABITS & CAREER BLOCK
  // ========================================================
  html += `
    <div class="track-block habits">
      <div class="track-block-header">
        <span class="track-block-title">🟣 Habits & Career</span>
        <span class="track-time-slot">Daily Disciplines</span>
      </div>
      <ul class="task-items-list">
        ${renderTaskCheckboxItem(day, "habit", "exercise", "Morning Running / Exercise (stamina & fresh mind)", "06:15–06:45")}
        ${renderTaskCheckboxItem(day, "habit", "revision", "Active Recall: Day's notes without looking + Error log", "17:30–18:15")}
        ${renderTaskCheckboxItem(day, "habit", "job", "Job Block: 5 applications / Resume / Projects update", "18:15–18:45")}
        ${renderTaskCheckboxItem(day, "habit", "night_drill", "Night Drill: 20 vocab flashcards + 10 reasoning speed drills", "20:00–20:30")}
      </ul>
    </div>
  `;

  // Exam Day Banner for Day 77
  if (isExamDay) {
    html += `
      <div class="exam-day-banner">
        ⚠️ <strong>AFCAT 01/2027 EXAM DAY REMINDER:</strong><br>
        Report 8:00 AM, last entry 9:00 AM. Exam duration: 10:00 AM to 12:00 noon.<br>
        Carry 2x Admit Card prints, original Aadhaar card, two passport photos, and blue/black ballpoint pen (confirm on official portal).
      </div>
    `;
  }

  return html;
}

/**
 * Generates an accessible checkbox list item
 */
function renderTaskCheckboxItem(day, kind, key, textHTML, timeSlot) {
  const id = makeItemId(day, kind, key);
  const checked = isDone(id);
  return `
    <li>
      <label class="task-item-label ${checked ? 'checked' : ''}" data-id="${id}">
        <input type="checkbox" data-id="${id}" ${checked ? 'checked' : ''}>
        <span class="task-content">
          ${textHTML}
          ${timeSlot ? `<span class="sub-note">${escapeHTML(timeSlot)}</span>` : ''}
        </span>
      </label>
    </li>
  `;
}

/**
 * Updates week progress bar and X/N numbers
 * @param {number} weekNum
 */
export function updateWeekProgressBar(weekNum) {
  const textEl = document.getElementById(`weekProgText-${weekNum}`);
  const fillEl = document.getElementById(`weekProgFill-${weekNum}`);
  if (!textEl || !fillEl) return;

  const wCounts = counts({ week: weekNum });
  textEl.textContent = `${wCounts.done}/${wCounts.total}`;
  fillEl.style.width = `${wCounts.pct}%`;
}

/**
 * Updates all 11 week progress bars
 */
export function updateAllWeekProgressBars() {
  for (let w = 1; w <= 11; w++) {
    updateWeekProgressBar(w);
  }
}

/**
 * Updates the mini-badges (AFCAT x/y, CV x/y, Extra x/y) on a specific day card
 * @param {number} dayNum
 */
export function updateDayMiniBadges(dayNum) {
  const afcatEl = document.getElementById(`badgeAfcat-${dayNum}`);
  const cvEl = document.getElementById(`badgeCv-${dayNum}`);
  const extraBadgeEl = document.getElementById(`extraBadge-${dayNum}`);
  const dayCard = document.getElementById(`dayCard-${dayNum}`);

  const countsData = dayCounts(dayNum);
  if (afcatEl) afcatEl.textContent = `AFCAT ${countsData.afcat.done}/${countsData.afcat.total}`;
  if (cvEl) cvEl.textContent = `CV ${countsData.cv.done}/${countsData.cv.total}`;
  if (extraBadgeEl) {
    const dayExtra = extraCounts(dayNum);
    extraBadgeEl.textContent = `Extra ${dayExtra.done}/${dayExtra.total} done`;
  }

  if (dayCard) {
    const isAllDone = (countsData.afcat.total > 0 && countsData.afcat.done === countsData.afcat.total) &&
                      (countsData.cv.total === 0 || countsData.cv.done === countsData.cv.total);
    dayCard.classList.toggle("all-done", isAllDone);
  }
}

/**
 * Updates all rendered day cards in the DOM (badges, and re-renders open day bodies)
 */
export function updateAllRenderedDays() {
  const renderedCards = document.querySelectorAll(".day-card");
  renderedCards.forEach((card) => {
    const day = +card.dataset.day;
    if (!day) return;
    updateDayMiniBadges(day);
    if (card.classList.contains("open")) {
      const bodyEl = document.getElementById(`dayBody-${day}`);
      if (bodyEl && cachedPlanData) {
        const wNum = weekNumber(day);
        const weekData = cachedPlanData.weeks && cachedPlanData.weeks[wNum - 1];
        const dayOffset = (day - 1) % 7;
        const sched = getDayScheduleType(day);
        const isExamDay = day === 77;
        const wasExtraOpen = bodyEl.querySelector(".extra-practice-details[open]") !== null;
        bodyEl.innerHTML = renderDayCardBody(day, wNum, dayOffset, weekData, sched, isExamDay);
        if (wasExtraOpen) {
          const newDetails = bodyEl.querySelector(".extra-practice-details");
          if (newDetails) newDetails.open = true;
        }
      }
    }
  });
}

/**
 * Wires events on Plan controls, week accordions, day cards, and checkboxes
 */
function wirePlanControls() {
  const container = document.getElementById("planContainer");
  if (!container) return;

  // 0. Core Problems per Day Setting Dropdown
  const coreSelect = document.getElementById("coreProblemsSelect");
  if (coreSelect) {
    coreSelect.value = String(getCoreProblemsPerDay());
    coreSelect.addEventListener("change", (e) => {
      const val = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
      setCoreProblemsPerDay(val);
    });
  }

  // 1. Jump to Today Button
  const jumpBtn = document.getElementById("planJumpTodayBtn");
  if (jumpBtn) {
    jumpBtn.addEventListener("click", () => {
      const state = getState();
      const todayDay = jumpToToday(state.startDate);
      const targetWeek = weekNumber(todayDay);

      // Open target week
      openWeek(targetWeek);

      // Open target day card
      openDayCard(todayDay);

      // Smooth scroll to day card (respecting prefers-reduced-motion)
      const dayEl = document.getElementById(`dayCard-${todayDay}`);
      if (dayEl) {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        dayEl.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  }

  // 2. Track Filter Buttons ("Both" / "AFCAT" / "CodeVita")
  const filterBtns = container.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const filter = e.target.dataset.filter;
      setTrackFilter(filter);
      document.body.setAttribute("data-track-filter", filter);
      filterBtns.forEach((b) => b.classList.toggle("active", b.dataset.filter === filter));
    });
  });

  // 3. Expand / Collapse All Toggle Button
  const toggleWeeksBtn = document.getElementById("planToggleWeeksBtn");
  if (toggleWeeksBtn) {
    toggleWeeksBtn.addEventListener("click", () => {
      const allWeeks = container.querySelectorAll(".week-block");
      const isAnyClosed = Array.from(allWeeks).some((w) => !w.classList.contains("open"));

      allWeeks.forEach((w) => {
        const wNum = +w.dataset.week;
        if (isAnyClosed) {
          openWeek(wNum);
        } else {
          closeWeek(wNum);
        }
      });

      toggleWeeksBtn.textContent = isAnyClosed ? "Collapse all" : "Expand all";
    });
  }

  // 4. Plan Reset Button
  const resetBtn = document.getElementById("planResetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetProgress();
    });
  }

  // 5. Event Delegation for Week Accordion Headers & Links
  container.addEventListener("click", (e) => {
    // If an anchor tag or link was clicked, allow link to open without bubbling to label
    const anchor = e.target.closest("a");
    if (anchor) {
      e.stopPropagation();
      return;
    }

    const weekHead = e.target.closest(".week-head");
    if (weekHead) {
      const weekBlock = weekHead.closest(".week-block");
      const weekNum = +weekBlock.dataset.week;
      const isOpen = weekBlock.classList.contains("open");

      if (isOpen) {
        closeWeek(weekNum);
      } else {
        openWeek(weekNum);
      }
      return;
    }

    // Day Card Header Click
    const dayHead = e.target.closest(".day-card-head");
    if (dayHead) {
      const dayCard = dayHead.closest(".day-card");
      const dayNum = +dayCard.dataset.day;
      const isOpen = dayCard.classList.contains("open");

      if (isOpen) {
        closeDayCard(dayNum);
      } else {
        openDayCard(dayNum);
      }
      return;
    }
  });

  // 6. Event Delegation for Task Checkboxes (Live Reactivity)
  container.addEventListener("change", (e) => {
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (!checkbox) return;

    const id = checkbox.dataset.id;
    const isChecked = checkbox.checked;

    // Persist to store
    setDone(id, isChecked);

    // Update checkbox item styling
    const label = checkbox.closest(".task-item-label");
    if (label) {
      label.classList.toggle("checked", isChecked);
    }

    // Parse day number from ID
    const dayNum = +id.split("|")[0];
    if (dayNum > 0) {
      updateDayMiniBadges(dayNum);
      const wNum = weekNumber(dayNum);
      updateWeekProgressBar(wNum);
    } else {
      updateDay0Progress();
    }
  });

  // 7. Check URL hash or query for deep-linking (e.g. #dayCard-77 or ?day=77)
  const hashMatch = window.location.hash.match(/#dayCard-(\d+)/);
  const paramMatch = new URLSearchParams(window.location.search).get("day");
  const targetDay = hashMatch ? +hashMatch[1] : (paramMatch ? +paramMatch : null);
  if (targetDay && targetDay >= 1 && targetDay <= TOTAL_PLAN_DAYS) {
    const w = weekNumber(targetDay);
    openWeek(w);
    openDayCard(targetDay);
    setTimeout(() => {
      const el = document.getElementById(`dayCard-${targetDay}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }
}

/**
 * Expands a week block and lazily renders its days
 * @param {number} weekNum
 */
export function openWeek(weekNum) {
  const weekBlock = document.getElementById(`week-${weekNum}`);
  if (!weekBlock) return;

  lazyRenderWeekDays(weekNum);

  weekBlock.classList.add("open");
  const head = weekBlock.querySelector(".week-head");
  if (head) head.setAttribute("aria-expanded", "true");

  const daysContainer = document.getElementById(`weekDays-${weekNum}`);
  if (daysContainer) daysContainer.style.display = "grid";

  updateWeekProgressBar(weekNum);
}

/**
 * Collapses a week block
 * @param {number} weekNum
 */
export function closeWeek(weekNum) {
  const weekBlock = document.getElementById(`week-${weekNum}`);
  if (!weekBlock) return;

  weekBlock.classList.remove("open");
  const head = weekBlock.querySelector(".week-head");
  if (head) head.setAttribute("aria-expanded", "false");

  const daysContainer = document.getElementById(`weekDays-${weekNum}`);
  if (daysContainer) daysContainer.style.display = "none";
}

/**
 * Expands a day card
 * @param {number} dayNum
 */
export function openDayCard(dayNum) {
  setDayOpen(dayNum, true);
  const card = document.getElementById(`dayCard-${dayNum}`);
  if (!card) return;

  card.classList.add("open");
  const head = card.querySelector(".day-card-head");
  if (head) head.setAttribute("aria-expanded", "true");

  const body = document.getElementById(`dayBody-${dayNum}`);
  if (body) body.style.display = "grid";
}

/**
 * Collapses a day card
 * @param {number} dayNum
 */
export function closeDayCard(dayNum) {
  setDayOpen(dayNum, false);
  const card = document.getElementById(`dayCard-${dayNum}`);
  if (!card) return;

  card.classList.remove("open");
  const head = card.querySelector(".day-card-head");
  if (head) head.setAttribute("aria-expanded", "false");

  const body = document.getElementById(`dayBody-${dayNum}`);
  if (body) body.style.display = "none";
}

/**
 * Expands the parent week, opens the day card, and scrolls to it smoothly
 * @param {number} dayNum
 */
export function openAndScrollToDay(dayNum) {
  if (dayNum < 1 || dayNum > TOTAL_PLAN_DAYS) return;
  const w = weekNumber(dayNum);
  openWeek(w);
  openDayCard(dayNum);
  setTimeout(() => {
    const el = document.getElementById(`dayCard-${dayNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 100);
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
