<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Message } from '../../../shared/types'
import MarkdownRenderer from '../markdown/MarkdownRenderer.vue'

const props = defineProps<{ message: Message }>()
const { t } = useI18n()

const isUser = computed(() => props.message.role === 'user')
const isAssistant = computed(() => props.message.role === 'assistant')
const isSystem = computed(() => props.message.role === 'system')

const avatarIcon = computed(() => {
  if (isUser.value) return '👤'
  if (isAssistant.value) return '🤖'
  return '⚙️'
})

const roleLabel = computed(() => {
  if (isUser.value) return t('chat.you')
  if (isAssistant.value) return t('chat.assistant')
  return t('chat.system')
})

const tokenInfo = computed(() => {
  if (!props.message.inputTokens && !props.message.outputTokens) return ''
  const parts: string[] = []
  if (props.message.inputTokens) parts.push(`↑${props.message.inputTokens}`)
  if (props.message.outputTokens) parts.push(`↓${props.message.outputTokens}`)
  return parts.join(' ')
})

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div :style="{ display: 'flex', alignItems: 'flex-start', gap: '10px' }">
    <div :style="{
      width: '32px', height: '32px', borderRadius: '50%',
      background: isUser ? 'var(--n-color-hover)' : 'var(--n-color-target)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', flexShrink: 0
    }">
      {{ avatarIcon }}
    </div>
    <div style="flex: 1; min-width: 0;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 12px; font-weight: 600; color: var(--n-text-color-2);">
          {{ roleLabel }}
        </span>
        <span style="font-size: 11px; color: var(--n-text-color-3);">
          {{ formatTime(message.createdAt) }}
        </span>
        <span v-if="tokenInfo" style="font-size: 10px; color: var(--n-text-color-3); background: var(--n-color-embedded); padding: 1px 5px; border-radius: 3px;">
          {{ tokenInfo }}
        </span>
      </div>
      <div style="line-height: 1.65;">
        <MarkdownRenderer :content="message.content" />
      </div>
    </div>
  </div>
</template>
