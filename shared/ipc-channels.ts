// All IPC channel name constants — single source of truth

// Chat
export const CHAT_SEND = 'chat:send'
export const CHAT_STREAM_TOKEN = 'chat:stream-token'
export const CHAT_STREAM_DONE = 'chat:stream-done'
export const CHAT_STREAM_ERROR = 'chat:stream-error'
export const CHAT_ABORT = 'chat:abort'

// Conversations
export const CONVERSATIONS_LIST = 'conversations:list'
export const CONVERSATIONS_GET = 'conversations:get'
export const CONVERSATIONS_CREATE = 'conversations:create'
export const CONVERSATIONS_UPDATE = 'conversations:update'
export const CONVERSATIONS_DELETE = 'conversations:delete'
export const CONVERSATIONS_SEARCH = 'conversations:search'

// Messages
export const MESSAGES_LIST = 'messages:list'
export const MESSAGES_EXPORT = 'messages:export'

// Profiles
export const PROFILES_LIST = 'profiles:list'
export const PROFILES_GET = 'profiles:get'
export const PROFILES_CREATE = 'profiles:create'
export const PROFILES_UPDATE = 'profiles:update'
export const PROFILES_DELETE = 'profiles:delete'
export const PROFILES_SET_ACTIVE = 'profiles:set-active'

// Files
export const FILES_SELECT = 'files:select'
export const FILES_READ = 'files:read'
export const FILES_WRITE = 'files:write'
export const FILES_LIST_DIR = 'files:list-dir'
export const FILES_SEARCH = 'files:search'

// Terminal / Command Execution
export const TERMINAL_EXEC = 'terminal:exec'
export const TERMINAL_APPROVE = 'terminal:approve'

// Review
export const REVIEW_START = 'review:start'
export const REVIEW_STREAM_TOKEN = 'review:stream-token'
export const REVIEW_STREAM_DONE = 'review:stream-done'
export const REVIEW_STREAM_ERROR = 'review:stream-error'

// Context
export const CONTEXT_UPDATE = 'context:update'

// File Modified (AI wrote/edited a file)
export const FILE_MODIFIED = 'file:modified'

// Settings
export const SETTINGS_GET = 'settings:get'
export const SETTINGS_SET = 'settings:set'
