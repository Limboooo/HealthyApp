import { getChanges, getNavItems, getPreviousVersion, getScreenModel, getVersion, versions } from './versions.mjs';

const state = {
  versionId: location.hash.slice(1).split('/')[0] || 'v7',
  screen: location.hash.slice(1).split('/')[1] || 'today',
  filter: 'all',
  showNew: true,
};

const elements = {
  activeVersion: document.querySelector('#active-version-label'),
  changeCount: document.querySelector('#change-count'),
  changeList: document.querySelector('#change-list'),
  compareToggle: document.querySelector('#compare-toggle'),
  phone: document.querySelector('#phone-preview'),
  summary: document.querySelector('#version-summary'),
  versionList: document.querySelector('#version-list'),
};

const iconPaths = {
  home: '<path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z"/><path d="M9 21v-7h6v7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="m8 15 2 2 5-5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  spark: '<path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  camera: '<path d="M14.5 5 13 3H8L6.5 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-5.5Z"/><circle cx="10.5" cy="12.5" r="4"/>',
  moon: '<path d="M20.5 14.2A8 8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>',
  scale: '<path d="M5 21h14l1.5-13.5A3 3 0 0 0 17.5 4h-11a3 3 0 0 0-3 3.5L5 21Z"/><path d="M9 9a3 3 0 0 1 6 0M12 9l2-2"/>',
  flame: '<path d="M13.5 2s.8 4-2.5 6.5c-2.7 2-3 4.7-1.2 6.5-.2-2.7 2.2-4.2 2.2-4.2s.3 2.5 2.2 3.7c1.5 1 1.8 2.5.8 4 3.5-1 5.5-3.8 4.8-7.2C19 7.8 16 5.3 13.5 2Z"/><path d="M8.8 7.2C6 9 4.5 11.5 5 14.5c.5 3.5 3.3 6 7 6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
};

function icon(name, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] ?? iconPaths.spark}</svg>`;
}

function renderVersionList() {
  elements.versionList.innerHTML = versions.map((version, index) => `
    <button class="version-card ${version.id === state.versionId ? 'is-active' : ''}" type="button" data-version="${version.id}" aria-current="${version.id === state.versionId ? 'true' : 'false'}">
      <span class="timeline-node" aria-hidden="true"></span>
      <span class="version-card-copy">
        <span class="version-card-top"><strong>${version.number}</strong><small>${version.date}</small></span>
        <span class="version-name">${version.name}</span>
        <span class="version-mini-summary">${version.summary}</span>
      </span>
      ${index === 0 ? '<span class="current-pill">CURRENT</span>' : ''}
    </button>
  `).join('');
}

function phoneStatusBar() {
  return `<div class="phone-status"><span>19:00</span><span class="phone-island" aria-hidden="true"></span><span class="status-signals" aria-label="信号良好，Wi-Fi 已连接，电量 86%"><i></i><i></i><b>86</b></span></div>`;
}

function todayScreen(version, model) {
  const isV7 = version.id === 'v7';
  return `
    <div class="mini-header">
      <div><p>${model.greeting}</p><h3>今天也向目标靠近一点</h3></div>
      <button class="avatar" type="button" aria-label="打开个人资料">L</button>
    </div>
    <section class="score-card ${state.showNew && isV7 ? 'is-new' : ''}">
      <div class="score-copy"><span>今日健康分</span><strong>${model.score}<small>分</small></strong><p>${isV7 ? '恢复良好，适合正常训练' : '今日状态整体不错'}</p></div>
      <div class="score-ring" style="--score: ${model.score * 3.6}deg"><span>${model.score}</span></div>
      ${isV7 ? '<span class="new-flag">V7 新增</span>' : ''}
    </section>
    ${isV7 ? `
      <button class="coach-strip ${state.showNew ? 'is-new' : ''}" type="button" data-screen="coach">
        <span class="strip-icon">${icon('spark')}</span>
        <span><small>AI 教练建议</small><strong>今天肩推继续 4kg，目标 10 × 3</strong></span>
        ${icon('arrow')}
      </button>` : ''}
    <section class="content-section">
      <div class="section-title"><h4>今日计划</h4><span>周三</span></div>
      <button class="training-card" type="button" data-screen="training">
        <span class="training-icon">${icon('dumbbell')}</span>
        <span class="training-copy"><small>力量训练 · A</small><strong>全身基础训练</strong><span>5 个动作 · 约 42 分钟</span></span>
        <span class="start-button">开始</span>
      </button>
    </section>
    <section class="content-section">
      <div class="section-title"><h4>今日记录</h4><span>2 / 4 已完成</span></div>
      <div class="metric-grid">
        <button class="metric-card food-entry" type="button" data-action="food">
          <span class="metric-icon green">${icon('camera')}</span><span><small>饮食</small><strong>拍照记录</strong></span>
        </button>
        <div class="metric-card"><span class="metric-icon blue">${icon('moon')}</span><span><small>睡眠</small><strong>7 小时 45 分</strong></span></div>
        <div class="metric-card"><span class="metric-icon sand">${icon('scale')}</span><span><small>体重</small><strong>79.4 kg</strong></span></div>
        <button class="metric-card" type="button" data-screen="checkin"><span class="metric-icon orange">${icon('flame')}</span><span><small>连续打卡</small><strong>18 天</strong></span></button>
      </div>
    </section>
  `;
}

function coachScreen(model) {
  const suggestions = [
    ['训练', '按计划完成 A 训练', '肩推继续 4kg，目标完成 10 × 3。'],
    ['营养', '蛋白质还差 35g', '晚餐可补充 150g 鸡胸肉或一杯无糖酸奶。'],
    ['恢复', '昨晚睡眠达标', '恢复状态 92%，今天不需要降低训练量。'],
  ];
  return `
    <div class="page-header"><div><p>7月16日 · 周四</p><h3>${model.title}</h3></div><span class="coach-orb">${icon('spark')}</span></div>
    <section class="coach-hero ${state.showNew ? 'is-new' : ''}">
      <span class="new-flag">V7 新增</span>
      <div class="coach-score"><span>今日状态</span><strong>92</strong><small>/ 100</small></div>
      <p>${model.recommendation}</p>
      <div class="recovery-bar"><span style="width: 92%"></span></div>
    </section>
    <div class="coach-list">
      ${suggestions.map(([tag, title, detail], index) => `
        <article class="coach-card">
          <span class="coach-index">0${index + 1}</span>
          <div><small>${tag}建议</small><h4>${title}</h4><p>${detail}</p></div>
        </article>`).join('')}
    </div>
    <button class="report-button" type="button"><span>${icon('chart')}</span><span><small>第 7 周健康报告已生成</small><strong>查看本周完整复盘</strong></span>${icon('arrow')}</button>
  `;
}

function foodScreen(model, version) {
  const hasHybrid = version.id !== 'v5';
  return `
    <div class="page-header compact"><button class="back-button" type="button" data-screen="today" aria-label="返回今日">${icon('back')}</button><div><p>午餐 · 12:36</p><h3>${model.title}</h3></div><span></span></div>
    <div class="meal-photo" role="img" aria-label="鸡胸肉、西兰花、米饭和番茄炒蛋示意图">
      <div class="plate"><span class="rice"></span><span class="greens"></span><span class="chicken"></span><span class="egg"></span></div>
      <span class="analysis-badge">${icon('check')} 分析完成</span>
    </div>
    <div class="analysis-meta ${state.showNew && hasHybrid ? 'is-new' : ''}">
      <span><i></i>${model.sourceLabel}</span><strong>${model.usageLabel}</strong>
      ${hasHybrid ? '<span class="new-flag">V6 新增</span>' : ''}
    </div>
    <section class="macro-card">
      <div class="calorie-total"><span>预计热量</span><strong>725 <small>kcal</small></strong><p>估算范围 650–810 kcal</p></div>
      <div class="macro-row"><span><i class="protein"></i><small>蛋白质</small><strong>49g</strong></span><span><i class="carbs"></i><small>碳水</small><strong>78g</strong></span><span><i class="fat"></i><small>脂肪</small><strong>23g</strong></span></div>
    </section>
    <section class="food-list"><div class="section-title"><h4>识别到 4 种食物</h4><button type="button">编辑</button></div>
      ${[['鸡胸肉','120g','198 kcal'],['米饭','180g','234 kcal'],['西兰花','160g','54 kcal'],['番茄炒蛋','220g','239 kcal']].map(([name, grams, kcal]) => `<div class="food-row"><span class="food-dot"></span><span><strong>${name}</strong><small>${grams} · 正常烹饪</small></span><b>${kcal}</b>${icon('arrow')}</div>`).join('')}
    </section>
    <button class="save-meal-button" type="button">保存到午餐</button>
  `;
}

function trainingScreen(model) {
  const exercises = [['高脚杯深蹲','8kg','3 × 10'],['哑铃地板卧推','5kg','3 × 10'],['单臂哑铃划船','7kg','3 × 10'],['哑铃肩推','4kg','3 × 10'],['平板支撑','自重','3 × 30秒']];
  return `<div class="page-header"><div><p>${model.plan}</p><h3>${model.title}</h3></div><span class="progress-chip">0 / 5</span></div><div class="progress-track"><span style="width:8%"></span></div><div class="exercise-list">${exercises.map(([name, weight, sets], index) => `<button class="exercise-row" type="button"><span class="exercise-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${name}</strong><small>${weight} · ${sets}</small></span>${icon('arrow')}</button>`).join('')}</div><button class="primary-action" type="button">开始第一个动作</button>`;
}

function checkinScreen(model) {
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  return `<div class="page-header"><div><p>2026 年 7 月</p><h3>${model.title}</h3></div><span class="streak-pill">${icon('flame')} ${model.streak} 天</span></div><section class="streak-summary"><div><small>当前连续</small><strong>${model.streak}<span>天</span></strong></div><div><small>累计打卡</small><strong>${model.total}<span>天</span></strong></div><div><small>最长连续</small><strong>21<span>天</span></strong></div></section><section class="calendar-card"><div class="weekdays">${['一','二','三','四','五','六','日'].map((day) => `<span>${day}</span>`).join('')}</div><div class="calendar-days"><span class="empty"></span><span class="empty"></span>${days.map((day) => `<span class="${day <= 16 ? 'done' : ''} ${day === 16 ? 'today' : ''}">${day <= 16 ? icon('check') : day}</span>`).join('')}</div></section><div class="achievement-card"><span class="medal">18</span><div><small>下一个里程碑</small><strong>连续打卡 21 天</strong><p>再坚持 3 天即可解锁新徽章</p></div></div>`;
}

function dataScreen(model, version) {
  return `<div class="page-header"><div><p>最近更新 · 今天 08:10</p><h3>${model.title}</h3></div><button class="add-button" type="button" aria-label="添加健康数据">＋</button></div><section class="body-overview"><div><small>当前体重</small><strong>${model.weight}<span>kg</span></strong><p>较开始 <em>−4.8 kg</em></p></div><div class="mini-chart" aria-label="体重下降趋势图"><i style="height:35%"></i><i style="height:42%"></i><i style="height:50%"></i><i style="height:58%"></i><i style="height:64%"></i><i style="height:72%"></i><i style="height:82%"></i></div></section><div class="data-grid"><article><small>体脂率</small><strong>${model.bodyFat}%</strong><span>↓ 1.6%</span></article><article><small>腰围</small><strong>101.5cm</strong><span>↓ 3.5cm</span></article><article><small>肌肉量</small><strong>65.2kg</strong><span>保持稳定</span></article><article><small>BMI</small><strong>31.1</strong><span>持续改善</span></article></div>${version.id === 'v7' ? '<section class="backup-card"><span>'+icon('check')+'</span><div><small>本地数据保护</small><strong>完整备份已就绪</strong><p>可导出 JSON，换手机后继续使用。</p></div><button type="button">导出</button></section>' : ''}`;
}

function renderPhone() {
  const version = getVersion(state.versionId);
  const model = getScreenModel(state.versionId, state.screen);
  const screens = {
    today: () => todayScreen(version, model),
    coach: () => coachScreen(model),
    food: () => foodScreen(model, version),
    training: () => trainingScreen(model),
    checkin: () => checkinScreen(model),
    data: () => dataScreen(model, version),
  };
  const content = (screens[model.kind] ?? screens.today)();
  const hideNav = model.kind === 'food';
  elements.phone.innerHTML = `${phoneStatusBar()}<div class="phone-screen"><main class="mini-content screen-${model.kind}">${content}</main>${hideNav ? '' : renderBottomNav(version)}</div><div class="home-indicator" aria-hidden="true"></div>`;
}

function renderBottomNav(version) {
  return `<nav class="mini-nav" aria-label="小程序页面">${getNavItems(version.id).map((item) => `<button class="${state.screen === item.id || (state.screen === 'food' && item.id === 'today') ? 'is-active' : ''}" type="button" data-screen="${item.id}">${icon(item.icon)}<span>${item.label}</span></button>`).join('')}</nav>`;
}

function renderChanges() {
  const version = getVersion(state.versionId);
  const previous = getPreviousVersion(state.versionId);
  const changes = getChanges(state.versionId, state.filter);
  const labels = { added: '新增', improved: '优化', kept: '保留' };
  elements.changeCount.textContent = `${changes.length} 项`;
  elements.summary.innerHTML = `<div class="summary-version"><span>${version.number}</span><div><strong>${version.name}</strong><small>${previous ? `对比 ${previous.number} ${previous.name}` : '首个可预览版本'}</small></div></div><p>${version.summary}</p>`;
  elements.changeList.innerHTML = changes.length ? changes.map((change) => `<article class="change-item type-${change.type}"><span class="change-type">${labels[change.type]}</span><div><h3>${change.title}</h3><p>${change.detail}</p></div></article>`).join('') : '<div class="empty-state"><strong>这个筛选下没有改动</strong><p>切换到“全部”查看完整记录。</p></div>';
}

function render() {
  const version = getVersion(state.versionId);
  state.versionId = version.id;
  elements.activeVersion.textContent = `${version.number} · ${version.date}`;
  elements.compareToggle.setAttribute('aria-pressed', String(state.showNew));
  elements.compareToggle.classList.toggle('is-active', state.showNew);
  renderVersionList();
  renderPhone();
  renderChanges();
}

function setScreen(screen) {
  state.screen = screen;
  location.hash = `${state.versionId}/${screen}`;
  renderPhone();
}

document.addEventListener('click', (event) => {
  const versionButton = event.target.closest('[data-version]');
  const screenButton = event.target.closest('[data-screen]');
  const filterButton = event.target.closest('[data-filter]');
  const actionButton = event.target.closest('[data-action="food"]');

  if (versionButton) {
    state.versionId = versionButton.dataset.version;
    state.screen = 'today';
    location.hash = `${state.versionId}/today`;
    render();
  } else if (screenButton) {
    setScreen(screenButton.dataset.screen);
  } else if (actionButton) {
    setScreen('food');
  } else if (filterButton) {
    state.filter = filterButton.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('is-active', button === filterButton));
    renderChanges();
  }
});

elements.compareToggle.addEventListener('click', () => {
  state.showNew = !state.showNew;
  render();
});

window.addEventListener('hashchange', () => {
  const [versionId, screen] = location.hash.slice(1).split('/');
  if (versionId) state.versionId = versionId;
  if (screen) state.screen = screen;
  render();
});

render();
