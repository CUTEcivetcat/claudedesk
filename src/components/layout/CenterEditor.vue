<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useChatStore } from '../../stores/chat'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NInput, NText, NSpace, NScrollbar } from 'naive-ui'
import { SaveOutline } from '@vicons/ionicons5'

const editorStore = useEditorStore()
const chatStore = useChatStore()
const { t } = useI18n()

const editContent = ref('')
const isSaving = ref(false)

watch(() => editorStore.activeFile, (file) => {
  editContent.value = file?.content || ''
}, { immediate: true })

function handleContentChange(value: string) {
  if (editorStore.activeFilePath) {
    editorStore.updateContent(editorStore.activeFilePath, value)
  }
}

async function handleSave() {
  if (!editorStore.activeFilePath) return
  isSaving.value = true
  await editorStore.saveFile(editorStore.activeFilePath)
  isSaving.value = false
}

function selectTab(filePath: string) {
  editorStore.openFile(filePath)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%; overflow: hidden; min-height: 0;">
    <!-- Tab Bar -->
    <div style="display: flex; align-items: center; border-bottom: 1px solid var(--n-border-color); overflow-x: auto; flex-shrink: 0; min-height: 32px; background: var(--n-color-embedded);">
      <div
        v-for="file in editorStore.openFiles"
        :key="file.path"
        @click="selectTab(file.path)"
        style="padding: 5px 10px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; border-right: 1px solid var(--n-border-color); white-space: nowrap; user-select: none; min-width: 0; max-width: 180px; flex-shrink: 0;"
        :style="{ background: editorStore.activeFilePath === file.path ? 'var(--n-color-body)' : 'transparent', borderBottom: editorStore.activeFilePath === file.path ? '2px solid var(--n-color-target)' : '2px solid transparent' }"
      >
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">{{ file.isDirty ? '● ' : '' }}{{ file.path.split(/[/\\]/).pop() }}</span>
        <span @click.stop="editorStore.closeFile(file.path)" style="cursor: pointer; opacity: 0.4; font-size: 14px; line-height: 1; flex-shrink: 0;">×</span>
      </div>
      <div style="flex: 1;" />
      <div v-if="editorStore.activeFile?.isDirty" style="flex-shrink: 0; padding: 0 4px;">
        <NButton size="tiny" type="primary" ghost @click="handleSave" :loading="isSaving">
          <template #icon><NIcon size="12"><SaveOutline /></NIcon></template>
          Save
        </NButton>
      </div>
    </div>

    <!-- Editor Area - scrollable -->
    <div style="flex: 1; overflow: hidden; min-height: 0;">
      <div v-if="editorStore.activeFile" style="height: 100%;">
        <NScrollbar style="height: 100%;">
          <NInput
            v-model:value="editContent"
            type="textarea"
            @update:value="handleContentChange"
            :autosize="{ minRows: 10 }"
            style="font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.5;"
            :bordered="false"
            :style="{ '--n-padding-left': '16px', '--n-padding-right': '16px' }"
          />
        </NScrollbar>
      </div>
      <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--n-text-color-3);">
        <div style="text-align: center;">
          <div style="font-size: 36px; margin-bottom: 12px;">📝</div>
          <div style="font-size: 13px;">{{ editorStore.hasWorkingDir ? t('editor.selectFile') : t('editor.openFolder') }}</div>
          <div style="font-size: 11px; margin-top: 4px; opacity: 0.6;">{{ t('editor.shortcuts') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
