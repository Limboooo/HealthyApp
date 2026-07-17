'use strict';

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function resizeFood(food, requestedGrams) {
  const grams = Math.min(1000, Math.max(20, Math.round(Number(requestedGrams) || 0)));
  const ratio = grams / 100;
  const per100 = food.per100 || {};
  return {
    ...food,
    grams,
    calories: Math.round(Number(per100.calories || 0) * ratio),
    protein: round(Number(per100.protein || 0) * ratio),
    carbs: round(Number(per100.carbs || 0) * ratio),
    fat: round(Number(per100.fat || 0) * ratio),
  };
}

function calculateFoodTotals(foods) {
  const totals = (foods || []).reduce((sum, food) => {
    const ratio = Number(food.grams || 0) / 100;
    const source = food.per100 || {};
    return {
      calories: sum.calories + (food.per100 ? Number(source.calories || 0) * ratio : Number(food.calories || 0)),
      protein: sum.protein + (food.per100 ? Number(source.protein || 0) * ratio : Number(food.protein || 0)),
      carbs: sum.carbs + (food.per100 ? Number(source.carbs || 0) * ratio : Number(food.carbs || 0)),
      fat: sum.fat + (food.per100 ? Number(source.fat || 0) * ratio : Number(food.fat || 0)),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  return {
    calories: Math.round(totals.calories),
    protein: round(totals.protein),
    carbs: round(totals.carbs),
    fat: round(totals.fat),
  };
}

module.exports = { calculateFoodTotals, resizeFood };
