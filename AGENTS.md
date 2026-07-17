# HealthyApp 开发约定

## 开始工作前

1. 阅读 `PROJECT_MEMORY.md` 和相关 `docs/decisions/`。
2. 运行 `npm test`，确认基线正常。
3. 原生小程序入口是 `miniprogram-v7`，不是它下面的 `miniprogram` 子目录。

## 不可破坏的产品约束

- 不把真实健康记录、照片、AppSecret、API Key、私钥或云环境凭据提交到 Git。
- 不把 AI 营养估算描述成精确测量或医疗结论。
- 未经用户明确选择，不上传或长期保留餐食/身材照片。
- 健康数据字段必须经过范围校验；导入备份必须经过字段白名单。
- 训练日历和日期键统一使用本地日历日的 `YYYY-MM-DD`，不要混用带时区的 ISO 时间字符串。
- 保持纯原生微信小程序结构，除非有明确理由和迁移方案再引入框架。

## 代码组织

- 页面只负责展示和微信交互。
- 可测试的计算放在 `miniprogram-v7/miniprogram/utils/`。
- 持久化统一通过 `miniprogram-v7/miniprogram/services/storage.js`。
- 版本预览内容集中在 `src/versions.mjs`，不要在多个页面复制版本信息。

## 完成标准

- 修改业务逻辑时先更新或新增 Node 测试。
- 执行 `npm test`。
- 检查所有小程序 JavaScript 语法和 JSON 格式。
- 涉及 UI 时在微信开发者工具模拟器和至少一台真机检查。
- 涉及隐私接口时同步更新 README 和微信公众平台用户隐私保护指引。
