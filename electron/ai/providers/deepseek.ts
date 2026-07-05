import OpenAI from 'openai'
import type { AiProvider, StreamCallbacks, ChatOptions } from '../types'
import type { ChatMessage } from '../../../shared/types'

/**
 * DeepSeek provider — OpenAI-compatible API with tool calling support
 */
export class DeepSeekProvider implements AiProvider {
  streamChat(
    messages: ChatMessage[],
    options: ChatOptions,
    callbacks: StreamCallbacks
  ): { abort: () => void } {
    const client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.endpoint || 'https://api.deepseek.com/v1'
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

        let inputTokens = 0
        let outputTokens = 0
        const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>()

        for await (const chunk of stream) {
          if (isAborted) break

          const delta = chunk.choices[0]?.delta

          if (delta?.content) {
            callbacks.onToken(delta.content, 'text')
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index
              if (!toolCallsMap.has(idx)) {
                toolCallsMap.set(idx, { id: tc.id || `tool-${idx}`, name: tc.function?.name || '', arguments: '' })
              }
              const entry = toolCallsMap.get(idx)!
              if (tc.id) entry.id = tc.id
              if (tc.function?.name) entry.name = tc.function.name
              if (tc.function?.arguments) entry.arguments += tc.function.arguments
            }
          }

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
            callbacks.onToken(JSON.stringify({ tool: tc.name, id: tc.id, input }), 'tool_call')
          } catch { /* ignore */ }
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
    for (const msg of messages) { total += Math.ceil(msg.content.length / 4) }
    return total
  }

  getContextWindow(model: string): number {
    const windows: Record<string, number> = {
      'deepseek-chat': 128000, 'deepseek-coder': 128000, 'deepseek-reasoner': 64000,
    }
    return windows[model] || 128000
  }
}
