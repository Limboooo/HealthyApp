'use strict';

const BODY_FIELDS = {
  height: { label: '身高', min: 100, max: 230 },
  weight: { label: '体重', min: 30, max: 300 },
  bodyFat: { label: '体脂率', min: 0, max: 70 },
  waist: { label: '腰围', min: 40, max: 250 },
  sleepHours: { label: '睡眠时长', min: 0, max: 24 },
  proteinGrams: { label: '蛋白质', min: 0, max: 400 },
  waterMl: { label: '饮水量', min: 0, max: 10000 },
};

function sanitizeBodyRecord(input = {}) {
  const output = {};
  Object.keys(BODY_FIELDS).forEach((key) => {
    if (input[key] === undefined || input[key] === '') return;
    const rule = BODY_FIELDS[key];
    const value = Number(input[key]);
    if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
      throw new Error(`${rule.label}数据不合理`);
    }
    output[key] = Math.round(value * 10) / 10;
  });
  return output;
}

function safeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function safeDate(value) {
  const text = safeText(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? '' : text;
}

function boundedNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(min, Math.round(number * 10) / 10));
}

function sanitizeTrainingRecord(item) {
  const date = safeDate(item.date);
  if (!date) return null;
  return {
    date,
    type: ['A', 'B'].includes(item.type) ? item.type : 'A',
    durationMinutes: boundedNumber(item.durationMinutes, 0, 600),
    exercises: (Array.isArray(item.exercises) ? item.exercises : []).slice(0, 20).map((exercise) => ({
      id: safeText(exercise.id, 40),
      name: safeText(exercise.name, 40),
      targetReps: boundedNumber(exercise.targetReps, 0, 180),
      sets: (Array.isArray(exercise.sets) ? exercise.sets : []).slice(0, 10).map((set) => ({
        weight: boundedNumber(set.weight, 0, 100),
        reps: boundedNumber(set.reps, 0, 300),
        rpe: boundedNumber(set.rpe, 0, 10),
      })),
    })),
  };
}

function sanitizeFoodRecord(item) {
  const date = safeDate(item.date);
  if (!date) return null;
  return {
    date,
    mealType: ['早餐', '午餐', '晚餐', '加餐'].includes(item.mealType) ? item.mealType : '加餐',
    calories: boundedNumber(item.calories, 0, 10000),
    protein: boundedNumber(item.protein, 0, 1000),
    carbs: boundedNumber(item.carbs, 0, 2000),
    fat: boundedNumber(item.fat, 0, 1000),
    estimated: item.estimated === true,
    foods: (Array.isArray(item.foods) ? item.foods : []).slice(0, 30).map((food) => ({
      name: safeText(food.name, 40),
      grams: boundedNumber(food.grams, 0, 5000),
      cookingMethod: safeText(food.cookingMethod, 20),
      calories: boundedNumber(food.calories, 0, 5000),
      protein: boundedNumber(food.protein, 0, 500),
      carbs: boundedNumber(food.carbs, 0, 1000),
      fat: boundedNumber(food.fat, 0, 500),
      confidence: boundedNumber(food.confidence, 0, 100),
    })),
  };
}

function validateBackup(raw) {
  if (typeof raw !== 'string' || raw.length > 1024 * 1024) throw new Error('备份格式无效或文件过大');
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('备份格式无法解析'); }
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.version !== 1) throw new Error('备份格式或版本不受支持');
  const result = { version: 1 };
  if (data.profile && typeof data.profile === 'object') {
    result.profile = {
      nickname: safeText(data.profile.nickname, 20),
      height: Math.min(230, Math.max(100, Number(data.profile.height) || 178)),
      planStartDate: safeDate(data.profile.planStartDate) || undefined,
    };
  }
  if (data.targets && typeof data.targets === 'object') {
    result.targets = {
      proteinGrams: boundedNumber(data.targets.proteinGrams, 20, 400) || 120,
      waterMl: boundedNumber(data.targets.waterMl, 500, 10000) || 2200,
      sleepHours: boundedNumber(data.targets.sleepHours, 4, 12) || 7.5,
    };
  }
  if (Array.isArray(data.checkins)) result.checkins = [...new Set(data.checkins.map(safeDate).filter(Boolean))].slice(-3660);
  if (Array.isArray(data.bodyRecords)) result.bodyRecords = data.bodyRecords.slice(-2000)
    .filter((item) => item && typeof item === 'object' && safeDate(item.date))
    .map((item) => ({ date: safeDate(item.date), ...sanitizeBodyRecord(item) }));
  if (Array.isArray(data.trainingHistory)) result.trainingHistory = data.trainingHistory.slice(-1000)
    .filter((item) => item && typeof item === 'object')
    .map(sanitizeTrainingRecord).filter(Boolean);
  if (Array.isArray(data.foodRecords)) result.foodRecords = data.foodRecords.slice(-2000)
    .filter((item) => item && typeof item === 'object')
    .map(sanitizeFoodRecord).filter(Boolean);
  if (data.exerciseProgress && typeof data.exerciseProgress === 'object' && !Array.isArray(data.exerciseProgress)) {
    result.exerciseProgress = Object.entries(data.exerciseProgress).slice(0, 100).reduce((output, [key, item]) => {
      if (!item || typeof item !== 'object') return output;
      const safeKey = safeText(key, 40);
      if (!safeKey) return output;
      output[safeKey] = {
        exerciseId: safeText(item.exerciseId || safeKey, 40),
        exerciseName: safeText(item.exerciseName, 40),
        action: ['increase', 'decrease', 'keep'].includes(item.action) ? item.action : 'keep',
        weight: boundedNumber(item.weight, 0, 10),
      };
      return output;
    }, {});
  }
  if (data.settings && typeof data.settings === 'object') result.settings = { retainMealPhotos: data.settings.retainMealPhotos === true };
  return result;
}

module.exports = { sanitizeBodyRecord, validateBackup };
