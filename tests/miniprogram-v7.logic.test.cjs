const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateStreak,
  getPlanForDate,
} = require('../miniprogram-v7/miniprogram/utils/date.js');
const {
  calculateHealthScore,
  getCoachAdvice,
  suggestNextWeight,
} = require('../miniprogram-v7/miniprogram/utils/health.js');
const {
  sanitizeBodyRecord,
  validateBackup,
} = require('../miniprogram-v7/miniprogram/utils/validation.js');
const { createDefaultState } = require('../miniprogram-v7/miniprogram/data/defaults.js');
const { createStorageService } = require('../miniprogram-v7/miniprogram/services/storage.js');
const {
  buildCalendar,
  buildWeeklyReport,
  getLatestBodyRecord,
  getLongestStreak,
} = require('../miniprogram-v7/miniprogram/utils/view-model.js');
const { calculateFoodTotals, resizeFood } = require('../miniprogram-v7/miniprogram/utils/food.js');

test('A/B plan alternates across Monday, Wednesday, and Friday', () => {
  const startDate = '2026-07-13';

  assert.equal(getPlanForDate('2026-07-13', startDate).type, 'A');
  assert.equal(getPlanForDate('2026-07-15', startDate).type, 'B');
  assert.equal(getPlanForDate('2026-07-17', startDate).type, 'A');
  assert.equal(getPlanForDate('2026-07-20', startDate).type, 'B');
  assert.equal(getPlanForDate('2026-07-21', startDate).type, 'RECOVERY');
});

test('streak remains visible today when yesterday and earlier days were checked in', () => {
  const checkins = ['2026-07-13', '2026-07-14', '2026-07-15'];

  assert.equal(calculateStreak(checkins, '2026-07-16'), 3);
  assert.equal(calculateStreak([...checkins, '2026-07-16'], '2026-07-16'), 4);
  assert.equal(calculateStreak(['2026-07-13'], '2026-07-16'), 0);
});

test('health score rewards sleep, nutrition, hydration, and completed activity', () => {
  const perfect = calculateHealthScore({
    sleepHours: 8,
    proteinGrams: 130,
    proteinTarget: 120,
    waterMl: 2500,
    waterTarget: 2200,
    activityComplete: true,
  });
  const tired = calculateHealthScore({
    sleepHours: 4.5,
    proteinGrams: 50,
    proteinTarget: 120,
    waterMl: 800,
    waterTarget: 2200,
    activityComplete: false,
  });

  assert.equal(perfect, 100);
  assert.ok(tired >= 0 && tired < 55);
});

test('coach advice prioritizes recovery when sleep is low', () => {
  const advice = getCoachAdvice({
    sleepHours: 5.2,
    proteinGrams: 100,
    proteinTarget: 120,
    waterMl: 1600,
    waterTarget: 2200,
    planType: 'A',
  });

  assert.equal(advice[0].kind, 'recovery');
  assert.match(advice[0].detail, /降低|缩短/);
  assert.ok(advice.every((item) => item.medical === false));
});

test('next weight only increases after all sets are completed with manageable RPE', () => {
  assert.deepEqual(suggestNextWeight({ currentWeight: 4, targetSets: 3, sets: [
    { reps: 10, rpe: 7 },
    { reps: 10, rpe: 7 },
    { reps: 10, rpe: 8 },
  ] }), { action: 'increase', weight: 5 });

  assert.deepEqual(suggestNextWeight({ currentWeight: 4, targetSets: 3, sets: [
    { reps: 10, rpe: 9.5 },
    { reps: 8, rpe: 10 },
    { reps: 7, rpe: 10 },
  ] }), { action: 'decrease', weight: 3 });

  assert.deepEqual(suggestNextWeight({ currentWeight: 4, targetSets: 3, sets: [
    { reps: 10, rpe: 7 },
    { reps: 9, rpe: 8 },
  ] }), { action: 'keep', weight: 4 });
});

test('body records accept safe numeric ranges and reject implausible values', () => {
  assert.deepEqual(sanitizeBodyRecord({
    height: '170',
    weight: '79.4',
    bodyFat: '24.8',
    waist: '89.5',
    sleepHours: '7.5',
    proteinGrams: '125',
    waterMl: '2300',
  }), {
    height: 170,
    weight: 79.4,
    bodyFat: 24.8,
    waist: 89.5,
    sleepHours: 7.5,
    proteinGrams: 125,
    waterMl: 2300,
  });

  assert.throws(() => sanitizeBodyRecord({ weight: '900' }), /体重/);
  assert.throws(() => sanitizeBodyRecord({ bodyFat: '-1' }), /体脂率/);
});

test('backup validation allowlists known collections and rejects malformed payloads', () => {
  const result = validateBackup(JSON.stringify({
    version: 1,
    profile: { nickname: '训练伙伴', height: 170 },
    checkins: ['2026-07-16'],
    bodyRecords: [{ date: '2026-07-16', weight: 79.4 }],
    trainingHistory: [{
      date: '2026-07-16', type: 'A', durationMinutes: 45, injected: 'bad',
      exercises: [{ id: 'row', name: '划船', sets: [{ weight: 7, reps: 10, rpe: 8, injected: true }] }],
    }],
    foodRecords: [{
      date: '2026-07-16', mealType: '午餐', calories: 720, injected: 'bad',
      foods: [{ name: '米饭', grams: 180, calories: 209, script: '<script>' }],
    }],
    injected: '<script>bad()</script>',
  }));

  assert.equal(result.version, 1);
  assert.equal(result.injected, undefined);
  assert.equal(result.trainingHistory[0].injected, undefined);
  assert.equal(result.trainingHistory[0].exercises[0].sets[0].injected, undefined);
  assert.equal(result.foodRecords[0].injected, undefined);
  assert.equal(result.foodRecords[0].foods[0].script, undefined);
  assert.throws(() => validateBackup('{broken'), /备份格式/);
});

test('default state is cloned so page mutations cannot corrupt future defaults', () => {
  const first = createDefaultState('2026-07-13');
  const second = createDefaultState('2026-07-13');

  first.profile.nickname = 'Changed';
  first.checkins.push('2026-07-13');
  assert.equal(second.profile.nickname, '训练伙伴');
  assert.deepEqual(second.checkins, []);
});

test('storage service initializes, updates, exports, and restores allowlisted data', () => {
  const memory = new Map();
  const fakeWx = {
    getStorageSync(key) { return memory.get(key); },
    setStorageSync(key, value) { memory.set(key, value); },
  };
  const storage = createStorageService(fakeWx, () => '2026-07-13');

  assert.equal(storage.getState().profile.nickname, '训练伙伴');
  storage.updateState((state) => ({
    ...state,
    checkins: ['2026-07-13'],
    exerciseProgress: { row: { exerciseId: 'row', exerciseName: '划船', action: 'increase', weight: 8 } },
  }));
  const backup = storage.exportBackup();
  storage.updateState((state) => ({ ...state, checkins: [], exerciseProgress: {} }));
  storage.restoreBackup(backup);

  assert.deepEqual(storage.getState().checkins, ['2026-07-13']);
  assert.equal(storage.getState().exerciseProgress.row.weight, 8);
  assert.equal(JSON.parse(backup).runtimeCache, undefined);
});

test('view helpers select the latest body record and calculate the longest streak', () => {
  const records = [
    { date: '2026-07-13', weight: 80 },
    { date: '2026-07-16', weight: 79.4 },
    { date: '2026-07-15', weight: 79.7 },
  ];

  assert.equal(getLatestBodyRecord(records).weight, 79.4);
  assert.equal(getLongestStreak([
    '2026-07-01', '2026-07-02', '2026-07-04', '2026-07-05', '2026-07-06',
  ]), 3);
});

test('calendar view starts on Monday and marks check-in states', () => {
  const calendar = buildCalendar(2026, 6, ['2026-07-01', '2026-07-16'], '2026-07-16');

  assert.equal(calendar.leadingBlanks, 2);
  assert.equal(calendar.days.length, 31);
  assert.deepEqual(calendar.days[0], {
    day: 1,
    date: '2026-07-01',
    checked: true,
    today: false,
    future: false,
  });
  assert.equal(calendar.days[15].today, true);
});

test('weekly report summarizes the latest seven calendar days', () => {
  const state = createDefaultState('2026-07-13');
  state.trainingHistory = [
    { date: '2026-07-10', durationMinutes: 40 },
    { date: '2026-07-14', durationMinutes: 35 },
    { date: '2026-07-16', durationMinutes: 45 },
  ];
  state.bodyRecords.push({ date: '2026-07-16', weight: 79.4, sleepHours: 8, proteinGrams: 130 });

  assert.deepEqual(buildWeeklyReport(state, '2026-07-16'), {
    trainingCount: 3,
    trainingMinutes: 120,
    latestWeight: 79.4,
    weightChange: -0.6,
    averageSleep: 7.8,
    averageProtein: 65,
  });
});

test('food portions recalculate bounded nutrition totals', () => {
  const rice = resizeFood({
    name: '米饭',
    grams: 100,
    per100: { calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3 },
  }, 180);
  const chicken = resizeFood({
    name: '鸡胸肉',
    grams: 100,
    per100: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  }, 120);

  assert.equal(rice.grams, 180);
  assert.equal(resizeFood(rice, 5000).grams, 1000);
  assert.deepEqual(calculateFoodTotals([rice, chicken]), {
    calories: 407,
    protein: 41.9,
    carbs: 46.6,
    fat: 4.9,
  });
});
