'use strict';

const { calculateStreak, getPlanForDate, toDateKey } = require('../../utils/date.js');
const { calculateHealthScore, getCoachAdvice } = require('../../utils/health.js');
const { getLatestBodyRecord } = require('../../utils/view-model.js');

function sumMeals(records, date) {
  return (records || []).filter((item) => item.date === date).reduce((totals, item) => ({
    calories: totals.calories + Number(item.calories || 0),
    protein: totals.protein + Number(item.protein || 0),
  }), { calories: 0, protein: 0 });
}

Page({
  data: {
    nickname: '', dateLabel: '', plan: {}, score: 0, advice: {}, latest: {},
    streak: 0, meals: { calories: 0, protein: 0 }, checkedToday: false,
  },

  onShow() { this.loadDashboard(); },

  onPullDownRefresh() {
    this.loadDashboard();
    wx.stopPullDownRefresh();
  },

  loadDashboard() {
    const storage = getApp().storage;
    if (!storage) return;
    const state = storage.getState();
    const today = toDateKey(new Date());
    const latest = getLatestBodyRecord(state.bodyRecords);
    const plan = getPlanForDate(today, state.profile.planStartDate);
    const checkedToday = state.checkins.includes(today);
    const score = calculateHealthScore({
      sleepHours: latest.sleepHours,
      proteinGrams: latest.proteinGrams,
      proteinTarget: state.targets.proteinGrams,
      waterMl: latest.waterMl,
      waterTarget: state.targets.waterMl,
      activityComplete: checkedToday,
    });
    const advice = getCoachAdvice({
      sleepHours: latest.sleepHours,
      proteinGrams: latest.proteinGrams,
      proteinTarget: state.targets.proteinGrams,
      waterMl: latest.waterMl,
      waterTarget: state.targets.waterMl,
      planType: plan.type,
    })[0];

    this.setData({
      nickname: state.profile.nickname,
      dateLabel: `${today.slice(5, 7)} 月 ${today.slice(8)} 日`,
      plan,
      score,
      advice,
      latest,
      checkedToday,
      streak: calculateStreak(state.checkins, today),
      meals: sumMeals(state.foodRecords, today),
    });
  },

  openPrimary() {
    if (this.data.plan.type === 'RECOVERY') {
      wx.switchTab({ url: '/pages/checkin/checkin' });
      return;
    }
    wx.navigateTo({ url: `/pages/training/training?type=${this.data.plan.type}` });
  },

  openFood() { wx.navigateTo({ url: '/pages/food/food' }); },
  openCoach() { wx.switchTab({ url: '/pages/coach/coach' }); },
  openData() { wx.switchTab({ url: '/pages/data/data' }); },
});
