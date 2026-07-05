import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs'
import { join, extname, dirname } from 'path'
import { execSync } from 'child_process'
import * as channels from '../../shared/ipc-channels'

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript',
  '.js': 'javascript', '.jsx': 'javascript',
  '.vue': 'html', '.html': 'html',
  '.css': 'css', '.scss': 'scss',
  '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml',
  '.py': 'python', '.rs': 'rust', '.go': 'go',
  '.java': 'java', '.kt': 'kotlin',
  '.c': 'c', '.cpp': 'cpp', '.h': 'c',
  '.md': 'markdown', '.sql': 'sql',
  '.sh': 'bash', '.bat': 'batch',
  '.xml': 'xml', '.svg': 'xml',
}

function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  return LANGUAGE_MAP[ext] || 'plaintext'
}

export function registerFileHandlers(): void {
  // File selection dialog
  ipcMain.handle(channels.FILES_SELECT, async (_event, { mode, filters }) => {
    try {
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return { success: false, error: 'No active window' }

      const result = await dialog.showOpenDialog(window, {
        properties: mode === 'directory'
          ? ['openDirectory']
          : ['openFile', 'multiSelections'],
        filters: filters || [{ name: 'All Files', extensions: ['*'] }]
      })

      if (result.canceled) return { success: true, data: [] }
      return { success: true, data: result.filePaths }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Read file contents
  ipcMain.handle(channels.FILES_READ, async (_event, { paths }) => {
    try {
      const files = []
      for (const filePath of paths) {
        try {
          const content = readFileSync(filePath, 'utf-8')
          files.push({ path: filePath, content, language: detectLanguage(filePath) })
        } catch (err: any) {
          files.push({ path: filePath, content: `Error reading file: ${err.message}`, language: 'plaintext' })
        }
      }
      return { success: true, data: files }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Write file (tool use)
  ipcMain.handle(channels.FILES_WRITE, async (_event, { path: filePath, content }) => {
    try {
      const dir = dirname(filePath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(filePath, content, 'utf-8')
      return { success: true, data: { path: filePath, written: content.length } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // List directory (tool use)
  ipcMain.handle(channels.FILES_LIST_DIR, async (_event, { path: dirPath }) => {
    try {
      if (!existsSync(dirPath)) {
        return { success: false, error: `Directory not found: ${dirPath}` }
      }
      const entries = readdirSync(dirPath).map(name => {
        const fullPath = join(dirPath, name)
        try {
          const stats = statSync(fullPath)
          return {
            name,
            path: fullPath,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modifiedAt: stats.mtime.toISOString()
          }
        } catch {
          return { name, path: fullPath, isDirectory: false, size: 0, modifiedAt: '' }
        }
      })
      return { success: true, data: entries }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Search files with grep (tool use)
  ipcMain.handle(channels.FILES_SEARCH, async (_event, { pattern, path: searchPath }) => {
    try {
      const targetPath = searchPath || process.cwd()
      let result = ''
      try {
        result = execSync(`grep -rn --include="*.ts" --include="*.js" --include="*.vue" --include="*.py" --include="*.rs" --include="*.go" --include="*.java" --include="*.html" --include="*.css" --include="*.json" "${pattern}" "${targetPath}" 2>NUL || echo ""`, {
          cwd: targetPath,
          encoding: 'utf-8',
          maxBuffer: 5 * 1024 * 1024,
          timeout: 10000
        })
      } catch {
        // grep returns non-zero when no matches
        result = ''
      }
      const lines = result.trim().split('\n').filter(Boolean).slice(0, 50)
      return { success: true, data: lines }
    } catch (error: any) {
      return { success: false, error: error.message, data: [] }
    }
  })

  // Execute shell command (tool use - requires user approval)
  ipcMain.handle(channels.TERMINAL_EXEC, async (_event, { command, cwd }) => {
    try {
      const result = execSync(command, {
        cwd: cwd || process.cwd(),
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000
      })
      return { success: true, data: result }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: error.stdout || error.stderr || ''
      }
    }
  })

  // Ask user for command approval
  ipcMain.handle(channels.TERMINAL_APPROVE, async (_event, { command, cwd }) => {
    try {
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return { success: false, error: 'No active window' }

      const response = await dialog.showMessageBox(window, {
        type: 'warning',
        title: 'Approve Command Execution',
        message: `Allow executing this command?`,
        detail: `Command: ${command}\nDirectory: ${cwd || process.cwd()}`,
        buttons: ['Allow', 'Deny'],
        defaultId: 1,
        cancelId: 1
      })

      return { success: true, data: response.response === 0 }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
