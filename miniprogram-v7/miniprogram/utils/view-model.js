'use strict';

const { addDays, toDateKey } = require('./date.js');

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getLatestBodyRecord(records) {
  return [...(records || [])].sort((left, right) => right.date.localeCompare(left.date))[0] || {};
}

function getLongestStreak(checkins) {
  const dates = [...new Set(checkins || [])].sort();
  let longest = 0;
  let current = 0;
  let previous = '';

  dates.forEach((date) => {
    current = previous && addDays(previous, 1) === date ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  });

  return longest;
}

function buildCalendar(year, monthIndex, checkins, todayKey) {
  const firstDay = new Date(year, monthIndex, 1);
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const checkedDates = new Set(checkins || []);
  const days = [];

  for (let day = 1; day <= dayCount; day += 1) {
    const date = toDateKey(new Date(year, monthIndex, day));
    days.push({
      day,
      date,
      checked: checkedDates.has(date),
      today: date === todayKey,
      future: date > todayKey,
    });
  }

  return {
    leadingBlanks: (firstDay.getDay() + 6) % 7,
    days,
  };
}

function average(records, field) {
  const values = records
    .map((record) => Number(record[field]))
    .filter((value) => Number.isFinite(value));
  return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length, 1) : 0;
}

function buildWeeklyReport(state, todayKey) {
  const startKey = addDays(todayKey, -6);
  const inRange = (record) => record.date >= startKey && record.date <= todayKey;
  const training = (state.trainingHistory || []).filter(inRange);
  const body = (state.bodyRecords || []).filter(inRange).sort((left, right) => left.date.localeCompare(right.date));
  const latest = getLatestBodyRecord(state.bodyRecords);
  const firstWeight = body.find((record) => Number.isFinite(Number(record.weight)));

  return {
    trainingCount: training.length,
    trainingMinutes: training.reduce((sum, record) => sum + Number(record.durationMinutes || 0), 0),
    latestWeight: Number(latest.weight || 0),
    weightChange: firstWeight && Number.isFinite(Number(latest.weight))
      ? round(Number(latest.weight) - Number(firstWeight.weight), 1)
      : 0,
    averageSleep: average(body, 'sleepHours'),
    averageProtein: average(body, 'proteinGrams'),
  };
}

module.exports = {
  buildCalendar,
  buildWeeklyReport,
  getLatestBodyRecord,
  getLongestStreak,
};
