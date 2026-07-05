import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'fs'
import * as channels from '../../shared/ipc-channels'
import {
  getConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
  searchConversations
} from '../db/repositories/conversations'
import { getMessagesByConversation } from '../db/repositories/messages'

export function registerConversationHandlers(): void {
  ipcMain.handle(channels.CONVERSATIONS_LIST, async (_event, opts) => {
    try {
      const conversations = getConversations(opts)
      return { success: true, data: conversations }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.CONVERSATIONS_GET, async (_event, { id }) => {
    try {
      const conversation = getConversationById(id)
      return { success: true, data: conversation || null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.CONVERSATIONS_CREATE, async (_event, { profileId, model }) => {
    try {
      const conversation = createConversation(profileId, model)
      return { success: true, data: conversation }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.CONVERSATIONS_UPDATE, async (_event, data) => {
    try {
      const conversation = updateConversation(data.id, data)
      return { success: true, data: conversation }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.CONVERSATIONS_DELETE, async (_event, { id }) => {
    try {
      deleteConversation(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.CONVERSATIONS_SEARCH, async (_event, { query }) => {
    try {
      const results = searchConversations(query)
      return { success: true, data: results }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.MESSAGES_LIST, async (_event, { conversationId }) => {
    try {
      const messages = getMessagesByConversation(conversationId)
      return { success: true, data: messages }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.MESSAGES_EXPORT, async (_event, { conversationId, format }) => {
    try {
      const conversation = getConversationById(conversationId)
      const messages = getMessagesByConversation(conversationId)

      let content = ''
      let defaultExt = ''

      if (format === 'markdown') {
        content = `# ${conversation?.title || 'Conversation'}\n\n`
        content += `Date: ${conversation?.createdAt || 'Unknown'}\n`
        content += `Model: ${conversation?.model || 'Unknown'}\n\n---\n\n`
        for (const msg of messages) {
          content += `### ${msg.role.toUpperCase()}\n\n${msg.content}\n\n---\n\n`
        }
        defaultExt = 'md'
      } else {
        content = JSON.stringify({ conversation, messages }, null, 2)
        defaultExt = 'json'
      }

      const window = BrowserWindow.getFocusedWindow()
      if (!window) {
        return { success: false, error: 'No active window' }
      }

      const result = await dialog.showSaveDialog(window, {
        title: 'Export Conversation',
        defaultPath: `${conversation?.title || 'conversation'}.${defaultExt}`,
        filters: [
          format === 'markdown'
            ? { name: 'Markdown', extensions: ['md'] }
            : { name: 'JSON', extensions: ['json'] }
        ]
      })

      if (!result.canceled && result.filePath) {
        writeFileSync(result.filePath, content, 'utf-8')
        return { success: true, data: { filePath: result.filePath } }
      }

      return { success: true, data: null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
