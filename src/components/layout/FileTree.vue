<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { NButton, NIcon, NScrollbar, NSpin, NText } from 'naive-ui'
import { FolderOpenOutline, RefreshOutline, ChevronForwardOutline, ChevronDownOutline } from '@vicons/ionicons5'

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
}

interface TreeNode {
  entry: FileEntry
  children: TreeNode[]
  expanded: boolean
  loaded: boolean
  isLoading: boolean
}

const editorStore = useEditorStore()
const rootNodes = ref<TreeNode[]>([])
const isLoading = ref(false)

// Load root directory
async function loadRoot() {
  if (!editorStore.workingDirectory) return
  isLoading.value = true
  try {
    const result = await window.electronAPI.listDirectory(editorStore.workingDirectory)
    if (result.success && result.data) {
      const entries = (result.data as FileEntry[]).sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      rootNodes.value = entries.map(e => ({
        entry: e,
        children: [],
        expanded: false,
        loaded: false,
        isLoading: false
      }))
    }
  } finally {
    isLoading.value = false
  }
}

// Load children of a directory node
async function toggleExpand(node: TreeNode) {
  if (node.expanded) {
    node.expanded = false
    return
  }

  node.expanded = true
  if (node.loaded) return

  node.isLoading = true
  try {
    const result = await window.electronAPI.listDirectory(node.entry.path)
    if (result.success && result.data) {
      const entries = (result.data as FileEntry[]).sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      node.children = entries.map(e => ({
        entry: e,
        children: [],
        expanded: false,
        loaded: false,
        isLoading: false
      }))
      node.loaded = true
    }
  } finally {
    node.isLoading = false
  }
}

function handleClick(node: TreeNode) {
  if (node.entry.isDirectory) {
    toggleExpand(node)
  } else {
    editorStore.openFile(node.entry.path)
  }
}

async function selectFolder() {
  const result = await window.electronAPI.selectFiles('directory')
  if (result.success && result.data && result.data.length > 0) {
    editorStore.setWorkingDirectory(result.data[0])
    await loadRoot()
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

onMounted(() => {
  if (editorStore.workingDirectory) loadRoot()
})

// Watch for working directory changes
import { watch } from 'vue'
watch(() => editorStore.workingDirectory, () => {
  if (editorStore.workingDirectory) loadRoot()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%;">
    <!-- Folder Controls -->
    <div style="padding: 8px;">
      <NButton size="small" type="primary" block @click="selectFolder" v-if="!editorStore.hasWorkingDir">
        <template #icon><NIcon size="14"><FolderOpenOutline /></NIcon></template>
        Open Folder
      </NButton>
      <div v-else style="display: flex; align-items: center; gap: 4px;">
        <NButton size="tiny" type="primary" ghost @click="selectFolder" style="flex: 1; font-size: 11px;">
          <template #icon><NIcon size="12"><FolderOpenOutline /></NIcon></template>
          {{ editorStore.workingDirectory.split('\\').pop() || 'Folder' }}
        </NButton>
        <NButton size="tiny" quaternary @click="loadRoot">
          <template #icon><NIcon size="14"><RefreshOutline /></NIcon></template>
        </NButton>
      </div>
    </div>

    <!-- File Tree -->
    <NScrollbar style="flex: 1;">
      <NSpin :show="isLoading">
        <div v-if="!editorStore.hasWorkingDir" style="text-align: center; padding: 30px 16px; color: var(--n-text-color-3); font-size: 12px; line-height: 1.6;">
          Open a folder to browse files here
        </div>
        <div v-else style="padding: 2px 0;">

          <!-- Recursive Tree -->
          <template v-for="node in rootNodes" :key="node.entry.path">
            <!-- Directory -->
            <template v-if="node.entry.isDirectory">
              <div
                @click="handleClick(node)"
                style="padding: 3px 8px 3px 8px; display: flex; align-items: center; gap: 2px; cursor: pointer; font-size: 12px; border-radius: 3px; margin: 0 4px; user-select: none;"
              >
                <NIcon size="12">
                  <ChevronForwardOutline v-if="!node.expanded" />
                  <ChevronDownOutline v-else />
                </NIcon>
                <span style="flex-shrink: 0;">📁</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ node.entry.name }}</span>
              </div>

              <!-- Children (recursive) -->
              <template v-if="node.expanded">
                <template v-for="child in node.children" :key="child.entry.path">
                  <template v-if="child.entry.isDirectory">
                    <div
                      @click="handleClick(child)"
                      style="padding: 3px 8px 3px 28px; display: flex; align-items: center; gap: 2px; cursor: pointer; font-size: 12px; border-radius: 3px; margin: 0 4px; user-select: none;"
                    >
                      <NIcon size="12">
                        <ChevronForwardOutline v-if="!child.expanded" />
                        <ChevronDownOutline v-else />
                      </NIcon>
                      <span style="flex-shrink: 0;">📁</span>
                      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ child.entry.name }}</span>
                    </div>
                    <template v-if="child.expanded">
                      <template v-for="subchild in child.children" :key="subchild.entry.path">
                        <template v-if="subchild.entry.isDirectory">
                          <div @click="handleClick(subchild)" style="padding: 3px 8px 3px 48px; display: flex; align-items: center; gap: 2px; cursor: pointer; font-size: 12px; border-radius: 3px; margin: 0 4px;">
                            <NIcon size="12">
                              <ChevronForwardOutline v-if="!subchild.expanded" /><ChevronDownOutline v-else />
                            </NIcon>
                            <span>📁</span>
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ subchild.entry.name }}</span>
                          </div>
                        </template>
                        <template v-else>
                          <div
                            @click="handleClick(subchild)"
                            style="padding: 3px 8px 3px 56px; display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px; border-radius: 3px; margin: 0 4px;"
                            :style="{ background: editorStore.activeFilePath === subchild.entry.path ? 'var(--n-color-target)' : 'transparent' }"
                          >
                            <span>📄</span>
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ subchild.entry.name }}</span>
                          </div>
                        </template>
                      </template>
                    </template>
                  </template>
                  <template v-else>
                    <div
                      @click="handleClick(child)"
                      style="padding: 3px 8px 3px 36px; display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px; border-radius: 3px; margin: 0 4px;"
                      :style="{ background: editorStore.activeFilePath === child.entry.path ? 'var(--n-color-target)' : 'transparent' }"
                    >
                      <span>📄</span>
                      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ child.entry.name }}</span>
                    </div>
                  </template>
                </template>
              </template>
            </template>

            <!-- Root-level File -->
            <template v-else>
              <div
                @click="handleClick(node)"
                style="padding: 3px 8px 3px 16px; display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px; border-radius: 3px; margin: 0 4px;"
                :style="{ background: editorStore.activeFilePath === node.entry.path ? 'var(--n-color-target)' : 'transparent' }"
              >
                <span>📄</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ node.entry.name }}</span>
              </div>
            </template>
          </template>
        </div>
      </NSpin>
    </NScrollbar>
  </div>
</template>
