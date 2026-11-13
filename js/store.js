/**
 * ====================================================================
 * STORE.JS — Application State Management, LocalStorage & Item Registry
 * Storage Key: afcat-cv-plan-v1
 * ====================================================================
 */

import { weekNumber, CV_TOTAL_DAYS, TOTAL_PLAN_DAYS } from "./dates.js";

export const STORAGE_KEY = "afcat-cv-plan-v1";

// In-memory fallback if localStorage is blocked by browser security
let isStorageBlocked = false;
let inMemoryStore = null;

// Master list of all registered countable items
// Items: { id: string, day: number, week: number, track: "afcat" | "cv" | "habit" | "mock" | "check", title?: string }
let countableItemsRegistry = [];

// Complete list of all items including non-countable items (stretch, rest days, extra practice)
let fullItemsRegistry = [];

// Cached data references for dynamic re-registration
let cachedPlanData = null;
let cachedCvDaysData = null;

// Problem item types in cv-days.json
const CV_PROBLEM_TYPES = new Set(["leetcode", "pyq", "official", "other"]);

// Reactive event subscribers
const listeners = new Set();

/**
 * Default clean application state
 */
const DEFAULT_STATE = {
  version: 1,
  startDate: "2026-11-16",
  round1Date: null,
  theme: null,
  trackFilter: "both", // "both" | "afcat" | "cv"
  openWeeks: {},       // { [weekNumber]: boolean }
  openDays: {},        // { [dayNumber]: boolean }
  done: {},            // { [itemId]: boolean }
  mocks: {},           // { [mockId]: { score: number, date: string, completed: boolean } }
  settings: {
    coreProblemsPerDay: 2 // 1 | 2 | 3 | 4 | "all"
  }
};

/**
 * Checks if localStorage is functional
 * @returns {boolean}
 */
function testStorage() {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Safely retrieves state from localStorage or in-memory fallback
 * @returns {typeof DEFAULT_STATE}
 */
export function getState() {
  if (isStorageBlocked) {
    const s = inMemoryStore || { ...DEFAULT_STATE };
    if (!s.settings) s.settings = { coreProblemsPerDay: 2 };
    return s;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, settings: { coreProblemsPerDay: 2 } };
    const parsed = JSON.parse(raw);
    const settings = {
      coreProblemsPerDay: 2,
      ...((parsed && parsed.settings && typeof parsed.settings === "object") ? parsed.settings : {})
    };
    return { ...DEFAULT_STATE, ...parsed, settings };
  } catch (err) {
    console.warn("[store] localStorage access error, falling back to memory:", err);
    isStorageBlocked = true;
    showStorageBlockedNotice();
    inMemoryStore = inMemoryStore || { ...DEFAULT_STATE, settings: { coreProblemsPerDay: 2 } };
    return inMemoryStore;
  }
}

/**
 * Safely saves state to localStorage or in-memory fallback
 * @param {typeof DEFAULT_STATE} nextState
 * @returns {boolean}
 */
export function saveState(nextState) {
  if (isStorageBlocked) {
    inMemoryStore = nextState;
    notifySubscribers(nextState);
    return true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    notifySubscribers(nextState);
    return true;
  } catch (err) {
    console.error("[store] Failed to save to localStorage, switching to memory:", err);
    isStorageBlocked = true;
    showStorageBlockedNotice();
    inMemoryStore = nextState;
    notifySubscribers(nextState);
    return false;
  }
}

/**
 * Updates partial state properties and persists
 * @param {Partial<typeof DEFAULT_STATE>} partial
 * @returns {typeof DEFAULT_STATE}
 */
export function updateState(partial) {
  const current = getState();
  const next = { ...current, ...partial };
  saveState(next);
  return next;
}

/**
 * Subscribes a callback to state changes
 * @param {(state: typeof DEFAULT_STATE) => void} fn
 * @returns {() => void} unsubscribe function
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifySubscribers(state) {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.error("[store] Subscriber error:", e);
    }
  });
}

function showStorageBlockedNotice() {
  if (typeof document !== "undefined") {
    const noticeEl = document.getElementById("storageNotice");
    if (noticeEl) {
      noticeEl.hidden = false;
      noticeEl.textContent = "Notice: Local storage is disabled or blocked. Progress will not be saved after closing this browser.";
    }
  }
}

/**
 * Helper to build standard deterministic item IDs
 * Format: `${day}|${kind}|${key}`
 * day = 0 for Day 0 setup / global items, 1..77 for plan days
 * kinds: afcat, cv, habit, mock, check, stretch
 * @param {number} day - Plan day number (0..77)
 * @param {"afcat" | "cv" | "habit" | "mock" | "check" | "stretch"} kind
 * @param {string} key - Stable identifier (e.g. "blockA", "d1-v1", "0")
 * @returns {string}
 */
export function makeItemId(day, kind, key) {
  return `${day}|${kind}|${key}`;
}

/**
 * Checks whether an item is marked done
 * @param {string} id
 * @returns {boolean}
 */
export function isDone(id) {
  const state = getState();
  return Boolean(state.done && state.done[id]);
}

/**
 * Marks an item as done or undone
 * @param {string} id
 * @param {boolean} done
 */
export function setDone(id, done) {
  const state = getState();
  const nextDone = { ...(state.done || {}) };
  if (done) {
    nextDone[id] = true;
  } else {
    delete nextDone[id];
  }
  updateState({ done: nextDone });
}

/**
 * Records open/closed state of a day card
 * @param {number} dayNum
 * @param {boolean} isOpen
 */
export function setDayOpen(dayNum, isOpen) {
  const state = getState();
  const nextOpenDays = { ...(state.openDays || {}) };
  nextOpenDays[dayNum] = isOpen;
  updateState({ openDays: nextOpenDays });
}

/**
 * Checks whether a day card is open
 * @param {number} dayNum
 * @param {boolean} [defaultOpen=false]
 * @returns {boolean}
 */
export function isDayOpen(dayNum, defaultOpen = false) {
  const state = getState();
  if (state.openDays && state.openDays[dayNum] !== undefined) {
    return state.openDays[dayNum];
  }
  return defaultOpen;
}

/**
 * Updates active track filter ("both" | "afcat" | "cv")
 * @param {"both" | "afcat" | "cv"} filter
 */
export function setTrackFilter(filter) {
  updateState({ trackFilter: filter });
}

/**
 * Returns current track filter
 * @returns {"both" | "afcat" | "cv"}
 */
export function getTrackFilter() {
  const state = getState();
  return state.trackFilter || "both";
}

/**
 * Returns current core problems per day setting: 1, 2, 3, 4, or "all"
 * @returns {number | "all"}
 */
export function getCoreProblemsPerDay() {
  const state = getState();
  const val = state.settings && state.settings.coreProblemsPerDay;
  if (val === "all" || val === "All") return "all";
  const num = Number(val);
  return isNaN(num) || num <= 0 ? 2 : num;
}

/**
 * Updates core problems per day setting, reclassifies items, and notifies subscribers
 * @param {number | string} value
 */
export function setCoreProblemsPerDay(value) {
  const state = getState();
  const normalized = (String(value).toLowerCase() === "all") ? "all" : Math.max(1, Math.min(4, Number(value) || 2));
  const nextSettings = {
    ...(state.settings || {}),
    coreProblemsPerDay: normalized
  };
  const nextState = { ...state, settings: nextSettings };
  if (isStorageBlocked) {
    inMemoryStore = nextState;
  } else {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (e) {
      inMemoryStore = nextState;
    }
  }
  if (cachedPlanData && cachedCvDaysData) {
    buildCountableRegistry(cachedPlanData, cachedCvDaysData);
  }
  notifySubscribers(nextState);
}

/**
 * Returns done/total counts for extra practice items
 * @param {number} [day] - Optional day number to filter by
 * @returns {{ done: number, total: number }}
 */
export function extraCounts(day) {
  const state = getState();
  const doneMap = state.done || {};
  let extraItems = fullItemsRegistry.filter((it) => it.isExtra);
  if (day !== undefined) {
    extraItems = extraItems.filter((it) => it.day === day);
  }
  const total = extraItems.length;
  let done = 0;
  for (let i = 0; i < total; i++) {
    if (doneMap[extraItems[i].id]) {
      done++;
    }
  }
  return { done, total };
}

/**
 * Compiles master registry of all items on boot.
 * - Day 0 setup items (0|check|<n>) count in OVERALL progress only (week = 0).
 * - CodeVita items use stable id (e.g. d1-v1, d1-p1) or generate from position, NEVER from title.
 * - Stretch items and rest days (CodeVita Sunday) are strictly excluded from countable progress.
 * @param {object} planData - from /data/plan-data.json
 * @param {object} cvDaysData - from /data/cv-days.json
 */
export function buildCountableRegistry(planData, cvDaysData) {
  if (planData) cachedPlanData = planData;
  if (cvDaysData) cachedCvDaysData = cvDaysData;
  const pData = planData || cachedPlanData;
  const cvData = cvDaysData || cachedCvDaysData;
  const N = getCoreProblemsPerDay();

  countableItemsRegistry = [];
  fullItemsRegistry = [];
  const registeredSet = new Set();

  function registerItem(item, isCountable) {
    fullItemsRegistry.push(item);
    if (isCountable && !registeredSet.has(item.id)) {
      registeredSet.add(item.id);
      countableItemsRegistry.push(item);
    }
  }

  // 1. Day 0 Setup items (12-15 Nov from plan-data.json day0)
  // ID format: 0|check|<n>. Count in OVERALL progress only (week: 0).
  let day0Idx = 0;
  if (pData && Array.isArray(pData.day0)) {
    pData.day0.forEach((d0Group) => {
      if (Array.isArray(d0Group.tasks)) {
        d0Group.tasks.forEach((taskDesc) => {
          const id = makeItemId(0, "check", String(day0Idx));
          registerItem({
            id,
            day: 0,
            week: 0, // Not counted in any week 1..11
            track: "check",
            title: taskDesc,
            dateLabel: d0Group.label,
            isCore: true,
            isExtra: false
          }, true);
          day0Idx++;
        });
      }
    });
  }

  // Check cv-days.json for items sitting on CodeVita Sunday (rest days)
  const sundayItemsFound = [];

  // Map of user-entered CodeVita items by day
  const cvItemsByDay = new Map();
  if (cvData && Array.isArray(cvData.days)) {
    cvData.days.forEach((d) => {
      cvItemsByDay.set(d.day, d.items || []);
      const offsetInWeek = (d.day - 1) % 7;
      if (offsetInWeek === 6 && d.items && d.items.length > 0) {
        sundayItemsFound.push({ day: d.day, count: d.items.length, items: d.items });
      }
    });
  }

  if (sundayItemsFound.length > 0) {
    console.warn("[store] Note: Items found on CodeVita Sunday rest days:", sundayItemsFound);
  }

  // 2. Process 11 Weeks of Plan Data
  if (pData && Array.isArray(pData.weeks)) {
    pData.weeks.forEach((w) => {
      const weekNum = w.week;
      const weekStartDay = (weekNum - 1) * 7 + 1;

      // Days 1..5: Weekdays (Mon-Fri)
      for (let i = 0; i < 5; i++) {
        const day = weekStartDay + i;
        const dayTopics = w.afcat_weekdays && w.afcat_weekdays[i];

        // A. AFCAT Track Items
        if (dayTopics) {
          if (dayTopics.blockA && dayTopics.blockA !== "-") {
            registerItem({ id: makeItemId(day, "afcat", "blockA"), day, week: weekNum, track: "afcat", title: dayTopics.blockA, isCore: true, isExtra: false }, true);
          }
          if (dayTopics.english && dayTopics.english !== "-") {
            registerItem({ id: makeItemId(day, "afcat", "english"), day, week: weekNum, track: "afcat", title: dayTopics.english, isCore: true, isExtra: false }, true);
          }
          if (dayTopics.ga && dayTopics.ga !== "-") {
            registerItem({ id: makeItemId(day, "afcat", "ga"), day, week: weekNum, track: "afcat", title: dayTopics.ga, isCore: true, isExtra: false }, true);
          }
        }

        // B. CodeVita Track Items (Video & Problems)
        if (day <= CV_TOTAL_DAYS) {
          const userCvItems = cvItemsByDay.get(day);
          if (userCvItems && userCvItems.length > 0) {
            let problemIdx = 0;
            userCvItems.forEach((item, itemIdx) => {
              const stableKey = item.id || `d${day}-i${itemIdx + 1}`;
              const isStretch = item.type === "stretch" || item.s === true;
              if (isStretch) {
                registerItem({
                  id: makeItemId(day, "stretch", stableKey),
                  day,
                  week: weekNum,
                  track: "cv",
                  title: item.title,
                  url: item.url,
                  type: item.type,
                  isStretch: true,
                  isCore: false,
                  isExtra: false
                }, false);
              } else if (item.type === "video" || item.type === "mock") {
                // Videos (not optional) & mocks (Day 54) are always CORE
                registerItem({
                  id: makeItemId(day, "cv", stableKey),
                  day,
                  week: weekNum,
                  track: "cv",
                  title: item.title,
                  url: item.url,
                  type: item.type,
                  isStretch: false,
                  isCore: true,
                  isExtra: false
                }, true);
              } else if (CV_PROBLEM_TYPES.has(item.type)) {
                // Problem items (leetcode, pyq, official, other)
                problemIdx++;
                const isCore = (N === "all" || problemIdx <= N);
                registerItem({
                  id: makeItemId(day, "cv", stableKey),
                  day,
                  week: weekNum,
                  track: "cv",
                  title: item.title,
                  url: item.url,
                  type: item.type,
                  isStretch: false,
                  isCore,
                  isExtra: !isCore
                }, isCore);
              } else {
                // Fallback for any other non-stretch item: treat as core
                registerItem({
                  id: makeItemId(day, "cv", stableKey),
                  day,
                  week: weekNum,
                  track: "cv",
                  title: item.title,
                  url: item.url,
                  type: item.type,
                  isStretch: false,
                  isCore: true,
                  isExtra: false
                }, true);
              }
            });
          } else {
            // Default CodeVita Video & Problems slots when cv-days.json item array is empty
            registerItem({ id: makeItemId(day, "cv", `d${day}-v1`), day, week: weekNum, track: "cv", title: `Site Day ${day}: video`, isCore: true, isExtra: false }, true);
            registerItem({ id: makeItemId(day, "cv", `d${day}-p1`), day, week: weekNum, track: "cv", title: `Site Day ${day}: problems`, isCore: true, isExtra: false }, true);
          }
        } else {
          // Days 57-77 (Weeks 9-11): Maintenance problem
          registerItem({ id: makeItemId(day, "cv", `d${day}-maint`), day, week: weekNum, track: "cv", title: "Maintenance: 1 coding problem", isCore: true, isExtra: false }, true);
        }

        // C. Daily Habits (Mon-Fri)
        registerItem({ id: makeItemId(day, "habit", "exercise"), day, week: weekNum, track: "habit", title: "Morning exercise (06:15)", isCore: true, isExtra: false }, true);
        registerItem({ id: makeItemId(day, "habit", "revision"), day, week: weekNum, track: "habit", title: "Revision recall (17:30)", isCore: true, isExtra: false }, true);
        registerItem({ id: makeItemId(day, "habit", "job"), day, week: weekNum, track: "habit", title: "Job applications block (18:15)", isCore: true, isExtra: false }, true);
        registerItem({ id: makeItemId(day, "habit", "night_drill"), day, week: weekNum, track: "habit", title: "Night recall: vocab + reasoning (20:00)", isCore: true, isExtra: false }, true);
      }

      // Saturday (Day 6 of week)
      const satDay = weekStartDay + 5;
      if (w.afcat_saturday && w.afcat_saturday !== "-") {
        registerItem({ id: makeItemId(satDay, "afcat", "sat"), day: satDay, week: weekNum, track: "afcat", title: w.afcat_saturday, isCore: true, isExtra: false }, true);
      }
      if (satDay <= CV_TOTAL_DAYS) {
        const isFinalRevisionDay = satDay === 55;
        const userSatItems = cvItemsByDay.get(satDay);
        if (userSatItems && userSatItems.length > 0) {
          userSatItems.forEach((item, itemIdx) => {
            const stableKey = item.id || `d${satDay}-i${itemIdx + 1}`;
            // Day 55 CodeVita items are strictly non-countable (like rest)
            const isStretch = isFinalRevisionDay || item.type === "stretch" || item.s === true;
            registerItem({
              id: makeItemId(satDay, isStretch ? "stretch" : "cv", stableKey),
              day: satDay,
              week: weekNum,
              track: "cv",
              title: item.title,
              url: item.url,
              type: item.type,
              isStretch,
              isCore: !isStretch,
              isExtra: false
            }, !isStretch);
          });
        } else if (isFinalRevisionDay) {
          // Day 55 Final Revision fallback is non-countable (like rest)
          registerItem({
            id: makeItemId(satDay, "cv", `d${satDay}-revision`),
            day: satDay,
            week: weekNum,
            track: "cv",
            title: "CodeVita Final Revision",
            isRest: true,
            isStretch: true,
            isCore: false,
            isExtra: false
          }, false);
        } else {
          registerItem({
            id: makeItemId(satDay, "cv", `d${satDay}-practice`),
            day: satDay,
            week: weekNum,
            track: "cv",
            title: weekNum <= 3 ? "Weekend practice (3h)" : "3-hour mock simulation",
            isCore: true,
            isExtra: false
          }, true);
        }
      }

      // Sunday (Day 7 of week)
      const sunDay = weekStartDay + 6;
      if (w.afcat_sunday && w.afcat_sunday !== "-") {
        registerItem({ id: makeItemId(sunDay, "afcat", "sun"), day: sunDay, week: weekNum, track: "afcat", title: w.afcat_sunday, isCore: true, isExtra: false }, true);
      }
      // CodeVita Sunday is REST / Exam Eve (Day 56): recorded in full registry but NOT countable in progress!
      const isExamEve = sunDay === 56;
      const userSunItems = cvItemsByDay.get(sunDay);
      if (userSunItems && userSunItems.length > 0) {
        userSunItems.forEach((item, itemIdx) => {
          const stableKey = item.id || `d${sunDay}-i${itemIdx + 1}`;
          registerItem({
            id: makeItemId(sunDay, "stretch", stableKey),
            day: sunDay,
            week: weekNum,
            track: "cv",
            title: item.title,
            url: item.url,
            type: item.type,
            isRest: true,
            isStretch: true,
            isCore: false,
            isExtra: false
          }, false);
        });
      }
      registerItem({
        id: makeItemId(sunDay, "cv", isExamEve ? `d${sunDay}-exameve` : `d${sunDay}-rest`),
        day: sunDay,
        week: weekNum,
        track: "cv",
        title: isExamEve ? "CodeVita Exam Eve" : "CodeVita Rest Day",
        isRest: true,
        isStretch: true,
        isCore: false,
        isExtra: false
      }, false);
    });
  }

  // 3. Process 12 Full AFCAT Mocks
  const afcatMocksList = (pData && (pData.afcat_mocks || pData.mocks)) || [];
  if (Array.isArray(afcatMocksList)) {
    afcatMocksList.forEach((m) => {
      registerItem({ id: makeItemId(0, "mock", m.id), day: 0, week: 0, track: "mock", title: m.label, isCore: true, isExtra: false }, true);
    });
  }

  console.log(`[store] Initialized with ${countableItemsRegistry.length} countable items (Core Problems / Day: ${N}).`);
}

/**
 * Returns done/total counts and percentage for:
 * - overall (all countable items, including Day 0)
 * - per week ({ week: N }) -> excludes Day 0
 * - per track ({ track: "afcat" | "cv" | "habit" | "mock" })
 * - per day ({ day: D, track?: string })
 * @param {{ scope?: "overall", week?: number, track?: string, day?: number }} [filter={}]
 * @returns {{ done: number, total: number, pct: number }}
 */
export function counts(filter = {}) {
  const state = getState();
  const doneMap = state.done || {};

  let items = countableItemsRegistry;

  if (filter.week !== undefined) {
    items = items.filter((item) => item.week === filter.week);
  }

  if (filter.day !== undefined) {
    items = items.filter((item) => item.day === filter.day);
  }

  if (filter.track) {
    items = items.filter((item) => item.track === filter.track);
  }

  const total = items.length;
  let done = 0;
  for (let i = 0; i < total; i++) {
    if (doneMap[items[i].id]) {
      done++;
    }
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

/**
 * Returns breakdown of items for a specific day
 * @param {number} day
 * @returns {{ afcat: { done: number, total: number }, cv: { done: number, total: number } }}
 */
export function dayCounts(day) {
  const state = getState();
  const doneMap = state.done || {};

  let afcatDone = 0, afcatTotal = 0;
  let cvDone = 0, cvTotal = 0;

  for (let i = 0; i < countableItemsRegistry.length; i++) {
    const item = countableItemsRegistry[i];
    if (item.day === day) {
      if (item.track === "afcat") {
        afcatTotal++;
        if (doneMap[item.id]) afcatDone++;
      } else if (item.track === "cv") {
        cvTotal++;
        if (doneMap[item.id]) cvDone++;
      }
    }
  }

  return {
    afcat: { done: afcatDone, total: afcatTotal },
    cv: { done: cvDone, total: cvTotal }
  };
}

/**
 * Retrieves mock data for a mock ID
 * @param {string} mockId
 * @returns {{ score: number | null, notes: string, errorLog: string }}
 */
export function getMock(mockId) {
  const state = getState();
  const m = (state.mocks && state.mocks[mockId]) || {};
  return {
    score: m.score !== undefined ? m.score : null,
    notes: m.notes || "",
    errorLog: m.errorLog || ""
  };
}

/**
 * Validates and sets mock score (0-300)
 * @param {string} mockId
 * @param {number | string | null} scoreVal
 * @returns {{ success: boolean, score: number | null, error?: string }}
 */
export function setMockScore(mockId, scoreVal) {
  const state = getState();
  const nextMocks = { ...(state.mocks || {}) };
  const currentMock = nextMocks[mockId] ? { ...nextMocks[mockId] } : { score: null, notes: "", errorLog: "" };

  if (scoreVal === "" || scoreVal === null || scoreVal === undefined) {
    currentMock.score = null;
    nextMocks[mockId] = currentMock;
    updateState({ mocks: nextMocks });
    return { success: true, score: null };
  }

  const num = Number(scoreVal);
  if (isNaN(num) || num < 0 || num > 300) {
    return { success: false, score: currentMock.score, error: "Score must be a number between 0 and 300." };
  }

  currentMock.score = Math.round(num);
  nextMocks[mockId] = currentMock;
  updateState({ mocks: nextMocks });
  return { success: true, score: currentMock.score };
}

/**
 * Updates mock strategy notes
 * @param {string} mockId
 * @param {string} notes
 */
export function setMockNotes(mockId, notes) {
  const state = getState();
  const nextMocks = { ...(state.mocks || {}) };
  const currentMock = nextMocks[mockId] ? { ...nextMocks[mockId] } : { score: null, notes: "", errorLog: "" };
  currentMock.notes = String(notes || "");
  nextMocks[mockId] = currentMock;
  updateState({ mocks: nextMocks });
}

/**
 * Updates mock error log
 * @param {string} mockId
 * @param {string} errorLog
 */
export function setMockErrorLog(mockId, errorLog) {
  const state = getState();
  const nextMocks = { ...(state.mocks || {}) };
  const currentMock = nextMocks[mockId] ? { ...nextMocks[mockId] } : { score: null, notes: "", errorLog: "" };
  currentMock.errorLog = String(errorLog || "");
  nextMocks[mockId] = currentMock;
  updateState({ mocks: nextMocks });
}

/**
 * Returns all mock records
 * @returns {Record<string, { score: number | null, notes: string, errorLog: string }>}
 */
export function getAllMocks() {
  const state = getState();
  return state.mocks || {};
}

/**
 * Exports progress as JSON string
 * @returns {string}
 */
export function exportProgress() {
  const state = getState();
  const payload = {
    version: 1,
    app: "afcat-cv-plan",
    exportedAt: new Date().toISOString(),
    startDate: state.startDate,
    round1Date: state.round1Date,
    settings: state.settings || { coreProblemsPerDay: 2 },
    done: state.done,
    mocks: state.mocks
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Imports progress from a JSON string with validation
 * @param {string} jsonString
 * @returns {{ success: boolean, error?: string }}
 */
export function importProgress(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Invalid JSON format." };
    }
    if (!parsed.done || typeof parsed.done !== "object") {
      return { success: false, error: "Missing or invalid 'done' object in backup." };
    }

    const current = getState();
    const settings = {
      coreProblemsPerDay: 2,
      ...((parsed.settings && typeof parsed.settings === "object") ? parsed.settings : {})
    };
    const next = {
      ...current,
      settings,
      done: parsed.done,
      mocks: parsed.mocks || current.mocks,
      startDate: parsed.startDate || current.startDate,
      round1Date: parsed.round1Date !== undefined ? parsed.round1Date : current.round1Date
    };

    saveState(next);
    if (cachedPlanData && cachedCvDaysData) {
      buildCountableRegistry(cachedPlanData, cachedCvDaysData);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Resets a specific subset of checklist items by prefix without affecting other progress
 * @param {string} prefix
 */
export function resetChecklist(prefix) {
  const current = getState();
  const nextDone = { ...(current.done || {}) };
  let modified = false;

  Object.keys(nextDone).forEach((key) => {
    if (key.startsWith(prefix)) {
      delete nextDone[key];
      modified = true;
    }
  });

  if (modified) {
    saveState({ ...current, done: nextDone });
  }
}

/**
 * Resets all task and mock progress after user confirmation
 * Preserves custom start date and Round 1 date
 * @returns {boolean}
 */
export function resetProgress() {
  const confirmed = window.confirm(
    "Are you sure you want to reset all ticked items and mock scores? Your custom start date and Round 1 date will be kept."
  );
  if (!confirmed) return false;

  const current = getState();
  const next = {
    ...current,
    done: {},
    mocks: {}
  };
  saveState(next);
  return true;
}

/**
 * Theme icons (Moon & Sun)
 */
const ICON_MOON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
const ICON_SUN = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

/**
 * Initializes and applies color theme from state or system preference
 * @returns {string} active theme ("dark" | "light")
 */
export function initTheme() {
  const state = getState();
  let theme = state.theme;
  if (!theme || (theme !== "dark" && theme !== "light")) {
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    theme = prefersLight ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeButton(theme);
  return theme;
}

/**
 * Toggles color theme between dark and light, updates DOM and persists to storage
 * @returns {string} new active theme ("dark" | "light")
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  updateThemeButton(next);
  updateState({ theme: next });
  return next;
}

/**
 * Updates the theme toggle button's icon and accessible aria-label
 * @param {string} theme
 */
function updateThemeButton(theme) {
  const btn = document.getElementById("themeBtn");
  if (!btn) return;
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  btn.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  btn.innerHTML = theme === "dark" ? ICON_MOON : ICON_SUN;
}

/**
 * Initializes store on application boot
 */
export function initStore() {
  if (!testStorage()) {
    isStorageBlocked = true;
    showStorageBlockedNotice();
  }
}
