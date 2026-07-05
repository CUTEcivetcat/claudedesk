// ===== Provider Profiles =====
export type ProviderType = 'anthropic' | 'openai' | 'deepseek' | 'custom'

export interface Profile {
  id: string
  name: string
  provider: ProviderType
  apiKeyEncrypted: Buffer | null
  endpoint: string
  defaultModel: string
  defaultMaxTokens: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// What the renderer receives (NEVER contains the raw API key)
export interface ProfilePublic {
  id: string
  name: string
  provider: ProviderType
  endpoint: string
  defaultModel: string
  defaultMaxTokens: number
  isActive: boolean
  hasKey: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProfileInput {
  name: string
  provider: ProviderType
  apiKey: string
  endpoint?: string
  defaultModel?: string
  defaultMaxTokens?: number
}

export interface UpdateProfileInput {
  id: string
  name?: string
  provider?: ProviderType
  apiKey?: string
  endpoint?: string
  defaultModel?: string
  defaultMaxTokens?: number
}

// ===== Conversations =====
export interface Conversation {
  id: string
  title: string
  profileId: string
  model: string
  totalInputTokens: number
  totalOutputTokens: number
  messageCount: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

// ===== Messages =====
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  inputTokens: number | null
  outputTokens: number | null
  model: string | null
  metadata: string // JSON: { thinking?, tool_calls?, citations? }
  createdAt: string
}

// ===== Chat =====
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamTokenPayload {
  conversationId: string
  messageId: string
  token: string
  type: 'text' | 'thinking' | 'tool_call'
}

export interface StreamDonePayload {
  conversationId: string
  messageId: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
  fullContent: string
}

export interface StreamErrorPayload {
  conversationId: string
  error: string
  code: string
}

export interface SendMessageInput {
  conversationId: string
  content: string
  attachments?: string[]
  workingDirectory?: string
}

// ===== Code Review =====
export interface ReviewSession {
  id: string
  conversationId: string
  title: string
  files: string // JSON: { path, content, language }[]
  reviewPrompt: string
  results: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  createdAt: string
  updatedAt: string
}

export interface ReviewFile {
  path: string
  content: string
  language: string
}

export interface StartReviewInput {
  conversationId: string
  files: ReviewFile[]
  prompt: string
}

// ===== Context / Token Budget =====
export interface ContextBudgetUpdate {
  conversationId: string
  usedTokens: number
  budgetTokens: number
  percentUsed: number
}

// ===== IPC Response Wrappers =====
export interface IpcResult<T> {
  success: boolean
  data?: T
  error?: string
}
