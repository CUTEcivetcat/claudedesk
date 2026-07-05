import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Message } from '../../shared/types'

export interface ToolCallEntry {
  id: string
  toolName: string
  toolInput: Record<string, any>
  result?: string
  isError?: boolean
  isExecuting?: boolean
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const isLoadingMessages = ref(false)

  // Streaming state
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const streamingMessageId = ref<string | null>(null)
  const streamingThinking = ref('')

  // Tool calls during streaming
  const toolCalls = ref<ToolCallEntry[]>([])

  // Context state
  const usedTokens = ref(0)
  const budgetTokens = ref(200000)
  const percentUsed = ref(0)
  const estimatedCost = ref(0)

  async function loadMessages(conversationId: string) {
    isLoadingMessages.value = true
    try {
      const result = await window.electronAPI.listMessages(conversationId)
      if (result.success && result.data) {
        messages.value = result.data
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      isLoadingMessages.value = false
    }
  }

  async function sendMessage(conversationId: string, content: string, workingDirectory?: string) {
    isStreaming.value = true
    streamingContent.value = ''
    streamingThinking.value = ''
    toolCalls.value = []

    const result = await window.electronAPI.sendMessage({ conversationId, content, workingDirectory })
    if (!result.success) {
      isStreaming.value = false
      throw new Error(result.error || 'Failed to send message')
    }
    streamingMessageId.value = result.data?.messageId || null

    await loadMessages(conversationId)
  }

  function appendToken(token: string, type: string) {
    if (type === 'thinking') {
      streamingThinking.value += token
    } else if (type === 'tool_call') {
      // Parse tool call token
      try {
        const toolData = JSON.parse(token)
        if (toolData.tool && toolData.input) {
          toolCalls.value.push({
            id: toolData.id || `tool-${Date.now()}`,
            toolName: toolData.tool,
            toolInput: toolData.input,
            isExecuting: true
          })
        }
      } catch { /* ignore malformed tool data */ }
    } else if (type === 'tool_executing') {
      // Update last tool call status
      const last = toolCalls.value[toolCalls.value.length - 1]
      if (last) last.isExecuting = true
    } else if (type === 'tool_result') {
      const last = toolCalls.value[toolCalls.value.length - 1]
      if (last) {
        last.isExecuting = false
        last.result = token
        last.isError = token.startsWith('❌')
      }
    } else {
      streamingContent.value += token
    }
  }

  function finalizeStream() {
    isStreaming.value = false
    streamingMessageId.value = null

    if (streamingContent.value) {
      messages.value.push({
        id: 'temp-' + Date.now(),
        conversationId: '',
        role: 'assistant',
        content: streamingContent.value,
        inputTokens: null,
        outputTokens: null,
        model: null,
        metadata: JSON.stringify({ toolCalls: toolCalls.value }),
        createdAt: new Date().toISOString()
      })
    }

    streamingContent.value = ''
    streamingThinking.value = ''
    toolCalls.value = []
  }

  function abortStream() {
    isStreaming.value = false
    streamingContent.value = ''
    streamingThinking.value = ''
    streamingMessageId.value = null
    toolCalls.value = []
  }

  function updateContext(used: number, budget: number, percent: number, cost: number) {
    usedTokens.value = used
    budgetTokens.value = budget
    percentUsed.value = percent
    estimatedCost.value = cost
  }

  function resetContext() {
    usedTokens.value = 0
    budgetTokens.value = 200000
    percentUsed.value = 0
    estimatedCost.value = 0
  }

  return {
    messages,
    isLoadingMessages,
    isStreaming,
    streamingContent,
    streamingMessageId,
    streamingThinking,
    toolCalls,
    usedTokens,
    budgetTokens,
    percentUsed,
    estimatedCost,
    loadMessages,
    sendMessage,
    appendToken,
    finalizeStream,
    abortStream,
    updateContext,
    resetContext
  }
})
