import { ipcMain, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import type { ToolName } from './tool-definitions'

export interface ToolCall {
  id: string
  name: ToolName
  input: Record<string, any>
}

export interface ToolResult {
  tool_use_id: string
  type: 'tool_result'
  content: string
  is_error?: boolean
}

/**
 * Execute a tool call and return the result.
 * This runs in the main process with full system access.
 */
function resolvePath(filePath: string, workingDir?: string): string {
  if (!filePath) return filePath
  // If absolute path, use as-is
  if (/^[A-Z]:\\/i.test(filePath) || filePath.startsWith('/')) return filePath
  // Otherwise, resolve relative to working directory
  if (workingDir) return join(workingDir, filePath)
  return filePath
}

export async function executeToolCall(call: ToolCall, workingDirectory?: string): Promise<ToolResult> {
  const result: ToolResult = {
    tool_use_id: call.id,
    type: 'tool_result',
    content: ''
  }

  try {
    switch (call.name) {
      case 'read_file': {
        const filePath = resolvePath(call.input.path, workingDirectory)
        if (!existsSync(filePath)) {
          result.content = `Error: File not found: ${filePath}`
          result.is_error = true
          break
        }
        const stats = statSync(filePath)
        if (stats.isDirectory()) {
          result.content = `Error: ${filePath} is a directory, not a file. Use list_directory instead.`
          result.is_error = true
          break
        }
        const content = readFileSync(filePath, 'utf-8')
        const lines = content.split('\n')
        const lineCount = lines.length
        // If file is large, truncate with line numbers
        if (lineCount > 500) {
          result.content = `File: ${filePath} (${lineCount} lines, showing first 500)\n\n`
          result.content += lines.slice(0, 500).map((l, i) => `${i + 1}: ${l}`).join('\n')
          result.content += `\n\n... (${lineCount - 500} more lines)`
        } else {
          result.content = `File: ${filePath} (${lineCount} lines)\n\n`
          result.content += lines.map((l, i) => `${i + 1}: ${l}`).join('\n')
        }
        break
      }

      case 'write_file': {
        const filePath = resolvePath(call.input.path, workingDirectory)
        const { content } = call.input
        const dir = dirname(filePath)
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
        writeFileSync(filePath, content, 'utf-8')
        const writtenLines = content.split('\n').length
        result.content = `File written successfully: ${filePath} (${writtenLines} lines, ${content.length} chars)`
        break
      }

      case 'list_directory': {
        const dirPath = resolvePath(call.input.path, workingDirectory)
        if (!existsSync(dirPath)) {
          result.content = `Error: Directory not found: ${dirPath}`
          result.is_error = true
          break
        }
        const entries = readdirSync(dirPath)
        const items = entries.map(name => {
          const fullPath = join(dirPath, name)
          try {
            const stats = statSync(fullPath)
            const type = stats.isDirectory() ? '[DIR] ' : '[FILE]'
            const size = stats.isDirectory() ? '' : ` (${formatSize(stats.size)})`
            return `${type} ${name}${size}`
          } catch {
            return `[???] ${name}`
          }
        })
        result.content = `Directory: ${dirPath}\n\n${items.join('\n')}`
        break
      }

      case 'search_files': {
        const searchPath = resolvePath(call.input.path, workingDirectory)
        const { pattern } = call.input
        if (!existsSync(searchPath)) {
          result.content = `Error: Directory not found: ${searchPath}`
          result.is_error = true
          break
        }
        try {
          // Escape single quotes in pattern for shell
          const safePattern = pattern.replace(/'/g, "'\\''")
          const output = execSync(
            `grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.vue" --include="*.py" --include="*.rs" --include="*.go" --include="*.java" --include="*.html" --include="*.css" --include="*.json" --include="*.yaml" --include="*.yml" --include="*.md" --include="*.sql" '${safePattern}' "${searchPath}" 2>NUL || echo "No matches found"`,
            { cwd: searchPath, encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024, timeout: 10000 }
          )
          const lines = output.trim().split('\n').filter(Boolean)
          if (lines.length > 100) {
            result.content = `Found ${lines.length} matches for "${pattern}" in ${searchPath}\n\n`
            result.content += lines.slice(0, 100).join('\n')
            result.content += `\n\n... and ${lines.length - 100} more matches`
          } else {
            result.content = `Found ${lines.length} matches for "${pattern}" in ${searchPath}\n\n`
            result.content += lines.join('\n')
          }
        } catch {
          result.content = `No matches found for "${pattern}" in ${searchPath}`
        }
        break
      }

      case 'run_command': {
        const { command, cwd } = call.input
        const workDir = cwd || process.cwd()

        // Check if command looks safe (no approval needed for read-only commands)
        const safeCommands = ['ls', 'dir', 'pwd', 'echo', 'cat', 'head', 'tail', 'grep', 'find', 'git diff', 'git log', 'git status', 'git branch', 'npm ls', 'npm list', 'node -v', 'npm -v', 'python --version', 'git --version', 'which', 'where', 'type']
        const needsApproval = !safeCommands.some(sc => command.trim().startsWith(sc))

        if (needsApproval) {
          // For now, auto-approve in MVP; in production this should show a dialog
          // We'll send a notification to the renderer instead of blocking
          console.log(`[Tool Use] Executing command (auto-approved): ${command}`)
        }

        try {
          const output = execSync(command, {
            cwd: workDir,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
            timeout: 30000,
            shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
          })
          result.content = output.trim() || '(Command executed successfully with no output)'
        } catch (error: any) {
          result.content = `Command failed: ${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`
          result.is_error = true
        }
        break
      }

      default:
        result.content = `Unknown tool: ${call.name}`
        result.is_error = true
    }
  } catch (error: any) {
    result.content = `Tool execution error: ${error.message}`
    result.is_error = true
  }

  return result
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
