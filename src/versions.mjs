const navToday = { id: 'today', label: '今日', icon: 'home' };
const navCheckin = { id: 'checkin', label: '打卡', icon: 'calendar' };
const navData = { id: 'data', label: '数据', icon: 'chart' };

export const versions = [
  {
    id: 'v7',
    number: 'V7',
    name: '个人健康教练版',
    date: '当前版本',
    summary: '从记录工具升级为会主动给建议的个人教练。',
    score: 92,
    accent: '#176b51',
    nav: [navToday, { id: 'coach', label: '教练', icon: 'spark' }, navCheckin, navData],
    changes: [
      { type: 'added', title: 'AI 私人教练页', detail: '综合训练、饮食、睡眠与体重趋势生成今日建议。' },
      { type: 'added', title: '每周健康报告', detail: '集中展示七天训练、营养、睡眠和身体变化。' },
      { type: 'added', title: '成就徽章中心', detail: '连续打卡和累计里程碑拥有独立展示空间。' },
      { type: 'added', title: '数据导出与恢复', detail: '可复制完整 JSON，在换手机时恢复个人数据。' },
      { type: 'improved', title: '恢复状态建议', detail: '睡眠不足时自动建议降低训练重量和时长。' },
      { type: 'kept', title: 'V6 混合饮食识别', detail: '保留缓存、次数限制和费用保护。' },
    ],
  },
  {
    id: 'v6',
    number: 'V6',
    name: '混合识别版',
    date: '上一版本',
    summary: '用本地模板与历史缓存减少不必要的 AI 调用。',
    score: 88,
    accent: '#2c745e',
    nav: [navToday, { id: 'training', label: '训练', icon: 'dumbbell' }, navCheckin, navData],
    changes: [
      { type: 'added', title: '常见餐食模板', detail: '常吃组合可直接套用，不消耗 AI 额度。' },
      { type: 'added', title: '历史图片缓存', detail: '相同图片复用上次结果，分析更快。' },
      { type: 'added', title: 'AI 次数保护', detail: '支持每日、每月上限和免费额度优先模式。' },
      { type: 'improved', title: '自动降级', detail: '达到限额或网络失败时切换到手动记录。' },
      { type: 'kept', title: 'V5 拍照饮食流程', detail: '保留拍照、确认份量、修改和保存整套流程。' },
    ],
  },
  {
    id: 'v5',
    number: 'V5',
    name: 'AI 拍照饮食版',
    date: '基础版本',
    summary: '第一次把拍照识别、营养估算和餐食记录串起来。',
    score: 84,
    accent: '#3c8069',
    nav: [navToday, { id: 'training', label: '训练', icon: 'dumbbell' }, navCheckin, navData],
    changes: [
      { type: 'added', title: '拍照记录餐食', detail: '支持相机和相册选择，保留餐食缩略图。' },
      { type: 'added', title: '营养识别结果', detail: '估算热量、蛋白质、碳水和脂肪。' },
      { type: 'added', title: '份量与做法修正', detail: '可修改克数、烹饪方式和营养数据。' },
      { type: 'added', title: '演示识别模式', detail: '未配置真实 AI 时也能体验完整流程。' },
      { type: 'kept', title: '训练与健康闭环', detail: '延续训练、身体、睡眠和打卡记录。' },
    ],
  },
];

export function getVersion(id) {
  return versions.find((version) => version.id === id) ?? versions[0];
}

export function getPreviousVersion(id) {
  const index = versions.findIndex((version) => version.id === id);
  return index >= 0 && index < versions.length - 1 ? versions[index + 1] : null;
}

export function getChanges(id, filter = 'all') {
  const changes = getVersion(id).changes;
  return filter === 'all' ? changes : changes.filter((change) => change.type === filter);
}

export function getNavItems(id) {
  return getVersion(id).nav;
}

export function getScreenModel(id, screen = 'today') {
  const version = getVersion(id);
  const availableScreens = version.nav.map((item) => item.id);
  const normalizedScreen = screen === 'food' || availableScreens.includes(screen) ? screen : 'today';

  if (normalizedScreen === 'coach' && id === 'v7') {
    return {
      kind: 'coach',
      title: 'AI 私人教练',
      greeting: '早上好，训练伙伴',
      recommendation: '恢复状态不错，今天按计划完成 A 训练。',
    };
  }

  if (normalizedScreen === 'food') {
    return {
      kind: 'food',
      title: '拍照记录饮食',
      usageLabel: id === 'v5' ? '演示识别模式' : '本月 18 / 200 次',
      sourceLabel: id === 'v5' ? 'AI 云端估算' : '本地模板优先',
    };
  }

  if (normalizedScreen === 'training') {
    return { kind: 'training', title: '今日训练', plan: '训练 A · 5 个动作' };
  }

  if (normalizedScreen === 'checkin') {
    return { kind: 'checkin', title: '坚持记录', streak: 18, total: 42 };
  }

  if (normalizedScreen === 'data') {
    return { kind: 'data', title: '健康数据', weight: 79.4, bodyFat: 24.8 };
  }

  return {
    kind: 'today',
    title: version.name,
    greeting: '早上好，训练伙伴',
    score: version.score,
  };
}
