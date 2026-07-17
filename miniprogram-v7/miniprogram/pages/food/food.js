'use strict';

const { toDateKey } = require('../../utils/date.js');
const { calculateFoodTotals, resizeFood } = require('../../utils/food.js');
const { getLatestBodyRecord } = require('../../utils/view-model.js');

const TEMPLATE = [
  { id: 'rice', name: '米饭', grams: 180, cookingMethod: '蒸煮', confidence: 92, per100: { calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3 } },
  { id: 'chicken', name: '鸡胸肉', grams: 120, cookingMethod: '少油煎', confidence: 86, per100: { calories: 165, protein: 31, carbs: 0, fat: 3.6 } },
  { id: 'broccoli', name: '西兰花', grams: 150, cookingMethod: '清炒', confidence: 83, per100: { calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4 } },
  { id: 'tomato-egg', name: '番茄炒蛋', grams: 220, cookingMethod: '正常炒', confidence: 68, per100: { calories: 107, protein: 5.3, carbs: 4.1, fat: 7.7 } },
];

Page({
  data: {
    imagePath: '', analyzing: false, foods: [], totals: {},
    mealTypes: ['早餐', '午餐', '晚餐', '加餐'], mealIndex: 1,
    cookingMethods: ['蒸煮', '水煮', '少油煎', '清炒', '正常炒', '油炸'],
  },

  onUnload() { if (this.analysisTimer) clearTimeout(this.analysisTimer); },

  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success: ({ tempFiles }) => {
        const file = tempFiles && tempFiles[0];
        if (!file) return;
        if (Number(file.size) > 5 * 1024 * 1024) {
          wx.showToast({ title: '请选择 5MB 以内的图片', icon: 'none' });
          return;
        }
        this.setData({ imagePath: file.tempFilePath });
        this.analyzeLocally();
      },
    });
  },

  useTemplate() {
    this.setData({ imagePath: '' });
    this.analyzeLocally();
  },

  analyzeLocally() {
    if (this.analysisTimer) clearTimeout(this.analysisTimer);
    this.setData({ analyzing: true, foods: [], totals: {} });
    this.analysisTimer = setTimeout(() => {
      const foods = TEMPLATE.map((item) => resizeFood(item, item.grams));
      this.setData({ analyzing: false, foods, totals: calculateFoodTotals(foods) });
    }, 700);
  },

  adjustPortion(event) {
    const index = Number(event.currentTarget.dataset.index);
    const delta = Number(event.currentTarget.dataset.delta);
    const foods = this.data.foods.map((food, foodIndex) => foodIndex === index ? resizeFood(food, food.grams + delta) : food);
    this.setData({ foods, totals: calculateFoodTotals(foods) });
  },

  updateFoodName(event) {
    const index = Number(event.currentTarget.dataset.index);
    const name = String(event.detail.value || '').trim().slice(0, 30);
    this.setData({ foods: this.data.foods.map((food, foodIndex) => foodIndex === index ? { ...food, name } : food) });
  },

  changeCooking(event) {
    const index = Number(event.currentTarget.dataset.index);
    const cookingMethod = this.data.cookingMethods[Number(event.detail.value)];
    this.setData({ foods: this.data.foods.map((food, foodIndex) => foodIndex === index ? { ...food, cookingMethod } : food) });
  },

  changeMeal(event) { this.setData({ mealIndex: Number(event.detail.value) }); },

  saveMeal() {
    if (!this.data.foods.length) {
      wx.showToast({ title: '请先选择照片或模板', icon: 'none' });
      return;
    }
    const date = toDateKey(new Date());
    const record = {
      date,
      mealType: this.data.mealTypes[this.data.mealIndex],
      ...this.data.totals,
      estimated: true,
      foods: this.data.foods.map(({ name, grams, cookingMethod, calories, protein, carbs, fat, confidence }) => ({
        name, grams, cookingMethod, calories, protein, carbs, fat, confidence,
      })),
    };
    getApp().storage.updateState((state) => {
      const foodRecords = [...state.foodRecords, record];
      const todayProtein = foodRecords.filter((item) => item.date === date).reduce((sum, item) => sum + Number(item.protein || 0), 0);
      const latest = getLatestBodyRecord(state.bodyRecords);
      const bodyRecord = { ...latest, date, proteinGrams: Math.round(todayProtein * 10) / 10 };
      return {
        ...state,
        foodRecords,
        bodyRecords: state.bodyRecords.filter((item) => item.date !== date).concat(bodyRecord),
      };
    });
    wx.showToast({ title: '饮食已保存', icon: 'success', duration: 900 });
    setTimeout(() => wx.navigateBack(), 900);
  },
});
