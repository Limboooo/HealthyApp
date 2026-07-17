'use strict';

const EXERCISES = {
  A: [
    { id: 'goblet-squat', name: '高脚杯深蹲', weight: 8, targetSets: 3, targetReps: 10, cue: '膝盖跟脚尖，哑铃贴近胸口' },
    { id: 'floor-press', name: '哑铃地板卧推', weight: 5, targetSets: 3, targetReps: 10, cue: '肩胛稳定，手肘不要过度外展' },
    { id: 'one-arm-row', name: '单臂哑铃划船', weight: 7, targetSets: 3, targetReps: 10, cue: '肘部向后下方拉，不要耸肩' },
    { id: 'shoulder-press', name: '哑铃肩推', weight: 4, targetSets: 3, targetReps: 10, cue: '收紧腹部，不要向后仰' },
    { id: 'plank', name: '平板支撑', weight: 0, targetSets: 3, targetReps: 30, unit: '秒', cue: '夹紧臀部，保持腰背平直' },
  ],
  B: [
    { id: 'rdl', name: '哑铃罗马尼亚硬拉', weight: 7, targetSets: 3, targetReps: 10, cue: '屁股向后推，背部保持平直' },
    { id: 'reverse-lunge', name: '反向弓步', weight: 4, targetSets: 3, targetReps: 8, cue: '向后迈步，前脚掌保持稳定' },
    { id: 'one-arm-row-b', name: '单臂哑铃划船', weight: 7, targetSets: 3, targetReps: 10, cue: '身体稳定，避免借力甩动' },
    { id: 'biceps-curl', name: '哑铃弯举', weight: 4, targetSets: 3, targetReps: 10, cue: '手肘固定，不要摆动身体' },
    { id: 'dead-bug', name: '死虫', weight: 0, targetSets: 3, targetReps: 10, cue: '下背贴地，动作缓慢' },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDefaultState(planStartDate) {
  return {
    version: 1,
    profile: { nickname: '训练伙伴', height: 170, planStartDate },
    targets: { proteinGrams: 120, waterMl: 2200, sleepHours: 7.5 },
    checkins: [],
    bodyRecords: [{ date: planStartDate, height: 170, weight: 80, bodyFat: 25, waist: 90, sleepHours: 7.5, proteinGrams: 0, waterMl: 0 }],
    trainingHistory: [],
    foodRecords: [],
    exerciseProgress: {},
    settings: { retainMealPhotos: false, aiEnabled: false },
  };
}

function getExercises(type) {
  return clone(EXERCISES[type] || EXERCISES.A);
}

module.exports = { createDefaultState, getExercises };
