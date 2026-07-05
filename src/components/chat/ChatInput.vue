<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NInput } from 'naive-ui'
import { SendOutline, StopOutline, AttachOutline } from '@vicons/ionicons5'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
  cancel: []
  attach: []
}>()

const { t } = useI18n()
const inputValue = ref('')

function handleSend() {
  const content = inputValue.value.trim()
  if (!content || props.disabled) return
  emit('send', content)
  inputValue.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div style="display: flex; align-items: flex-end; gap: 8px;">
    <NButton quaternary size="small" @click="emit('attach')" style="flex-shrink: 0;">
      <template #icon><NIcon><AttachOutline /></NIcon></template>
    </NButton>

    <NInput
      v-model:value="inputValue"
      type="textarea"
      :placeholder="t('chat.typePlaceholder')"
      :autosize="{ minRows: 1, maxRows: 6 }"
      :disabled="disabled"
      @keydown="handleKeydown"
      style="flex: 1;"
    />

    <NButton
      v-if="!disabled"
      type="primary"
      @click="handleSend"
      :disabled="!inputValue.trim()"
      style="flex-shrink: 0;"
    >
      <template #icon><NIcon><SendOutline /></NIcon></template>
    </NButton>

    <NButton
      v-else
      type="error"
      @click="emit('cancel')"
      style="flex-shrink: 0;"
    >
      <template #icon><NIcon><StopOutline /></NIcon></template>
    </NButton>
  </div>
</template>
