'use strict';

const { createDefaultState } = require('../data/defaults.js');
const { validateBackup } = require('../utils/validation.js');

const STORAGE_KEY = 'dumbbell_coach_v7_state';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(candidate, todayKey) {
  const defaults = createDefaultState(todayKey);
  if (!candidate || typeof candidate !== 'object' || candidate.version !== 1) return defaults;
  return {
    ...defaults,
    profile: { ...defaults.profile, ...(candidate.profile || {}) },
    targets: { ...defaults.targets, ...(candidate.targets || {}) },
    checkins: Array.isArray(candidate.checkins) ? candidate.checkins : [],
    bodyRecords: Array.isArray(candidate.bodyRecords) ? candidate.bodyRecords : defaults.bodyRecords,
    trainingHistory: Array.isArray(candidate.trainingHistory) ? candidate.trainingHistory : [],
    foodRecords: Array.isArray(candidate.foodRecords) ? candidate.foodRecords : [],
    exerciseProgress: candidate.exerciseProgress && typeof candidate.exerciseProgress === 'object' ? candidate.exerciseProgress : {},
    settings: { ...defaults.settings, ...(candidate.settings || {}) },
  };
}

function createStorageService(wxApi, getTodayKey) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function' || typeof wxApi.setStorageSync !== 'function') {
    throw new Error('存储服务不可用');
  }
  const today = () => getTodayKey();
  function getState() {
    const state = normalizeState(wxApi.getStorageSync(STORAGE_KEY), today());
    wxApi.setStorageSync(STORAGE_KEY, state);
    return clone(state);
  }
  function setState(nextState) {
    const normalized = normalizeState(nextState, today());
    wxApi.setStorageSync(STORAGE_KEY, normalized);
    return clone(normalized);
  }
  function updateState(updater) {
    if (typeof updater !== 'function') throw new Error('更新方法无效');
    return setState(updater(getState()));
  }
  function exportBackup() {
    const state = getState();
    const backup = {
      version: 1,
      profile: state.profile,
      targets: state.targets,
      checkins: state.checkins,
      bodyRecords: state.bodyRecords,
      trainingHistory: state.trainingHistory,
      foodRecords: state.foodRecords,
      exerciseProgress: state.exerciseProgress,
      settings: state.settings,
    };
    return JSON.stringify(backup);
  }
  function restoreBackup(raw) {
    const restored = validateBackup(raw);
    return setState({ ...getState(), ...restored });
  }
  return { exportBackup, getState, restoreBackup, setState, updateState };
}

module.exports = { createStorageService };
