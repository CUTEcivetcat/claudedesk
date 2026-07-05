import { v4 as uuidv4 } from 'uuid'
import { getDatabase, saveDatabase } from '../connection'
import type { Profile, CreateProfileInput, UpdateProfileInput } from '../../../shared/types'

function rowToProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    apiKeyEncrypted: row.api_key_encrypted ? Buffer.from(row.api_key_encrypted, 'base64') : null,
    endpoint: row.endpoint || '',
    defaultModel: row.default_model || '',
    defaultMaxTokens: row.default_max_tokens || 4096,
    isActive: !!row.is_active,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  }
}

export function getAllProfiles(): Profile[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM profiles ORDER BY created_at DESC')
  const profiles: Profile[] = []
  while (stmt.step()) {
    profiles.push(rowToProfile(stmt.getAsObject()))
  }
  stmt.free()
  return profiles
}

export function getProfileById(id: string): Profile | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM profiles WHERE id = ?')
  stmt.bind([id])
  let profile: Profile | undefined
  if (stmt.step()) {
    profile = rowToProfile(stmt.getAsObject())
  }
  stmt.free()
  return profile
}

export function getActiveProfile(): Profile | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM profiles WHERE is_active = 1 LIMIT 1')
  let profile: Profile | undefined
  if (stmt.step()) {
    profile = rowToProfile(stmt.getAsObject())
  }
  stmt.free()
  return profile
}

export function createProfile(input: CreateProfileInput, encryptedKey: Buffer): Profile {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()
  const defaultModel = input.defaultModel || getDefaultModel(input.provider)

  db.run(
    `INSERT INTO profiles (id, name, provider, api_key_encrypted, endpoint, default_model, default_max_tokens, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, input.name, input.provider, encryptedKey.toString('base64'),
      input.endpoint || getDefaultEndpoint(input.provider),
      defaultModel,
      input.defaultMaxTokens || 4096,
      getProfileCount() === 0 ? 1 : 0,
      now, now
    ]
  )
  saveDatabase()
  return getProfileById(id)!
}

export function updateProfile(id: string, input: UpdateProfileInput, encryptedKey?: Buffer): Profile | undefined {
  const db = getDatabase()
  const existing = getProfileById(id)
  if (!existing) return undefined

  const setClauses: string[] = ['updated_at = ?']
  const values: any[] = [new Date().toISOString()]

  if (input.name !== undefined) { setClauses.push('name = ?'); values.push(input.name) }
  if (input.provider !== undefined) { setClauses.push('provider = ?'); values.push(input.provider) }
  if (encryptedKey !== undefined) { setClauses.push('api_key_encrypted = ?'); values.push(encryptedKey.toString('base64')) }
  if (input.endpoint !== undefined) { setClauses.push('endpoint = ?'); values.push(input.endpoint) }
  if (input.defaultModel !== undefined) { setClauses.push('default_model = ?'); values.push(input.defaultModel) }
  if (input.defaultMaxTokens !== undefined) { setClauses.push('default_max_tokens = ?'); values.push(input.defaultMaxTokens) }

  values.push(id)
  db.run(`UPDATE profiles SET ${setClauses.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return getProfileById(id)
}

export function deleteProfile(id: string): boolean {
  const db = getDatabase()
  const before = getProfileCount()
  db.run('DELETE FROM profiles WHERE id = ?', [id])
  saveDatabase()
  return getProfileCount() < before
}

export function setActiveProfile(id: string): Profile | undefined {
  const db = getDatabase()
  db.run('UPDATE profiles SET is_active = 0')
  db.run('UPDATE profiles SET is_active = 1, updated_at = ? WHERE id = ?', [new Date().toISOString(), id])
  saveDatabase()
  return getProfileById(id)
}

function getProfileCount(): number {
  const db = getDatabase()
  const stmt = db.prepare('SELECT COUNT(*) as count FROM profiles')
  let count = 0
  if (stmt.step()) {
    count = stmt.getAsObject().count as number
  }
  stmt.free()
  return count
}

function getDefaultEndpoint(provider: string): string {
  switch (provider) {
    case 'anthropic': return 'https://api.anthropic.com'
    case 'openai': return 'https://api.openai.com/v1'
    case 'deepseek': return 'https://api.deepseek.com/v1'
    default: return ''
  }
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'anthropic': return 'claude-sonnet-4-20250514'
    case 'openai': return 'gpt-4o'
    case 'deepseek': return 'deepseek-chat'
    default: return ''
  }
}
