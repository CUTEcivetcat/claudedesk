<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NIcon, NCollapse, NCollapseItem, NTag, NText } from 'naive-ui'
import { CodeSlashOutline, TerminalOutline, FolderOpenOutline, SearchOutline, DocumentTextOutline, CheckmarkCircleOutline, CloseCircleOutline } from '@vicons/ionicons5'

const props = defineProps<{
  toolName: string
  toolInput: Record<string, any>
  result?: string
  isError?: boolean
  isExecuting?: boolean
}>()

const collapsed = ref(true)

const toolIcon = computed(() => {
  switch (props.toolName) {
    case 'read_file': return DocumentTextOutline
    case 'write_file': return CodeSlashOutline
    case 'list_directory': return FolderOpenOutline
    case 'search_files': return SearchOutline
    case 'run_command': return TerminalOutline
    default: return CodeSlashOutline
  }
})

const toolLabel = computed(() => {
  switch (props.toolName) {
    case 'read_file': return 'Reading file'
    case 'write_file': return 'Writing file'
    case 'list_directory': return 'Listing directory'
    case 'search_files': return 'Searching'
    case 'run_command': return 'Running command'
    default: return props.toolName
  }
})

const toolColor = computed(() => {
  switch (props.toolName) {
    case 'read_file': return '#3498db'
    case 'write_file': return '#e67e22'
    case 'run_command': return '#e74c3c'
    case 'search_files': return '#9b59b6'
    case 'list_directory': return '#2ecc71'
    default: return '#95a5a6'
  }
})

const shortInput = computed(() => {
  const input = props.toolInput
  if (!input) return ''
  if (input.path) return input.path
  if (input.command) return input.command
  if (input.pattern) return `"${input.pattern}" in ${input.path || ''}`
  return JSON.stringify(input).slice(0, 80)
})
</script>

<template>
  <div style="margin: 8px 0; border: 1px solid var(--n-border-color); border-radius: 8px; overflow: hidden;">
    <div
      @click="collapsed = !collapsed"
      style="padding: 8px 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; background: var(--n-color-embedded); user-select: none;"
    >
      <NIcon :size="16" :color="toolColor">
        <component :is="toolIcon" />
      </NIcon>
      <NText style="font-size: 13px; font-weight: 500;">{{ toolLabel }}</NText>
      <NTag :bordered="false" size="tiny" style="font-size: 11px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
        {{ shortInput }}
      </NTag>
      <div style="flex: 1;" />
      <NIcon v-if="isExecuting" size="14" color="#f39c12">
        <component :is="CodeSlashOutline" />
      </NIcon>
      <NIcon v-else-if="isError" size="14" color="#e74c3c">
        <CloseCircleOutline />
      </NIcon>
      <NIcon v-else-if="result" size="14" color="#27ae60">
        <CheckmarkCircleOutline />
      </NIcon>
    </div>

    <div v-if="!collapsed" style="padding: 10px 12px; font-size: 12px; font-family: 'Cascadia Code', 'Fira Code', monospace; background: #1e1e2e; color: #cdd6f4; max-height: 300px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5;">
      <div v-if="result">{{ result }}</div>
      <div v-else style="color: #6c7086;">Executing...</div>
    </div>
  </div>
</template>
