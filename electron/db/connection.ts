import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

let db: SqlJsDatabase | null = null
let dbPath: string = ''

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()
  dbPath = join(app.getPath('userData'), 'claudedesk.db')

  if (existsSync(dbPath)) {
    try {
      const buffer = readFileSync(dbPath)
      db = new SQL.Database(buffer)
      console.log(`Database loaded from: ${dbPath}`)
    } catch (err) {
      console.error('Failed to load existing database, creating new one:', err)
      db = new SQL.Database()
    }
  } else {
    db = new SQL.Database()
    console.log(`New database created at: ${dbPath}`)
  }

  // Enable WAL-like behavior with manual saves
  runMigrations()
}

export function saveDatabase(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(dbPath, buffer)
  console.log(`Database saved to: ${dbPath}`)
}

function runMigrations(): void {
  if (!db) return

  // Migration tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Check if initial migration has been applied
  const result = db.exec("SELECT 1 FROM _migrations WHERE name = '001_initial'")
  if (result.length > 0) return

  // Apply schema
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      api_key_encrypted TEXT,
      endpoint TEXT DEFAULT '',
      default_model TEXT NOT NULL DEFAULT '',
      default_max_tokens INTEGER NOT NULL DEFAULT 4096,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Chat',
      profile_id TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT '',
      total_input_tokens INTEGER NOT NULL DEFAULT 0,
      total_output_tokens INTEGER NOT NULL DEFAULT 0,
      message_count INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      input_tokens INTEGER,
      output_tokens INTEGER,
      model TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at)')

  db.run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '{}'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS review_sessions (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      title TEXT NOT NULL,
      files TEXT NOT NULL DEFAULT '[]',
      review_prompt TEXT NOT NULL DEFAULT '',
      results TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run("INSERT INTO _migrations (name) VALUES ('001_initial')")
  console.log('Migration applied: 001_initial')
  saveDatabase()
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}
