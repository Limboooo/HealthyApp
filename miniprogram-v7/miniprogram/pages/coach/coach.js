'use strict';

const { getPlanForDate, toDateKey } = require('../../utils/date.js');
const { calculateHealthScore, getCoachAdvice } = require('../../utils/health.js');
const { buildWeeklyReport, getLatestBodyRecord } = require('../../utils/view-model.js');

Page({
  data: {
    score: 0,
    advice: [],
    report: {},
    progressItems: [],
    scoreLabel: '',
  },

  onShow() {
    const storage = getApp().storage;
    if (!storage) return;
    const state = storage.getState();
    const today = toDateKey(new Date());
    const latest = getLatestBodyRecord(state.bodyRecords);
    const plan = getPlanForDate(today, state.profile.planStartDate);
    const activityComplete = state.checkins.includes(today);
    const score = calculateHealthScore({
      sleepHours: latest.sleepHours,
      proteinGrams: latest.proteinGrams,
      proteinTarget: state.targets.proteinGrams,
      waterMl: latest.waterMl,
      waterTarget: state.targets.waterMl,
      activityComplete,
    });
    const advice = getCoachAdvice({
      sleepHours: latest.sleepHours,
      proteinGrams: latest.proteinGrams,
      proteinTarget: state.targets.proteinGrams,
      waterMl: latest.waterMl,
      waterTarget: state.targets.waterMl,
      planType: plan.type,
    });
    const progressItems = Object.values(state.exerciseProgress || {}).slice(0, 3).map((item) => ({
      ...item,
      label: item.action === 'increase' ? '下次加重' : item.action === 'decrease' ? '下次减重' : '保持重量',
    }));

    this.setData({
      score,
      advice,
      report: buildWeeklyReport(state, today),
      progressItems,
      scoreLabel: score >= 85 ? '状态很好' : score >= 65 ? '稳步恢复' : '今天放轻松',
    });
  },

  openTraining() {
    const state = getApp().storage.getState();
    const today = toDateKey(new Date());
    const plan = getPlanForDate(today, state.profile.planStartDate);
    if (plan.type === 'RECOVERY') {
      wx.switchTab({ url: '/pages/checkin/checkin' });
      return;
    }
    wx.navigateTo({ url: `/pages/training/training?type=${plan.type}` });
  },
});
