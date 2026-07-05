# ClaudeDesk

AI-powered desktop coding assistant with multi-provider support and Cursor-style IDE layout.

## Features

- **Multi-Provider AI** — Anthropic (Claude), OpenAI (GPT), DeepSeek, and custom OpenAI-compatible endpoints
- **Tool Use** — AI can read/write files, search code, list directories, and execute commands
- **IDE Layout** — ActivityBar + File Explorer + Tabbed Editor + Chat panel (like Cursor/Trae)
- **Conversation History** — Full-text search, export to Markdown/JSON
- **Context Tracking** — Real-time token usage and cost estimation per conversation
- **i18n** — Chinese and English with one-click switching
- **Resizable Panels** — Drag handles to resize, Ctrl+B/Ctrl+J to toggle

## Quick Start

```bash
npm install
npm run dev
```

1. Go to **Settings** → Add a profile with your API key
2. **Files** tab → Open Folder to set a working directory
3. Start chatting — AI can read/write files in your working directory

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+B` | Toggle left panel |
| `Ctrl+J` | Toggle right chat panel |
| `Ctrl+Shift+E` | Switch to Explorer |
| `Ctrl+Shift+H` | Switch to Chats |

## Project Structure

```
claudedesk/
├── electron/          # Main process (Node.js)
│   ├── ai/            # AI provider adapters
│   ├── db/            # SQLite database layer
│   ├── ipc/           # IPC handlers
│   ├── tools/         # Tool use definitions & executor
│   └── security/      # API key encryption
├── src/               # Renderer (Vue 3)
│   ├── components/    # UI components
│   ├── stores/        # Pinia state management
│   ├── locales/       # i18n translations
│   └── views/         # Page views
└── shared/            # Shared types & IPC channels
```

## License

MIT
