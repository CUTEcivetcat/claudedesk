import OpenAI from 'openai'
import type { AiProvider, StreamCallbacks, ChatOptions } from '../types'
import type { ChatMessage } from '../../../shared/types'

export class OpenAIProvider implements AiProvider {
  streamChat(
    messages: ChatMessage[],
    options: ChatOptions,
    callbacks: StreamCallbacks
  ): { abort: () => void } {
    const client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.endpoint || undefined
    })

    const controller = new AbortController()
    let isAborted = false

    const openaiMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }))

    // Convert tools to OpenAI format
    const openaiTools = options.tools?.map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema
      }
    }))

    ;(async () => {
      try {
        const stream = await client.chat.completions.create({
          model: options.model,
          messages: openaiMessages,
          max_tokens: options.maxTokens,
          stream: true,
          ...(openaiTools && openaiTools.length > 0 ? { tools: openaiTools } : {})
        }, { signal: controller.signal })

        let fullContent = ''
        let inputTokens = 0
        let outputTokens = 0

        // Track tool calls being built across chunks
        const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>()

        for await (const chunk of stream) {
          if (isAborted) break

          const delta = chunk.choices[0]?.delta

          // Text content
          if (delta?.content) {
            fullContent += delta.content
            callbacks.onToken(delta.content, 'text')
          }

          // Tool calls in delta
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index
              if (!toolCallsMap.has(idx)) {
                toolCallsMap.set(idx, {
                  id: tc.id || `tool-${idx}`,
                  name: tc.function?.name || '',
                  arguments: ''
                })
              }
              const entry = toolCallsMap.get(idx)!
              if (tc.id) entry.id = tc.id
              if (tc.function?.name) entry.name = tc.function.name
              if (tc.function?.arguments) entry.arguments += tc.function.arguments
            }
          }

          // Usage in last chunk
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens || 0
            outputTokens = chunk.usage.completion_tokens || 0
          }
        }

        // Emit completed tool calls
        for (const [, tc] of toolCallsMap) {
          try {
            const input = JSON.parse(tc.arguments || '{}')
            if (callbacks.onToolUse) {
              callbacks.onToolUse({ id: tc.id, name: tc.name, input })
            }
            callbacks.onToken(
              JSON.stringify({ tool: tc.name, id: tc.id, input }),
              'tool_call'
            )
          } catch {
            // ignore parse error
          }
        }

        if (!isAborted) {
          callbacks.onComplete({ inputTokens, outputTokens })
        }
      } catch (error: any) {
        if (!isAborted) {
          callbacks.onError(error instanceof Error ? error : new Error(String(error)))
        }
      }
    })()

    return {
      abort: () => {
        isAborted = true
        controller.abort()
      }
    }
  }

  countTokens(messages: ChatMessage[], _model: string): number {
    let total = 0
    for (const msg of messages) {
      total += Math.ceil(msg.content.length / 4)
    }
    return total
  }

  getContextWindow(model: string): number {
    const windows: Record<string, number> = {
      'gpt-4o': 128000, 'gpt-4o-mini': 128000,
      'gpt-4-turbo': 128000, 'gpt-4': 8192,
      'gpt-3.5-turbo': 16385, 'o1': 200000, 'o1-mini': 128000,
    }
    return windows[model] || 128000
  }
}
