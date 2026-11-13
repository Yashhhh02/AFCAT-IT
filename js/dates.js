/**
 * ====================================================================
 * DATES.JS — Timezone-Safe Date Math, Countdowns & Schedule Logic
 * ====================================================================
 */

// Target Milestone Timestamps (Explicit Timezone IST Dates)
export const AFCAT_EXAM_DATE = new Date("2027-01-31T10:00:00+05:30");
export const AFCAT_FORM_LAST_DATE = new Date("2026-12-11T23:30:00+05:30");
export const CV_REG_DEADLINE = new Date("2026-11-13T23:59:59+05:30");
export const TOTAL_PLAN_DAYS = 77; // 11 weeks * 7 days
export const CV_TOTAL_DAYS = 56;   // 8 weeks * 7 days

/**
 * Parses YYYY-MM-DD string into a local Date object set to midnight (00:00:00).
 * Prevents timezone shifting bugs caused by Date.parse() treating date strings as UTC.
 * @param {string} isoStr - e.g. "2026-11-16"
 * @returns {Date}
 */
export function parseISODate(isoStr) {
  if (!isoStr) return new Date();
  if (isoStr instanceof Date) {
    return new Date(isoStr.getFullYear(), isoStr.getMonth(), isoStr.getDate(), 0, 0, 0, 0);
  }
  const [y, m, d] = String(isoStr).split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Formats a Date object to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Adds N days to a base date at local midnight
 * @param {Date | string} baseDate
 * @param {number} n
 * @returns {Date}
 */
export function addDays(baseDate, n) {
  const d = parseISODate(baseDate);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 0, 0, 0, 0);
}

/**
 * Returns integer difference in calendar days between dateA and dateB (B - A)
 * @param {Date | string} dateA
 * @param {Date | string} dateB
 * @returns {number}
 */
export function daysBetween(dateA, dateB) {
  const a = parseISODate(dateA).getTime();
  const b = parseISODate(dateB).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Returns 1-based plan day number from start date.
 * @param {Date | string} targetDate
 * @param {string} [startISO="2026-11-16"]
 * @returns {number}
 */
export function dayNumber(targetDate, startISO = "2026-11-16") {
  const start = parseISODate(startISO);
  const target = parseISODate(targetDate);
  return daysBetween(start, target) + 1;
}

/**
 * Returns 1-based week number (1..11) for a given plan day (1..77)
 * @param {number} day
 * @returns {number}
 */
export function weekNumber(day) {
  return Math.ceil(day / 7);
}

/**
 * Returns Date object for plan Day N given the start date
 * @param {number} day - 1-based plan day (1..77)
 * @param {string} [startISO="2026-11-16"]
 * @returns {Date}
 */
export function getDateForDay(day, startISO = "2026-11-16") {
  const start = parseISODate(startISO);
  return addDays(start, day - 1);
}

/**
 * Returns current plan day index clamped between 1 and 77.
 * If targetDate is before plan start, returns 1. If after plan end, returns 77.
 * Accepts an optional testDate for deterministic testing.
 * @param {string} [startISO="2026-11-16"]
 * @param {number} [totalDays=77]
 * @param {Date | string} [testDate]
 * @returns {number}
 */
export function jumpToToday(startISO = "2026-11-16", totalDays = TOTAL_PLAN_DAYS, testDate = null) {
  const refDate = testDate ? parseISODate(testDate) : new Date();
  const cur = dayNumber(refDate, startISO);
  if (cur < 1) return 1;
  if (cur > totalDays) return totalDays;
  return cur;
}

/**
 * Day classification inside the week:
 * - Days 1..56: CodeVita site plan
 *   - Mon-Fri (except Day 54): learning days
 *   - Day 54 (Friday): CodeVita Mock 5 (countable)
 *   - Saturdays (Days 6, 13, 20): weekend practice (3 hours)
 *   - Saturdays (Days 27, 34, 41, 48): 3-hour full mock simulations (Mocks 1-4)
 *   - Day 55 (Saturday): "Final revision" (non-countable, like rest)
 *   - Sundays (Days 7, 14, 21, 28, 35, 42, 49): rest days (non-countable)
 *   - Day 56 (Sunday): "Exam eve" (non-countable)
 * - Days 57..77: Maintenance period (1 problem daily)
 * @param {number} day - 1-based plan day (1..77)
 * @returns {{ dayOfWeek: number, isWeekend: boolean, isWeekday: boolean, isSaturday: boolean, isSunday: boolean, cvType: "learn" | "practice" | "mock" | "rest" | "Final revision" | "Exam eve" | "maintenance", cvLabel: string, isCountable: boolean }}
 */
export function getDayScheduleType(day) {
  const week = weekNumber(day);
  const offsetInWeek = (day - 1) % 7; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const isSaturday = offsetInWeek === 5;
  const isSunday = offsetInWeek === 6;
  const isWeekend = isSaturday || isSunday;
  const isWeekday = !isWeekend;

  let cvType = "learn";
  let cvLabel = "Learn";
  let isCountable = true;

  if (day > CV_TOTAL_DAYS) {
    cvType = "maintenance"; // Days 57-77: 1 problem/day maintenance
    cvLabel = "Maintenance";
    isCountable = true;
  } else if (day === 54) {
    // Day 54 (Friday) = CodeVita Mock 5 (countable)
    cvType = "mock";
    cvLabel = "CodeVita Mock 5";
    isCountable = true;
  } else if (day === 55) {
    // Day 55 (Saturday) = "Final revision" (items are non-countable, like rest)
    cvType = "Final revision";
    cvLabel = "Final revision";
    isCountable = false;
  } else if (day === 56) {
    // Day 56 (Sunday) = "Exam eve" (non-countable)
    cvType = "Exam eve";
    cvLabel = "Exam eve";
    isCountable = false;
  } else if (isSunday) {
    cvType = "rest";
    cvLabel = "Rest day";
    isCountable = false;
  } else if (isSaturday) {
    // Days 6, 13, 20 are practice; Days 27, 34, 41, 48 stay 3-hour mock Saturdays
    cvType = week <= 3 ? "practice" : "mock";
    cvLabel = week <= 3 ? "Weekend practice" : "3-hour mock";
    isCountable = true;
  }

  return {
    dayOfWeek: offsetInWeek,
    isWeekend,
    isWeekday,
    isSaturday,
    isSunday,
    cvType,
    cvLabel,
    isCountable
  };
}

/**
 * Formats a Date object to short display (e.g. "Mon, 16 Nov" or "Sun, 31 Jan 2027")
 * @param {Date | string} date
 * @param {boolean} [includeYear=false]
 * @returns {string}
 */
export function formatShortDate(date, includeYear = false) {
  const d = typeof date === "string" ? parseISODate(date) : date;
  const options = { weekday: "short", day: "numeric", month: "short" };
  if (includeYear) options.year = "numeric";
  return d.toLocaleDateString("en-IN", options);
}

/**
 * Calculates remaining time breakdown between now and target date
 * @param {string | Date} targetDate
 * @returns {{ closed: boolean, days: number, hours: number, minutes: number, seconds: number, totalMs: number }}
 */
export function getRemainingTime(targetDate) {
  const target = targetDate instanceof Date ? targetDate.getTime() : new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { closed: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { closed: false, days, hours, minutes, seconds, totalMs: diff };
}

/**
 * Formats countdown object to display string (e.g. "78d 20h 35m")
 * @param {ReturnType<typeof getRemainingTime>} time
 * @param {string} [expiredText="Done"]
 * @returns {string}
 */
export function formatCountdownString(time, expiredText = "Done") {
  if (time.closed) return expiredText;
  return `${time.days}d ${time.hours}h ${time.minutes}m`;
}

/**
 * Evaluates schedule fit when candidate enters a CodeVita Round 1 date.
 * Rules:
 * 1. Warn if CodeVita Day 56 is after Round 1.
 * 2. Warn if Round 1 is within 3 days of 31 Jan 2027 and suggest cutting AFCAT mocks.
 * @param {string} startISO
 * @param {string | null} round1ISO
 * @returns {{ hasFitNote: boolean, isWarning: boolean, warningDay56: string | null, warningClash: string | null, message: string }}
 */
export function calculateFitNote(startISO, round1ISO) {
  if (!round1ISO) {
    return { hasFitNote: false, isWarning: false, warningDay56: null, warningClash: null, message: "" };
  }

  const r1 = parseISODate(round1ISO);
  const cvDay56Date = getDateForDay(CV_TOTAL_DAYS, startISO);
  const afcatExamDate = parseISODate("2027-01-31");

  const gapToDay56 = daysBetween(r1, cvDay56Date);
  const daysDiffAfcat = Math.abs(daysBetween(r1, afcatExamDate));

  let warningDay56 = null;
  if (gapToDay56 > 0) {
    warningDay56 = `CodeVita Day 56 lands on ${formatShortDate(cvDay56Date, true)}, which is ${gapToDay56} day${gapToDay56 === 1 ? "" : "s"} after your Round 1 date (${formatShortDate(r1, true)}). Skip stretch items or advance your start date.`;
  }

  let warningClash = null;
  if (daysDiffAfcat <= 3) {
    warningClash = `CodeVita Round 1 (${formatShortDate(r1, true)}) is within 3 days of the AFCAT exam (31 Jan 2027). Cut AFCAT mocks that week to prevent mental burnout.`;
  }

  const isWarning = Boolean(warningDay56 || warningClash);
  let message = "";
  if (isWarning) {
    message = [warningDay56, warningClash].filter(Boolean).join(" ");
  } else {
    message = `CodeVita Round 1 is on ${formatShortDate(r1, true)}. Your 56-day plan completes on ${formatShortDate(cvDay56Date, true)}, giving you a clean preparation buffer.`;
  }

  return {
    hasFitNote: true,
    isWarning,
    warningDay56,
    warningClash,
    message
  };
}
