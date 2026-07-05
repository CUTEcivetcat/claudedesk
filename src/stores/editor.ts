import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface OpenFile {
  path: string
  content: string
  language: string
  isDirty: boolean
}

export interface FileChange {
  path: string
  oldContent: string
  newContent: string
  timestamp: number
}

export const useEditorStore = defineStore('editor', () => {
  const openFiles = ref<OpenFile[]>([])
  const activeFilePath = ref<string | null>(null)
  const workingDirectory = ref<string>('')
  const activeFile = ref<OpenFile | null>(null)
  const lastModifiedFile = ref<FileChange | null>(null)

  const hasWorkingDir = computed(() => !!workingDirectory.value)

  function setWorkingDirectory(path: string) {
    workingDirectory.value = path
  }

  async function openFile(filePath: string) {
    const existing = openFiles.value.find(f => f.path === filePath)
    if (existing) {
      activeFilePath.value = filePath
      activeFile.value = { ...existing } // new ref for reactivity
      return
    }

    try {
      const result = await window.electronAPI.readFiles([filePath])
      if (result.success && result.data && result.data.length > 0) {
        const file: OpenFile = {
          path: filePath,
          content: result.data[0].content,
          language: result.data[0].language,
          isDirty: false
        }
        openFiles.value.push(file)
        activeFilePath.value = filePath
        activeFile.value = { ...file }
      }
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  function closeFile(filePath: string) {
    openFiles.value = openFiles.value.filter(f => f.path !== filePath)
    if (activeFilePath.value === filePath) {
      activeFilePath.value = openFiles.value[0]?.path || null
      activeFile.value = openFiles.value[0] ? { ...openFiles.value[0] } : null
    }
  }

  function updateContent(filePath: string, content: string) {
    const idx = openFiles.value.findIndex(f => f.path === filePath)
    if (idx !== -1) {
      openFiles.value[idx] = { ...openFiles.value[idx], content, isDirty: true }
      if (activeFilePath.value === filePath) {
        activeFile.value = { ...openFiles.value[idx] }
      }
    }
  }

  async function saveFile(filePath: string) {
    const idx = openFiles.value.findIndex(f => f.path === filePath)
    if (idx === -1) return
    try {
      await window.electronAPI.writeFile(filePath, openFiles.value[idx].content)
      openFiles.value[idx] = { ...openFiles.value[idx], isDirty: false }
      if (activeFilePath.value === filePath) {
        activeFile.value = { ...openFiles.value[idx] }
      }
    } catch (err) {
      console.error('Failed to save file:', err)
    }
  }

  /**
   * Called when AI modifies a file externally (via write_file tool).
   * Properly triggers Vue reactivity by replacing objects.
   */
  function applyAiChange(filePath: string, newContent: string) {
    const idx = openFiles.value.findIndex(f => f.path === filePath)
    const oldContent = idx !== -1 ? openFiles.value[idx].content : ''

    if (idx !== -1) {
      // Update existing file in-place with new object for reactivity
      openFiles.value[idx] = {
        ...openFiles.value[idx],
        content: newContent,
        isDirty: false
      }
      if (activeFilePath.value === filePath) {
        activeFile.value = { ...openFiles.value[idx] }
      }
    } else {
      // Auto-open the file
      openFiles.value.push({
        path: filePath,
        content: newContent,
        language: detectLanguage(filePath),
        isDirty: false
      })
      activeFilePath.value = filePath
      activeFile.value = { ...openFiles.value[openFiles.value.length - 1] }
    }

    // Record the change for diff display
    lastModifiedFile.value = {
      path: filePath,
      oldContent,
      newContent,
      timestamp: Date.now()
    }
  }

  function clearLastModified() {
    lastModifiedFile.value = null
  }

  function detectLanguage(filePath: string): string {
    const ext = (filePath.split('.').pop() || '').toLowerCase()
    const map: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      vue: 'html', html: 'html', css: 'css', scss: 'scss',
      json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml',
      py: 'python', rs: 'rust', go: 'go', java: 'java',
      md: 'markdown', sql: 'sql', sh: 'bash',
    }
    return map[ext] || 'plaintext'
  }

  function refreshActiveFile() {
    if (activeFilePath.value) openFile(activeFilePath.value)
  }

  async function buildDirectoryContext(): Promise<string> {
    if (!workingDirectory.value) return ''
    try {
      const result = await window.electronAPI.listDirectory(workingDirectory.value)
      if (!result.success || !result.data) return ''
      const entries = result.data as Array<{ name: string; isDirectory: boolean; size: number }>
      const dirs = entries.filter(e => e.isDirectory).slice(0, 20)
      const files = entries.filter(e => !e.isDirectory).slice(0, 50)
      let ctx = `Working directory: ${workingDirectory.value}\n`
      if (dirs.length > 0) ctx += `Subdirectories: ${dirs.map(d => d.name).join(', ')}\n`
      if (files.length > 0) ctx += `Files: ${files.map(f => `${f.name} (${formatSize(f.size)})`).join(', ')}\n`
      return ctx
    } catch { return '' }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return {
    openFiles,
    activeFilePath,
    activeFile,
    workingDirectory,
    hasWorkingDir,
    lastModifiedFile,
    setWorkingDirectory,
    openFile,
    closeFile,
    updateContent,
    saveFile,
    applyAiChange,
    clearLastModified,
    refreshActiveFile,
    buildDirectoryContext
  }
})
