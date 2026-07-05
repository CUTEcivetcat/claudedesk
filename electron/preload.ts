import { contextBridge, ipcRenderer } from 'electron'
import * as channels from '../shared/ipc-channels'

const electronAPI = {
  // Chat
  sendMessage: (input: { conversationId: string; content: string; attachments?: string[] }) =>
    ipcRenderer.invoke(channels.CHAT_SEND, input),
  abortChat: (conversationId: string) =>
    ipcRenderer.invoke(channels.CHAT_ABORT, conversationId),
  onStreamToken: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload)
    ipcRenderer.on(channels.CHAT_STREAM_TOKEN, handler)
    return () => ipcRenderer.removeListener(channels.CHAT_STREAM_TOKEN, handler)
  },
  onStreamDone: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload)
    ipcRenderer.on(channels.CHAT_STREAM_DONE, handler)
    return () => ipcRenderer.removeListener(channels.CHAT_STREAM_DONE, handler)
  },
  onStreamError: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload)
    ipcRenderer.on(channels.CHAT_STREAM_ERROR, handler)
    return () => ipcRenderer.removeListener(channels.CHAT_STREAM_ERROR, handler)
  },

  // Conversations
  listConversations: (opts?: { archived?: boolean; limit?: number; offset?: number }) =>
    ipcRenderer.invoke(channels.CONVERSATIONS_LIST, opts || {}),
  getConversation: (id: string) =>
    ipcRenderer.invoke(channels.CONVERSATIONS_GET, { id }),
  createConversation: (profileId: string, model: string) =>
    ipcRenderer.invoke(channels.CONVERSATIONS_CREATE, { profileId, model }),
  updateConversation: (data: any) =>
    ipcRenderer.invoke(channels.CONVERSATIONS_UPDATE, data),
  deleteConversation: (id: string) =>
    ipcRenderer.invoke(channels.CONVERSATIONS_DELETE, { id }),
  searchConversations: (query: string) =>
    ipcRenderer.invoke(channels.CONVERSATIONS_SEARCH, { query }),

  // Messages
  listMessages: (conversationId: string) =>
    ipcRenderer.invoke(channels.MESSAGES_LIST, { conversationId }),
  exportMessages: (conversationId: string, format: 'markdown' | 'json') =>
    ipcRenderer.invoke(channels.MESSAGES_EXPORT, { conversationId, format }),

  // Profiles
  listProfiles: () =>
    ipcRenderer.invoke(channels.PROFILES_LIST),
  getProfile: (id: string) =>
    ipcRenderer.invoke(channels.PROFILES_GET, { id }),
  createProfile: (data: any) =>
    ipcRenderer.invoke(channels.PROFILES_CREATE, data),
  updateProfile: (data: any) =>
    ipcRenderer.invoke(channels.PROFILES_UPDATE, data),
  deleteProfile: (id: string) =>
    ipcRenderer.invoke(channels.PROFILES_DELETE, { id }),
  setActiveProfile: (id: string) =>
    ipcRenderer.invoke(channels.PROFILES_SET_ACTIVE, { id }),

  // Files
  selectFiles: (mode: 'file' | 'directory', filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke(channels.FILES_SELECT, { mode, filters }),
  readFiles: (paths: string[]) =>
    ipcRenderer.invoke(channels.FILES_READ, { paths }),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke(channels.FILES_WRITE, { path: filePath, content }),
  listDirectory: (dirPath: string) =>
    ipcRenderer.invoke(channels.FILES_LIST_DIR, { path: dirPath }),
  searchFiles: (pattern: string, searchPath: string) =>
    ipcRenderer.invoke(channels.FILES_SEARCH, { pattern, path: searchPath }),

  // Terminal
  execCommand: (command: string, cwd?: string) =>
    ipcRenderer.invoke(channels.TERMINAL_EXEC, { command, cwd }),
  approveCommand: (command: string, cwd?: string) =>
    ipcRenderer.invoke(channels.TERMINAL_APPROVE, { command, cwd }),

  // Review
  startReview: (input: any) =>
    ipcRenderer.invoke(channels.REVIEW_START, input),
  onReviewStreamToken: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload)
    ipcRenderer.on(channels.REVIEW_STREAM_TOKEN, handler)
    return () => ipcRenderer.removeListener(channels.REVIEW_STREAM_TOKEN, handler)
  },
  onReviewStreamDone: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload)
    ipcRenderer.on(channels.REVIEW_STREAM_DONE, handler)
    return () => ipcRenderer.removeListener(channels.REVIEW_STREAM_DONE, handler)
  },
  onReviewStreamError: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload)
    ipcRenderer.on(channels.REVIEW_STREAM_ERROR, handler)
    return () => ipcRenderer.removeListener(channels.REVIEW_STREAM_ERROR, handler)
  },

  // Context
  onContextUpdate: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload)
    ipcRenderer.on(channels.CONTEXT_UPDATE, handler)
    return () => ipcRenderer.removeListener(channels.CONTEXT_UPDATE, handler)
  },
  onFileModified: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload)
    ipcRenderer.on(channels.FILE_MODIFIED, handler)
    return () => ipcRenderer.removeListener(channels.FILE_MODIFIED, handler)
  },

  // Settings
  getSetting: (key: string) =>
    ipcRenderer.invoke(channels.SETTINGS_GET, { key }),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke(channels.SETTINGS_SET, { key, value })
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
export type ElectronAPI = typeof electronAPI
