'use strict';

const { buildCalendar, getLongestStreak } = require('../../utils/view-model.js');
const { calculateStreak, getPlanForDate, toDateKey } = require('../../utils/date.js');

const DEFAULT_TASKS = [
  { id: 'walk', label: '快走或散步 30 分钟', done: false },
  { id: 'stretch', label: '轻柔拉伸 5 分钟', done: false },
  { id: 'water', label: '完成今日补水目标', done: false },
];

Page({
  data: {
    monthLabel: '', cells: [], currentStreak: 0, longestStreak: 0, totalDays: 0,
    checkedToday: false, canNext: false, plan: {}, tasks: DEFAULT_TASKS, achievements: [],
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
  },

  onLoad() {
    const now = new Date();
    this.viewYear = now.getFullYear();
    this.viewMonth = now.getMonth();
  },

  onShow() { this.render(); },

  render() {
    const state = getApp().storage.getState();
    const today = toDateKey(new Date());
    const calendar = buildCalendar(this.viewYear, this.viewMonth, state.checkins, today);
    const blanks = Array.from({ length: calendar.leadingBlanks }, (_, index) => ({ blank: true, key: `blank-${index}` }));
    const achievements = [
      { id: 'first', label: '迈出第一步', target: 1 },
      { id: 'three', label: '连续 3 天', target: 3, streak: true },
      { id: 'ten', label: '累计 10 天', target: 10 },
      { id: 'seven', label: '连续 7 天', target: 7, streak: true },
      { id: 'thirty', label: '累计 30 天', target: 30 },
    ].map((item) => ({
      ...item,
      unlocked: item.streak ? getLongestStreak(state.checkins) >= item.target : state.checkins.length >= item.target,
    }));
    const now = new Date();
    const canNext = this.viewYear < now.getFullYear()
      || (this.viewYear === now.getFullYear() && this.viewMonth < now.getMonth());

    this.setData({
      monthLabel: `${this.viewYear} 年 ${this.viewMonth + 1} 月`,
      cells: [...blanks, ...calendar.days.map((day) => ({ ...day, key: day.date }))],
      currentStreak: calculateStreak(state.checkins, today),
      longestStreak: getLongestStreak(state.checkins),
      totalDays: state.checkins.length,
      checkedToday: state.checkins.includes(today),
      canNext,
      plan: getPlanForDate(today, state.profile.planStartDate),
      achievements,
    });
  },

  previousMonth() {
    this.viewMonth -= 1;
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear -= 1; }
    this.render();
  },

  nextMonth() {
    if (!this.data.canNext) return;
    this.viewMonth += 1;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear += 1; }
    this.render();
  },

  toggleTask(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ tasks: this.data.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) });
  },

  completeToday() {
    if (this.data.checkedToday) return;
    const today = toDateKey(new Date());
    const storage = getApp().storage;
    const state = storage.getState();
    if (this.data.plan.type !== 'RECOVERY' && !state.trainingHistory.some((item) => item.date === today)) {
      wx.navigateTo({ url: `/pages/training/training?type=${this.data.plan.type}` });
      return;
    }
    if (this.data.plan.type === 'RECOVERY' && !this.data.tasks.every((task) => task.done)) {
      wx.showToast({ title: '先完成 3 项恢复任务', icon: 'none' });
      return;
    }
    storage.updateState((current) => ({ ...current, checkins: [...new Set([...current.checkins, today])] }));
    wx.showToast({ title: '今天已点亮', icon: 'success' });
    this.render();
  },
});
