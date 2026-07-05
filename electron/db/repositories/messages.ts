import { v4 as uuidv4 } from 'uuid'
import { getDatabase, saveDatabase } from '../connection'
import type { Message, MessageRole } from '../../../shared/types'

function rowToMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id || '',
    role: row.role as MessageRole,
    content: row.content || '',
    inputTokens: row.input_tokens ?? null,
    outputTokens: row.output_tokens ?? null,
    model: row.model || null,
    metadata: row.metadata || '{}',
    createdAt: row.created_at || ''
  }
}

export function getMessagesByConversation(conversationId: string): Message[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
  stmt.bind([conversationId])
  const messages: Message[] = []
  while (stmt.step()) {
    messages.push(rowToMessage(stmt.getAsObject()))
  }
  stmt.free()
  return messages
}

export function createMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  opts?: { model?: string; metadata?: string }
): Message {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO messages (id, conversation_id, role, content, model, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, conversationId, role, content, opts?.model || null, opts?.metadata || '{}', now]
  )
  saveDatabase()
  return getMessageById(id)!
}

function getMessageById(messageId: string): Message | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM messages WHERE id = ?')
  stmt.bind([messageId])
  let msg: Message | undefined
  if (stmt.step()) {
    msg = rowToMessage(stmt.getAsObject())
  }
  stmt.free()
  return msg
}

export function updateMessageContent(messageId: string, content: string): void {
  const db = getDatabase()
  db.run('UPDATE messages SET content = ? WHERE id = ?', [content, messageId])
  saveDatabase()
}

export function updateMessageTokens(messageId: string, inputTokens: number, outputTokens: number): void {
  const db = getDatabase()
  db.run('UPDATE messages SET input_tokens = ?, output_tokens = ? WHERE id = ?',
    [inputTokens, outputTokens, messageId])
  saveDatabase()
}

export function deleteMessage(messageId: string): boolean {
  const db = getDatabase()
  const before = countMessages()
  db.run('DELETE FROM messages WHERE id = ?', [messageId])
  saveDatabase()
  return countMessages() < before
}

function countMessages(): number {
  const db = getDatabase()
  const stmt = db.prepare('SELECT COUNT(*) as count FROM messages')
  let count = 0
  if (stmt.step()) {
    count = stmt.getAsObject().count as number
  }
  stmt.free()
  return count
}
