import { registerChatHandlers } from './chat'
import { registerConversationHandlers } from './conversations'
import { registerProfileHandlers } from './profiles'
import { registerFileHandlers } from './files'
import { registerReviewHandlers } from './review'

export function registerAllIpcHandlers(): void {
  registerChatHandlers()
  registerConversationHandlers()
  registerProfileHandlers()
  registerFileHandlers()
  registerReviewHandlers()
}
