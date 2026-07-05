import { ipcMain, BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import * as channels from '../../shared/ipc-channels'
import type { StartReviewInput } from '../../shared/types'
import { createProvider } from '../ai/provider-factory'
import { decryptApiKey } from '../security/safe-storage'
import { getConversationById } from '../db/repositories/conversations'
import { getProfileById } from '../db/repositories/profiles'

export function registerReviewHandlers(): void {
  ipcMain.handle(channels.REVIEW_START, async (_event, input: StartReviewInput) => {
    try {
      const { conversationId, files, prompt } = input

      const conversation = getConversationById(conversationId)
      if (!conversation) {
        return { success: false, error: 'Conversation not found' }
      }

      const profile = getProfileById(conversation.profileId)
      if (!profile || !profile.apiKeyEncrypted) {
        return { success: false, error: 'Profile not found or no API key configured' }
      }

      // Decrypt API key (profile.apiKeyEncrypted is a Buffer)
      const buf = profile.apiKeyEncrypted
      if (!buf || (Buffer.isBuffer(buf) && buf.length === 0)) {
        return { success: false, error: 'No API key found in profile' }
      }
      const apiKey = decryptApiKey(buf)
      const provider = createProvider(profile.provider)

      const window = BrowserWindow.getFocusedWindow()
      if (!window) {
        return { success: false, error: 'No active window' }
      }

      const sessionId = uuidv4()

      // Build review prompt with file contents
      const fileContents = files.map(f =>
        `### File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``
      ).join('\n\n')

      const reviewPrompt = `You are a code reviewer. ${prompt || 'Please review the following code for bugs, security issues, performance problems, and code style improvements.'}\n\nHere are the files to review:\n\n${fileContents}`

      let fullContent = ''

      provider.streamChat(
        [{ role: 'user', content: reviewPrompt }],
        {
          model: conversation.model,
          maxTokens: profile.defaultMaxTokens,
          apiKey,
          endpoint: profile.endpoint || undefined
        },
        {
          onToken: (token: string) => {
            fullContent += token
            window.webContents.send(channels.REVIEW_STREAM_TOKEN, {
              sessionId,
              token
            })
          },
          onComplete: (_usage) => {
            window.webContents.send(channels.REVIEW_STREAM_DONE, {
              sessionId,
              fullContent
            })
          },
          onError: (error) => {
            window.webContents.send(channels.REVIEW_STREAM_ERROR, {
              sessionId,
              error: error.message
            })
          }
        }
      )

      return { success: true, data: { sessionId } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
