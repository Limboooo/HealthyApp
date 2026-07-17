'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateKey(value) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new Error('日期格式应为 YYYY-MM-DD');
  }
  const [year, month, day] = String(value).split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  if (result.getUTCFullYear() !== year || result.getUTCMonth() !== month - 1 || result.getUTCDate() !== day) {
    throw new Error('日期无效');
  }
  return result;
}

function toDateKey(value = new Date()) {
  const date = parseDateKey(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, days) {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getTime() + days * DAY_MS));
}

function diffDays(first, second) {
  return Math.floor((parseDateKey(first).getTime() - parseDateKey(second).getTime()) / DAY_MS);
}

function getPlanForDate(dateKey, startDateKey) {
  const date = parseDateKey(dateKey);
  const dayIndex = { 1: 0, 3: 1, 5: 2 }[date.getUTCDay()];
  if (dayIndex === undefined) {
    return { type: 'RECOVERY', label: '恢复日', activity: '快走 30–45 分钟' };
  }
  const weekIndex = Math.max(0, Math.floor(diffDays(dateKey, startDateKey) / 7));
  const evenWeek = ['A', 'B', 'A'];
  const oddWeek = ['B', 'A', 'B'];
  const type = (weekIndex % 2 === 0 ? evenWeek : oddWeek)[dayIndex];
  return { type, label: `训练 ${type}`, activity: '全身哑铃训练' };
}

function calculateStreak(checkins, todayKey = toDateKey()) {
  const dates = new Set((Array.isArray(checkins) ? checkins : []).filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item)));
  let cursor = dates.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

module.exports = { addDays, calculateStreak, getPlanForDate, parseDateKey, toDateKey };
