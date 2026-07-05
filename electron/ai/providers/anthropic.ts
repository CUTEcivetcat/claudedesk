import Anthropic from '@anthropic-ai/sdk'
import type { AiProvider, StreamCallbacks, ChatOptions } from '../types'
import type { ChatMessage } from '../../../shared/types'

export class AnthropicProvider implements AiProvider {
  streamChat(
    messages: ChatMessage[],
    options: ChatOptions,
    callbacks: StreamCallbacks
  ): { abort: () => void } {
    const client = new Anthropic({ apiKey: options.apiKey, baseURL: options.endpoint })

    const systemMessages = messages.filter(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const systemPrompt = options.systemPrompt ||
      systemMessages.map(m => m.content).join('\n') ||
      undefined

    const anthropicMessages = this.convertMessages(chatMessages)

    let isAborted = false

    // Build tool definitions for Anthropic format
    const tools = options.tools?.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema
    }))

    // Track current tool use being built across stream events
    let currentToolUse: { id: string; name: string; input_json: string } | null = null

    const stream = client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens,
      system: systemPrompt || undefined,
      messages: anthropicMessages as any,
      ...(tools && tools.length > 0 ? { tools: tools as any } : {}),
    })

    // Text deltas
    stream.on('text', (text: string) => {
      if (!isAborted) callbacks.onToken(text, 'text')
    })

    // Catch all stream events for tool use and thinking
    stream.on('streamEvent', (event: any) => {
      if (isAborted) return

      // Thinking events
      if (event.type === 'thinking_delta') {
        callbacks.onToken(event.thinking || '', 'thinking')
      }

      // Tool use: content block start
      if (event.type === 'content_block_start') {
        const block = event.content_block
        if (block?.type === 'tool_use') {
          currentToolUse = {
            id: block.id,
            name: block.name,
            input_json: ''
          }
        }
      }

      // Tool use: input json delta
      if (event.type === 'input_json_delta' && currentToolUse) {
        currentToolUse.input_json += event.delta?.partial_json || ''
      }

      // Tool use: content block stop
      if (event.type === 'content_block_stop' && currentToolUse) {
        try {
          const input = JSON.parse(currentToolUse.input_json || '{}')
          if (callbacks.onToolUse) {
            callbacks.onToolUse({
              id: currentToolUse.id,
              name: currentToolUse.name,
              input
            })
          }
          callbacks.onToken(
            JSON.stringify({ tool: currentToolUse.name, id: currentToolUse.id, input }),
            'tool_call'
          )
        } catch {
          // ignore parse errors
        }
        currentToolUse = null
      }
    })

    // Final message with usage
    stream.on('message', (message: any) => {
      if (!isAborted) {
        callbacks.onComplete({
          inputTokens: message.usage?.input_tokens || 0,
          outputTokens: message.usage?.output_tokens || 0
        })
      }
    })

    // Errors
    stream.on('error', (error: any) => {
      if (!isAborted) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)))
      }
    })

    return {
      abort: () => {
        isAborted = true
        try { stream.abort() } catch { /* ignore */ }
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
      'claude-sonnet-4-20250514': 200000,
      'claude-opus-4-20250514': 200000,
      'claude-haiku-3-5-20241022': 200000,
      'claude-sonnet-4-6-20250708': 200000,
      'claude-opus-4-8-20251101': 200000,
    }
    return windows[model] || 200000
  }

  private convertMessages(messages: ChatMessage[]): any[] {
    const result: any[] = []
    for (const msg of messages) {
      if (msg.role === 'user') {
        result.push({ role: 'user', content: msg.content })
      } else if (msg.role === 'assistant') {
        result.push({ role: 'assistant', content: msg.content })
      }
    }
    return result
  }
}
