'use strict';

const { getExercises } = require('../../data/defaults.js');
const { getPlanForDate, toDateKey } = require('../../utils/date.js');
const { suggestNextWeight } = require('../../utils/health.js');

Page({
  data: {
    type: 'A', exercises: [], modalOpen: false, activeIndex: 0,
    form: { weight: '', reps: '', rpe: '7' }, restSeconds: 0, restActive: false,
  },

  onLoad(options) {
    const state = getApp().storage.getState();
    const today = toDateKey(new Date());
    const fallback = getPlanForDate(today, state.profile.planStartDate).type;
    const type = ['A', 'B'].includes(options.type) ? options.type : (['A', 'B'].includes(fallback) ? fallback : 'A');
    const exercises = getExercises(type).map((exercise) => {
      const progress = state.exerciseProgress[exercise.id];
      return { ...exercise, weight: progress ? progress.weight : exercise.weight, sets: [] };
    });
    this.startedAt = Date.now();
    this.setData({ type, exercises });
  },

  onUnload() { this.clearRestTimer(); },

  openSetModal(event) {
    const activeIndex = Number(event.currentTarget.dataset.index);
    const exercise = this.data.exercises[activeIndex];
    if (!exercise || exercise.sets.length >= exercise.targetSets) return;
    this.setData({
      modalOpen: true,
      activeIndex,
      form: { weight: String(exercise.weight || 0), reps: String(exercise.targetReps), rpe: '7' },
    });
  },

  closeSetModal() { this.setData({ modalOpen: false }); },
  noop() {},

  onFormInput(event) {
    this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value });
  },

  saveSet() {
    const exercise = this.data.exercises[this.data.activeIndex];
    const weight = Number(this.data.form.weight);
    const reps = Number(this.data.form.reps);
    const rpe = Number(this.data.form.rpe);
    const invalidWeight = exercise.weight > 0 && (!Number.isFinite(weight) || weight < 2 || weight > 10);
    if (invalidWeight || !Number.isFinite(reps) || reps < 1 || reps > 180 || !Number.isFinite(rpe) || rpe < 1 || rpe > 10) {
      wx.showToast({ title: '请检查重量、次数和 RPE', icon: 'none' });
      return;
    }
    const exercises = this.data.exercises.map((item, index) => index === this.data.activeIndex ? {
      ...item,
      weight,
      sets: [...item.sets, { weight, reps, rpe }],
    } : item);
    this.setData({ exercises, modalOpen: false });
    this.startRestTimer(90);
  },

  startRestTimer(seconds) {
    this.clearRestTimer();
    this.setData({ restSeconds: seconds, restActive: true });
    this.restTimer = setInterval(() => {
      const next = this.data.restSeconds - 1;
      if (next <= 0) {
        this.clearRestTimer();
        this.setData({ restSeconds: 0, restActive: false });
        wx.vibrateShort({ type: 'light' });
        return;
      }
      this.setData({ restSeconds: next });
    }, 1000);
  },

  clearRestTimer() {
    if (this.restTimer) clearInterval(this.restTimer);
    this.restTimer = null;
  },

  skipRest() {
    this.clearRestTimer();
    this.setData({ restSeconds: 0, restActive: false });
  },

  finishTraining() {
    const recordedSets = this.data.exercises.reduce((sum, item) => sum + item.sets.length, 0);
    if (recordedSets === 0) {
      wx.showToast({ title: '至少记录一组再结束', icon: 'none' });
      return;
    }
    const complete = this.data.exercises.every((item) => item.sets.length >= item.targetSets);
    if (complete) { this.persistTraining(); return; }
    wx.showModal({
      title: '还有动作未完成',
      content: '如果身体不适或今天时间不足，可以保存本次实际训练。',
      confirmText: '保存结束',
      success: (result) => { if (result.confirm) this.persistTraining(); },
    });
  },

  persistTraining() {
    this.clearRestTimer();
    const date = toDateKey(new Date());
    const durationMinutes = Math.max(1, Math.round((Date.now() - this.startedAt) / 60000));
    const exercises = this.data.exercises.map((item) => ({
      id: item.id, name: item.name, targetReps: item.targetReps, sets: item.sets,
    }));
    getApp().storage.updateState((state) => {
      const exerciseProgress = { ...state.exerciseProgress };
      this.data.exercises.forEach((item) => {
        const suggestion = item.weight === 0 ? { action: 'keep', weight: 0 } : suggestNextWeight({
          currentWeight: item.weight,
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          sets: item.sets,
        });
        exerciseProgress[item.id] = { exerciseId: item.id, exerciseName: item.name, ...suggestion };
      });
      return {
        ...state,
        checkins: [...new Set([...state.checkins, date])],
        trainingHistory: [...state.trainingHistory, { date, type: this.data.type, durationMinutes, exercises }],
        exerciseProgress,
      };
    });
    wx.showToast({ title: '训练已保存', icon: 'success', duration: 900 });
    setTimeout(() => wx.navigateBack(), 900);
  },
});
