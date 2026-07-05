import type { ChatMessage } from '../../shared/types'

export interface StreamCallbacks {
  onToken: (token: string, type: 'text' | 'thinking' | 'tool_call') => void
  onToolUse?: (toolCall: { id: string; name: string; input: Record<string, any> }) => void
  onComplete: (usage: { inputTokens: number; outputTokens: number }) => void
  onError: (error: Error) => void
}

export interface ChatOptions {
  model: string
  maxTokens: number
  apiKey: string
  endpoint?: string
  systemPrompt?: string
  tools?: Array<{
    name: string
    description: string
    input_schema: Record<string, any>
  }>
}

export interface AiProvider {
  /** Stream a chat completion. Returns an abort controller. */
  streamChat(
    messages: ChatMessage[],
    options: ChatOptions,
    callbacks: StreamCallbacks
  ): { abort: () => void }

  /** Estimate token count for messages */
  countTokens(messages: ChatMessage[], model: string): number

  /** Get the context window size for a model */
  getContextWindow(model: string): number
}
