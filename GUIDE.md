# ClaudeDesk 使用指南

## 安装与启动

### 开发模式
```bash
git clone https://github.com/CUTEcivetcat/claudedesk.git
cd claudedesk
npm install
npm run dev
```

### 生产模式（打包版）
1. 从 [Releases](https://github.com/CUTEcivetcat/claudedesk/releases) 下载 `ClaudeDesk-v0.1.0.zip`
2. 解压后双击 `ClaudeDesk.exe` 即可运行

---

## 初始配置

首次启动后，需要配置 AI 提供商：

1. 点击顶栏齿轮图标 **⚙** 进入设置
2. 点击 **Add Profile**
3. 填写配置：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Profile Name | 自定义名称 | 工作账号 |
| Provider | 提供商 | Anthropic (Claude) |
| API Key | API 密钥 | sk-ant-... |
| Default Model | 默认模型 | claude-sonnet-4-20250514 |

4. 点击 **Create** 保存

支持的提供商：
- **Anthropic** — Claude 系列模型
- **OpenAI** — GPT 系列模型
- **DeepSeek** — DeepSeek 系列模型
- **Custom** — 任何兼容 OpenAI 接口的自定义端点

---

## 界面布局

```
┌─┬────────┬──────────────────┬──────────┐
│ │📁 EXPLORER                │          │
│📁│ 📂 src/                  │ 💬 Chat  │
│💬│   📄 main.ts             │          │
│  │   📄 App.vue   ←→编辑→   │ 消息...  │
│  │                         │          │
│⚙│                         │ 输入框   │
├─┴────────┴──────────────────┴──────────┤
│ 📂 C:/project  ·  GPT-4o  ·  Idle     │
└────────────────────────────────────────┘
```

| 区域 | 功能 |
|------|------|
| **ActivityBar** | 左侧图标栏，切换资源管理器/对话/搜索 |
| **Explorer** | 文件树，打开文件夹浏览项目 |
| **Editor** | 多Tab编辑器，查看和修改文件 |
| **Chat** | AI 对话，发送消息、查看回复 |
| **StatusBar** | 底部状态栏，显示工作目录、Token用量 |

---

## 核心功能

### 1. 工作目录

在 Explorer 中点击 **Open Folder** 选择一个文件夹作为工作目录。之后所有对话中 AI 都会自动感知该目录的文件结构，并可直接读写其中的文件。

### 2. 对话

- 输入消息后按 **Enter** 发送，**Shift+Enter** 换行
- AI 回复支持 Markdown 渲染、代码高亮
- 对话历史自动保存，左侧 Chats 标签可查看和搜索

### 3. 工具调用 (Tool Use)

AI 可以主动调用以下工具操作你的项目：

| 工具 | 功能 | 示例 |
|------|------|------|
| `read_file` | 读取文件 | "看看 src/main.ts 的内容" |
| `write_file` | 写入/创建文件 | "创建一个 utils.ts" |
| `list_directory` | 列出目录 | "src 下面有什么文件" |
| `search_files` | 搜索代码 | "搜索所有用到 axios 的地方" |
| `run_command` | 执行命令 | "运行 npm test" |

AI 调用工具时，对话中会显示对应的工具卡片，点击可展开查看详情。

### 4. 文件编辑器

- 点击文件树中的文件 → 在编辑器 Tab 中打开
- 直接编辑 → 修改后 Tab 上显示 **●** 标记
- 点击 **Save** 或 **Ctrl+S** 保存
- AI 修改文件后会自动刷新编辑器并显示变更提示卡片

### 5. 代码审查

点击顶栏 📁 旁边的按钮进入代码审查模式：
- 选择文件 → 输入审查重点（可选）→ 点击 Review
- AI 会分析代码并给出结构化审查意见

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+B` | 折叠/展开左侧面板 |
| `Ctrl+J` | 折叠/展开右侧聊天面板 |
| `Ctrl+Shift+E` | 切换到文件浏览器 |
| `Ctrl+Shift+H` | 切换到对话列表 |
| `Enter` | 发送消息 |
| `Shift+Enter` | 消息换行 |

---

## 语言切换

顶栏下拉菜单可选择 **中文** / **English**，所有界面文字即时切换。

---

## 常见问题

**Q: 为什么 AI 回复"我无法访问本地文件"？**

A: 需要先设置工作目录（Explorer → Open Folder），并且确保使用的是支持 Tool Use 的模型（如 Claude 系列、GPT-4）。

**Q: API Key 安全吗？**

A: API Key 使用系统级加密（Windows DPAPI）存储在主进程中，渲染进程永远无法获取明文密钥。

**Q: 支持哪些 AI 模型？**

A: 任何兼容 Anthropic Messages API 或 OpenAI Chat Completions API 的模型都支持。

**Q: 如何导出对话？**

A: 在 Chats 列表中找到对话，点击导出按钮，可选择 Markdown 或 JSON 格式。
