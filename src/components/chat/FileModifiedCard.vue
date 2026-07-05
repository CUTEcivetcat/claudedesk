<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NIcon, NText } from 'naive-ui'
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import { useEditorStore } from '../../stores/editor'

const props = defineProps<{
  path: string
  oldContent: string
  newContent: string
}>()

const emit = defineEmits<{ view: []; dismiss: [] }>()

const editorStore = useEditorStore()

const changeStats = computed(() => {
  const oldLines = props.oldContent.split('\n').length
  const newLines = props.newContent.split('\n').length
  const added = Math.max(0, newLines - oldLines)
  const removed = Math.max(0, oldLines - newLines)
  const wasNew = !props.oldContent
  return { added, removed, wasNew, oldLines, newLines }
})

function viewFile() {
  editorStore.openFile(props.path)
  emit('view')
}

function dismiss() {
  editorStore.clearLastModified()
  emit('dismiss')
}
</script>

<template>
  <div style="margin: 8px 0; padding: 10px 12px; border: 1px solid #27ae6080; border-radius: 8px; background: #27ae6010; display: flex; align-items: center; gap: 10px;">
    <NIcon size="18" color="#27ae60"><CheckmarkCircleOutline /></NIcon>
    <div style="flex: 1; min-width: 0;">
      <NText style="font-size: 12px; font-weight: 600;">AI Modified File</NText>
      <NText depth="3" style="font-size: 11px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        {{ path.split(/[/\\]/).pop() }}
        <template v-if="changeStats.wasNew"> · New file ({{ changeStats.newLines }} lines)</template>
        <template v-else> · {{ changeStats.oldLines }} → {{ changeStats.newLines }} lines (+{{ changeStats.added }}/-{{ changeStats.removed }})</template>
      </NText>
    </div>
    <NButton size="tiny" type="primary" ghost @click="viewFile">View</NButton>
    <NButton size="tiny" quaternary @click="dismiss" style="opacity: 0.5;">×</NButton>
  </div>
</template>
