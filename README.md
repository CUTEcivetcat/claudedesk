# ClaudeDesk

基于 Electron + Vue 3 的 AI 桌面编程助手，支持多 AI 提供商、Cursor 风格 IDE 布局。

## 功能特性

- **多提供商支持** — Anthropic (Claude)、OpenAI (GPT)、DeepSeek、以及自定义 OpenAI 兼容端点
- **Tool Use 工具调用** — AI 可自主读写文件、搜索代码、列出目录、执行终端命令
- **IDE 布局** — ActivityBar 活动栏 + 文件浏览器 + 多 Tab 编辑器 + 聊天面板（类 Cursor/Trae 风格）
- **对话历史** — 全文搜索、导出 Markdown / JSON
- **上下文追踪** — 实时 Token 用量与费用估算
- **国际化** — 中英文一键切换
- **可拖拽面板** — 拖拽调整宽度，`Ctrl+B` / `Ctrl+J` 一键折叠面板
- **文件修改提示** — AI 修改文件后自动刷新编辑器并显示变更卡片

## 快速开始

```bash
npm install
npm run dev
```

1. 打开 **Settings** → 添加 API Key 配置
2. 左侧 **Files** 标签 → Open Folder 设置工作目录
3. 开始对话 — AI 可直接读写工作目录中的文件

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+B` | 折叠/展开左侧面板 |
| `Ctrl+J` | 折叠/展开右侧聊天面板 |
| `Ctrl+Shift+E` | 切换到文件浏览器 |
| `Ctrl+Shift+H` | 切换到对话列表 |

## 项目结构

```
claudedesk/
├── electron/          # 主进程 (Node.js)
│   ├── ai/            # AI 提供商适配器
│   ├── db/            # SQLite 数据库层
│   ├── ipc/           # IPC 通信处理
│   ├── tools/         # Tool Use 工具定义与执行器
│   └── security/      # API Key 加密存储
├── src/               # 渲染进程 (Vue 3)
│   ├── components/    # UI 组件
│   ├── stores/        # Pinia 状态管理
│   ├── locales/       # 中英文语言包
│   └── views/         # 页面视图
└── shared/            # 共享类型与 IPC 通道定义
```

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 33 |
| 前端 | Vue 3 + TypeScript + Pinia + Naive UI |
| 数据库 | SQLite (sql.js) |
| AI SDK | @anthropic-ai/sdk + openai |
| 国际化 | vue-i18n |
| 构建 | electron-vite + electron-builder |

## 许可证

MIT
