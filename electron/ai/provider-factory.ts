import type { AiProvider } from './types'
import type { ProviderType } from '../../shared/types'
import { AnthropicProvider } from './providers/anthropic'
import { OpenAIProvider } from './providers/openai'
import { DeepSeekProvider } from './providers/deepseek'
import { CustomProvider } from './providers/custom'

export function createProvider(type: ProviderType): AiProvider {
  switch (type) {
    case 'anthropic':
      return new AnthropicProvider()
    case 'openai':
      return new OpenAIProvider()
    case 'deepseek':
      return new DeepSeekProvider()
    case 'custom':
      return new CustomProvider()
    default:
      throw new Error(`Unknown provider type: ${type}`)
  }
}
