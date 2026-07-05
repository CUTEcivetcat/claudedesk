/**
 * Pricing per 1M tokens (USD)
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-sonnet-4-6-20250708': { input: 3, output: 15 },
  'claude-opus-4-20250514': { input: 15, output: 75 },
  'claude-opus-4-8-20251101': { input: 15, output: 75 },
  'claude-haiku-3-5-20241022': { input: 0.8, output: 4 },
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  // DeepSeek
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-coder': { input: 0.14, output: 0.28 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
}

/**
 * Calculate estimated cost in USD for given token usage
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0

  return (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
}

/**
 * Get context window size for a given model
 */
export function getContextWindowSize(model: string): number {
  const windows: Record<string, number> = {
    // Anthropic
    'claude-sonnet-4-20250514': 200000,
    'claude-sonnet-4-6-20250708': 200000,
    'claude-opus-4-20250514': 200000,
    'claude-opus-4-8-20251101': 200000,
    'claude-haiku-3-5-20241022': 200000,
    // OpenAI
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-4-turbo': 128000,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 16385,
    'o1': 200000,
    'o1-mini': 128000,
    // DeepSeek
    'deepseek-chat': 128000,
    'deepseek-coder': 128000,
    'deepseek-reasoner': 64000,
  }
  return windows[model] || 128000
}
