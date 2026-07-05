import { v4 as uuidv4 } from 'uuid'
import { getDatabase, saveDatabase } from '../connection'
import type { Conversation } from '../../../shared/types'

function rowToConversation(row: any): Conversation {
  return {
    id: row.id,
    title: row.title || 'New Chat',
    profileId: row.profile_id || '',
    model: row.model || '',
    totalInputTokens: row.total_input_tokens || 0,
    totalOutputTokens: row.total_output_tokens || 0,
    messageCount: row.message_count || 0,
    isArchived: !!row.is_archived,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  }
}

export function getConversations(opts: { archived?: boolean; limit?: number; offset?: number } = {}): Conversation[] {
  const db = getDatabase()
  const { archived = false, limit = 50, offset = 0 } = opts
  const stmt = db.prepare(
    'SELECT * FROM conversations WHERE is_archived = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
  )
  stmt.bind([archived ? 1 : 0, limit, offset])
  const conversations: Conversation[] = []
  while (stmt.step()) {
    conversations.push(rowToConversation(stmt.getAsObject()))
  }
  stmt.free()
  return conversations
}

export function getConversationById(id: string): Conversation | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM conversations WHERE id = ?')
  stmt.bind([id])
  let conv: Conversation | undefined
  if (stmt.step()) {
    conv = rowToConversation(stmt.getAsObject())
  }
  stmt.free()
  return conv
}

export function createConversation(profileId: string, model: string, title?: string): Conversation {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO conversations (id, title, profile_id, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title || 'New Chat', profileId, model, now, now]
  )
  saveDatabase()
  return getConversationById(id)!
}

export function updateConversation(id: string, data: Partial<Pick<Conversation, 'title' | 'isArchived'>>): Conversation | undefined {
  const db = getDatabase()
  const existing = getConversationById(id)
  if (!existing) return undefined

  const setClauses: string[] = ['updated_at = ?']
  const values: any[] = [new Date().toISOString()]

  if (data.title !== undefined) { setClauses.push('title = ?'); values.push(data.title) }
  if (data.isArchived !== undefined) { setClauses.push('is_archived = ?'); values.push(data.isArchived ? 1 : 0) }

  values.push(id)
  db.run(`UPDATE conversations SET ${setClauses.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return getConversationById(id)
}

export function deleteConversation(id: string): boolean {
  const db = getDatabase()
  // Delete messages first (cascade)
  db.run('DELETE FROM messages WHERE conversation_id = ?', [id])
  db.run('DELETE FROM review_sessions WHERE conversation_id = ?', [id])
  db.run('DELETE FROM conversations WHERE id = ?', [id])
  saveDatabase()
  return true
}

export function searchConversations(query: string): Conversation[] {
  const db = getDatabase()
  // Search via LIKE on message content since sql.js doesn't support FTS5
  const likeQuery = `%${query}%`
  const stmt = db.prepare(`
    SELECT DISTINCT c.* FROM conversations c
    INNER JOIN messages m ON m.conversation_id = c.id
    WHERE m.content LIKE ? OR c.title LIKE ?
    ORDER BY c.updated_at DESC
    LIMIT 50
  `)
  stmt.bind([likeQuery, likeQuery])
  const conversations: Conversation[] = []
  while (stmt.step()) {
    conversations.push(rowToConversation(stmt.getAsObject()))
  }
  stmt.free()
  return conversations
}

export function incrementMessageCount(conversationId: string): void {
  const db = getDatabase()
  db.run(
    'UPDATE conversations SET message_count = message_count + 1, updated_at = ? WHERE id = ?',
    [new Date().toISOString(), conversationId]
  )
  saveDatabase()
}

export function addTokenUsage(conversationId: string, inputTokens: number, outputTokens: number): void {
  const db = getDatabase()
  db.run(
    `UPDATE conversations SET
      total_input_tokens = total_input_tokens + ?,
      total_output_tokens = total_output_tokens + ?,
      updated_at = ?
    WHERE id = ?`,
    [inputTokens, outputTokens, new Date().toISOString(), conversationId]
  )
  saveDatabase()
}
