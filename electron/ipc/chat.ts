import { ipcMain, BrowserWindow } from 'electron'
import * as channels from '../../shared/ipc-channels'
import type { SendMessageInput } from '../../shared/types'
import { createProvider } from '../ai/provider-factory'
import { getContextWindowSize, estimateCost } from '../ai/token-helpers'
import { decryptApiKey } from '../security/safe-storage'
import { getProfileById } from '../db/repositories/profiles'
import { getConversationById, incrementMessageCount, addTokenUsage } from '../db/repositories/conversations'
import { createMessage, updateMessageContent, updateMessageTokens, getMessagesByConversation } from '../db/repositories/messages'
import { TOOL_DEFINITIONS } from '../tools/tool-definitions'
import { executeToolCall } from '../tools/tool-executor'
import type { ToolCall, ToolResult } from '../tools/tool-executor'

const activeStreams = new Map<string, { abort: () => void }>()

function decryptKey(profile: any): string {
  // profile.apiKeyEncrypted is a Buffer (decoded from base64)
  const buf = profile.apiKeyEncrypted
  if (!buf || (Buffer.isBuffer(buf) && buf.length === 0)) {
    throw new Error('No API key found in profile')
  }
  return decryptApiKey(buf)
}

export function registerChatHandlers(): void {
  ipcMain.handle(channels.CHAT_SEND, async (_event, input: SendMessageInput) => {
    try {
      const { conversationId, content, attachments } = input

      const conversation = getConversationById(conversationId)
      if (!conversation) {
        console.error('[Chat] Conversation not found:', conversationId)
        return { success: false, error: 'Conversation not found' }
      }

      console.log('[Chat] conversation found:', { id: conversation.id, profileId: conversation.profileId, model: conversation.model })

      const profile = getProfileById(conversation.profileId)
      if (!profile) {
        console.error('[Chat] Profile not found for profileId:', conversation.profileId)
        return { success: false, error: `Profile not found: ${conversation.profileId}` }
      }
      if (!profile.apiKeyEncrypted) {
        console.error('[Chat] Profile has no API key:', profile.id, profile.name)
        return { success: false, error: 'Profile has no API key configured' }
      }

      console.log('[Chat] profile found:', { id: profile.id, name: profile.name, hasKey: !!profile.apiKeyEncrypted, keyType: typeof profile.apiKeyEncrypted, keyLen: profile.apiKeyEncrypted?.length })

      // Build user content with @file references resolved
      const resolvedContent = await resolveFileReferences(content)
      const userContent = attachments?.length
        ? resolvedContent + '\n\n' + attachments.join('\n\n')
        : resolvedContent

      createMessage(conversationId, 'user', userContent)
      incrementMessageCount(conversationId)

      const apiKey = decryptKey(profile)
      const provider = createProvider(profile.provider)
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return { success: false, error: 'No active window' }

      // Build initial messages from history
      let chatMessages = buildChatMessages(conversationId)

      // --- Tool Use Loop ---
      let totalInputTokens = 0
      let totalOutputTokens = 0
      let finalContent = ''
      let isAborted = false

      const MAX_TOOL_ROUNDS = 15

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        if (isAborted) break

        const aiMessageId = round === 0
          ? createMessage(conversationId, 'assistant', '', { model: conversation.model }).id
          : `tool-round-${round}`

        // We need to accumulate content for THIS round
        const roundContent: { text: string; toolCalls: ToolCall[] } = {
          text: '',
          toolCalls: []
        }

        await new Promise<void>((resolve, reject) => {
          const { abort } = provider.streamChat(
            chatMessages,
            {
              model: conversation.model,
              maxTokens: profile.defaultMaxTokens,
              apiKey,
              endpoint: profile.endpoint || undefined,
              tools: TOOL_DEFINITIONS
            },
            {
              onToken: (token: string, type: string) => {
                if (type === 'text') {
                  roundContent.text += token
                  finalContent += token
                  window.webContents.send(channels.CHAT_STREAM_TOKEN, {
                    conversationId,
                    messageId: aiMessageId,
                    token,
                    type: 'text'
                  })
                }
              },
              onToolUse: (toolCall: ToolCall) => {
                roundContent.toolCalls.push(toolCall)
                // Notify renderer about tool use
                window.webContents.send(channels.CHAT_STREAM_TOKEN, {
                  conversationId,
                  messageId: aiMessageId,
                  token: JSON.stringify({ tool: toolCall.name, input: toolCall.input }),
                  type: 'tool_call'
                })
              },
              onComplete: (usage) => {
                totalInputTokens += usage.inputTokens
                totalOutputTokens += usage.outputTokens
                resolve()
              },
              onError: (error) => {
                reject(error)
              }
            }
          )

          if (round === 0) {
            activeStreams.set(conversationId, { abort })
          }
        })

        // If no tool calls, we're done
        if (roundContent.toolCalls.length === 0) {
          break
        }

        // Execute tool calls and prepare results
        const toolResults: ToolResult[] = []
        for (const tc of roundContent.toolCalls) {
          window.webContents.send(channels.CHAT_STREAM_TOKEN, {
            conversationId,
            messageId: aiMessageId,
            token: `Executing: ${tc.name}(${JSON.stringify(tc.input)})...`,
            type: 'tool_executing'
          })

          const result = await executeToolCall(tc, input.workingDirectory)
          toolResults.push(result)

          // If a file was written, notify the renderer to refresh
          if (tc.name === 'write_file' && !result.is_error) {
            window.webContents.send(channels.FILE_MODIFIED, {
              path: tc.input.path,
              content: tc.input.content
            })
          }

          window.webContents.send(channels.CHAT_STREAM_TOKEN, {
            conversationId,
            messageId: aiMessageId,
            token: result.is_error ? `❌ ${result.content.slice(0, 200)}` : `✅ ${result.content.slice(0, 200)}`,
            type: 'tool_result'
          })
        }

        // Append assistant message (with tool calls) and tool results to chat
        const assistantContent = roundContent.text +
          roundContent.toolCalls.map(tc =>
            `\n[Tool Call: ${tc.name}(${JSON.stringify(tc.input)})]`
          ).join('')

        chatMessages.push({ role: 'assistant', content: assistantContent })

        // Add tool results as user messages (Anthropic expects tool results as user content)
        const toolResultContent = toolResults.map(tr =>
          `[Tool Result for ${tr.tool_use_id}]:\n${tr.content}`
        ).join('\n\n')

        chatMessages.push({ role: 'user', content: toolResultContent })
      }

      // Save final message
      if (finalContent) {
        const msgs = getMessagesByConversation(conversationId)
        const lastAiMsg = [...msgs].reverse().find(m => m.role === 'assistant' && !m.content)
        if (lastAiMsg) {
          updateMessageContent(lastAiMsg.id, finalContent)
          updateMessageTokens(lastAiMsg.id, totalInputTokens, totalOutputTokens)
        }
      }

      addTokenUsage(conversationId, totalInputTokens, totalOutputTokens)
      const budget = getContextWindowSize(conversation.model)
      const cost = estimateCost(conversation.model, totalInputTokens, totalOutputTokens)

      activeStreams.delete(conversationId)

      window.webContents.send(channels.CHAT_STREAM_DONE, {
        conversationId,
        messageId: 'complete',
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        fullContent: finalContent
      })

      window.webContents.send(channels.CONTEXT_UPDATE, {
        conversationId,
        usedTokens: totalInputTokens + totalOutputTokens,
        budgetTokens: budget,
        percentUsed: Math.round(((totalInputTokens + totalOutputTokens) / budget) * 100),
        cost
      })

      return { success: true, data: { messageId: 'complete' } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.CHAT_ABORT, async (_event, conversationId: string) => {
    const stream = activeStreams.get(conversationId)
    if (stream) {
      stream.abort()
      activeStreams.delete(conversationId)
      return { success: true }
    }
    return { success: false, error: 'No active stream for this conversation' }
  })
}

function buildChatMessages(conversationId: string): Array<{ role: string; content: string }> {
  const history = getMessagesByConversation(conversationId)
  return history.map(m => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content
  }))
}

/**
 * Parse @filepath references in user input and replace with file contents.
 */
async function resolveFileReferences(text: string): Promise<string> {
  const fileRefRegex = /@([^\s]+)/g
  const matches = [...text.matchAll(fileRefRegex)]
  if (matches.length === 0) return text

  let result = text
  for (const match of matches) {
    const filePath = match[1]
    try {
      const { readFileSync, existsSync, statSync } = await import('fs')
      const absPath = filePath // Use as-is; user should provide absolute or relative to cwd
      if (existsSync(absPath) && !statSync(absPath).isDirectory()) {
        const content = readFileSync(absPath, 'utf-8')
        const lines = content.split('\n')
        if (lines.length <= 100) {
          result = result.replace(match[0], `\n--- File: ${filePath} ---\n${content}\n--- End File ---\n`)
        } else {
          result = result.replace(match[0], `\n--- File: ${filePath} (${lines.length} lines) ---\n${lines.slice(0, 100).join('\n')}\n... (truncated)\n--- End File ---\n`)
        }
      }
    } catch { /* ignore; leave @reference as-is */ }
  }
  return result
}
