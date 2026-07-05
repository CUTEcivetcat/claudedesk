<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '../../stores/editor'
import { useChatStore } from '../../stores/chat'
import { useProfileStore } from '../../stores/profile'
import { NText } from 'naive-ui'

const editorStore = useEditorStore()
const chatStore = useChatStore()
const profileStore = useProfileStore()
const { t } = useI18n()

function formatTokens(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n.toString()
}
</script>

<template>
  <div style="height: 22px; padding: 0 10px; display: flex; align-items: center; justify-content: space-between; font-size: 11px; border-top: 1px solid var(--n-border-color); background: var(--n-color-embedded); flex-shrink: 0; gap: 16px;">
    <!-- Left: Working Directory -->
    <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
      <NText depth="3" v-if="editorStore.hasWorkingDir" style="font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        📂 {{ editorStore.workingDirectory }}
      </NText>
      <NText depth="3" v-else style="font-size: 11px;">{{ t('common.noFolderOpened') }}</NText>
    </div>

    <!-- Right: Status Info -->
    <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
      <NText depth="3" style="font-size: 11px;">
        {{ profileStore.activeProfile?.provider || t('common.noApi') }} · {{ profileStore.activeProfile?.defaultModel || '' }}
      </NText>
      <NText depth="3" style="font-size: 11px;" v-if="chatStore.usedTokens > 0">
        {{ formatTokens(chatStore.usedTokens) }} / {{ formatTokens(chatStore.budgetTokens) }} tokens
      </NText>
      <NText depth="3" style="font-size: 11px;" v-if="chatStore.estimatedCost > 0">
        ${{ chatStore.estimatedCost.toFixed(4) }}
      </NText>
      <div style="display: flex; align-items: center; gap: 4px;">
        <div :style="{
          width: '7px', height: '7px', borderRadius: '50%',
          background: chatStore.isStreaming ? '#27ae60' : '#95a5a6'
        }" />
        <NText depth="3" style="font-size: 11px;">
          {{ chatStore.isStreaming ? t('context.generating') : t('context.idle') }}
        </NText>
      </div>
    </div>
  </div>
</template>
