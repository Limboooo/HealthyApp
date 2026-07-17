# HealthyApp · 我的哑铃教练

面向个人长期使用的本地优先健康与哑铃训练助手。目前仓库包含两个可以独立运行的部分：V5–V7 网页版本预览中心，以及 V7 原生微信小程序。

## 换电脑继续开发

```powershell
git clone https://github.com/Limboooo/HealthyApp.git
cd HealthyApp
npm test
npm start
```

继续开发前请先阅读 [`PROJECT_MEMORY.md`](./PROJECT_MEMORY.md)；面向 Codex 等开发代理的约束记录在 [`AGENTS.md`](./AGENTS.md)。

## 仓库结构

```text
miniprogram-v7/   V7 原生微信小程序，可直接导入微信开发者工具
src/              网页版本预览器的数据与交互
tests/            预览器和小程序纯逻辑测试
docs/decisions/   关键架构决策及其原因
```

## 版本预览中心

这是一个独立的本地预览器，用来实时查看“我的哑铃教练”各版本的界面与功能差异。

## 启动

```powershell
npm start
```

然后打开：<http://127.0.0.1:4173/>

## 当前可预览版本

- V5：AI 拍照饮食版
- V6：混合识别版
- V7：个人健康教练版

## 可交互内容

- 左侧切换 V5 / V6 / V7，手机界面和改动清单会同步更新。
- 手机底部可切换“今日、训练/教练、打卡、数据”。
- 点击首页“拍照记录”可进入对应版本的饮食分析页面。
- “标记本版新增”可在手机界面中高亮当前版本的新功能。
- 右侧支持按“全部、只看新增、优化”筛选改动。

版本配置集中在 `src/versions.mjs`。以后新增版本时添加一项配置，预览器会自动生成版本入口与差异说明。

## 验证

```powershell
npm test
```

## V7 原生微信小程序

可直接导入微信开发者工具的工程位于 [`miniprogram-v7`](./miniprogram-v7)。它与网页预览中心相互独立，详细导入、真机预览和发布准备请看 [`miniprogram-v7/README.md`](./miniprogram-v7/README.md)。

## 隐私边界

仓库中不包含真实用户的健康记录、微信 AppSecret、模型 API Key 或云环境凭据。小程序当前默认把数据保存在设备本地；照片饮食页面仅演示本地模板分析，不上传图片。
