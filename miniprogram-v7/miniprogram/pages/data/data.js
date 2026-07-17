'use strict';

const { toDateKey } = require('../../utils/date.js');
const { sanitizeBodyRecord } = require('../../utils/validation.js');
const { getLatestBodyRecord } = require('../../utils/view-model.js');

function buildWeightTrend(records) {
  const items = [...(records || [])].filter((item) => Number.isFinite(Number(item.weight))).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const values = items.map((item) => Number(item.weight));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return items.map((item) => ({
    date: item.date.slice(5).replace('-', '/'),
    weight: Number(item.weight),
    width: max === min ? 68 : 35 + ((Number(item.weight) - min) / (max - min)) * 55,
  }));
}

Page({
  data: {
    form: {},
    latest: {},
    weightTrend: [],
    recordCount: 0,
  },

  onShow() { this.loadData(); },

  loadData() {
    const state = getApp().storage.getState();
    const latest = getLatestBodyRecord(state.bodyRecords);
    this.setData({
      latest,
      form: {
        height: latest.height || state.profile.height || '',
        weight: latest.weight || '',
        bodyFat: latest.bodyFat || '',
        waist: latest.waist || '',
        sleepHours: latest.sleepHours || '',
        proteinGrams: latest.proteinGrams || '',
        waterMl: latest.waterMl || '',
      },
      weightTrend: buildWeightTrend(state.bodyRecords),
      recordCount: state.bodyRecords.length,
    });
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  saveRecord() {
    try {
      const cleaned = sanitizeBodyRecord(this.data.form);
      if (!Object.keys(cleaned).length) throw new Error('至少填写一项数据');
      const date = toDateKey(new Date());
      getApp().storage.updateState((state) => {
        const existing = state.bodyRecords.find((item) => item.date === date) || {};
        const nextRecord = { ...existing, ...cleaned, date };
        const bodyRecords = state.bodyRecords.filter((item) => item.date !== date).concat(nextRecord);
        return {
          ...state,
          profile: { ...state.profile, height: cleaned.height || state.profile.height },
          bodyRecords,
        };
      });
      wx.showToast({ title: '今日数据已保存', icon: 'success' });
      this.loadData();
    } catch (error) {
      wx.showToast({ title: error.message || '数据无法保存', icon: 'none' });
    }
  },

  exportBackup() {
    const backup = getApp().storage.exportBackup();
    wx.setClipboardData({ data: backup, success: () => wx.showToast({ title: '备份已复制' }) });
  },

  restoreBackup() {
    wx.getClipboardData({
      success: ({ data }) => {
        wx.showModal({
          title: '恢复本地备份',
          content: '确认后将用备份中的训练、饮食和身体记录覆盖当前数据。',
          confirmText: '确认恢复',
          success: (result) => {
            if (!result.confirm) return;
            try {
              getApp().storage.restoreBackup(data);
              wx.showToast({ title: '恢复成功', icon: 'success' });
              this.loadData();
            } catch (error) {
              wx.showToast({ title: error.message || '备份无效', icon: 'none' });
            }
          },
        });
      },
      fail: () => wx.showToast({ title: '无法读取剪贴板', icon: 'none' }),
    });
  },
});
