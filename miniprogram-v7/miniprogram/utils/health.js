'use strict';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function ratio(value, target) {
  const safeTarget = Math.max(1, Number(target) || 1);
  return clamp((Number(value) || 0) / safeTarget, 0, 1);
}

function calculateHealthScore(input = {}) {
  const sleepScore = ratio(input.sleepHours, 7.5) * 30;
  const proteinScore = ratio(input.proteinGrams, input.proteinTarget || 120) * 25;
  const waterScore = ratio(input.waterMl, input.waterTarget || 2200) * 20;
  const activityScore = input.activityComplete ? 25 : 0;
  return Math.round(clamp(sleepScore + proteinScore + waterScore + activityScore, 0, 100));
}

function getCoachAdvice(input = {}) {
  const advice = [];
  if ((Number(input.sleepHours) || 0) < 6) {
    advice.push({ kind: 'recovery', title: '今天优先恢复', detail: '训练重量降低 10%，或把训练缩短到 30 分钟。', medical: false });
  } else {
    advice.push({ kind: 'training', title: `按计划完成训练 ${input.planType || 'A'}`, detail: '恢复状态良好，保持动作稳定，不需要追求力竭。', medical: false });
  }
  const proteinGap = Math.max(0, (Number(input.proteinTarget) || 120) - (Number(input.proteinGrams) || 0));
  advice.push({ kind: 'nutrition', title: proteinGap ? `蛋白质还差 ${Math.round(proteinGap)}g` : '蛋白质目标已完成', detail: proteinGap ? '下一餐优先补充瘦肉、鸡蛋、牛奶或豆制品。' : '保持均衡饮食和正常进餐节奏。', medical: false });
  const waterGap = Math.max(0, (Number(input.waterTarget) || 2200) - (Number(input.waterMl) || 0));
  advice.push({ kind: 'hydration', title: waterGap ? `饮水还差 ${Math.round(waterGap)}ml` : '饮水目标已完成', detail: waterGap ? '分次补水，不要短时间大量饮用。' : '继续按口渴程度补水。', medical: false });
  return advice;
}

function suggestNextWeight({ currentWeight, targetSets = 3, targetReps = 10, sets = [] } = {}) {
  const weight = clamp(currentWeight, 2, 10);
  const validSets = Array.isArray(sets) ? sets.slice(0, targetSets) : [];
  const averageRpe = validSets.length ? validSets.reduce((sum, set) => sum + clamp(set.rpe, 1, 10), 0) / validSets.length : 0;
  if (validSets.length === targetSets && averageRpe >= 9.5) {
    return { action: 'decrease', weight: Math.max(2, weight - 1) };
  }
  const completed = validSets.length === targetSets && validSets.every((set) => Number(set.reps) >= targetReps);
  if (completed && averageRpe > 0 && averageRpe <= 8) {
    return { action: 'increase', weight: Math.min(10, weight + 1) };
  }
  return { action: 'keep', weight };
}

module.exports = { calculateHealthScore, clamp, getCoachAdvice, suggestNextWeight };
