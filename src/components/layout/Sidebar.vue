<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConversationStore } from '../../stores/conversation'
import { useProfileStore } from '../../stores/profile'
import { NButton, NInput, NIcon, NScrollbar, NPopconfirm, NText, NDivider } from 'naive-ui'
import { AddOutline, SearchOutline, TrashOutline, ChatbubbleOutline } from '@vicons/ionicons5'

const router = useRouter()
const conversationStore = useConversationStore()
const profileStore = useProfileStore()
const { t } = useI18n()

const searchText = ref('')

function handleSearch() {
  conversationStore.searchConversations(searchText.value)
}

async function handleNewChat() {
  if (!profileStore.activeProfile) {
    router.push('/settings')
    return
  }

  const id = await conversationStore.createConversation(
    profileStore.activeProfile.id,
    profileStore.activeProfile.defaultModel
  )
  if (id) {
    router.push(`/chat/${id}`)
  }
}

function selectConversation(id: string) {
  router.push(`/chat/${id}`)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) {
    return d.toLocaleTimeString(localStorage.getItem('claudedesk-language') || 'zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString(localStorage.getItem('claudedesk-language') || 'zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%; padding: 8px;">
    <NButton type="primary" block @click="handleNewChat" style="margin-bottom: 8px;">
      <template #icon><NIcon><AddOutline /></NIcon></template>
      {{ t('sidebar.newChat') }}
    </NButton>

    <NInput
      v-model:value="searchText"
      size="small"
      :placeholder="t('sidebar.searchPlaceholder')"
      clearable
      @input="handleSearch"
      style="margin-bottom: 8px;"
    >
      <template #prefix>
        <NIcon><SearchOutline /></NIcon>
      </template>
    </NInput>

    <NDivider style="margin: 4px 0;" />

    <NScrollbar style="flex: 1;">
      <div v-if="conversationStore.filteredConversations.length === 0" style="padding: 16px; text-align: center;">
        <NText depth="3">{{ t('sidebar.noConversations') }}</NText>
      </div>
      <div
        v-for="conv in conversationStore.filteredConversations"
        :key="conv.id"
        @click="selectConversation(conv.id)"
        :style="{
          padding: '10px 12px',
          margin: '2px 0',
          borderRadius: '8px',
          cursor: 'pointer',
          background: conversationStore.activeConversationId === conv.id ? 'var(--n-color-target)' : 'transparent',
          transition: 'background 0.15s'
        }"
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <NIcon size="14" style="margin-right: 4px; vertical-align: -2px;"><ChatbubbleOutline /></NIcon>
              {{ conv.title }}
            </div>
            <div style="font-size: 11px; color: var(--n-text-color-3); margin-top: 2px;">
              {{ formatDate(conv.updatedAt) }} · {{ conv.model }}
            </div>
          </div>
          <NPopconfirm @positive-click="conversationStore.deleteConversation(conv.id)">
            <template #trigger>
              <NButton size="tiny" quaternary style="opacity: 0.5;">
                <template #icon><NIcon size="14"><TrashOutline /></NIcon></template>
              </NButton>
            </template>
            {{ t('history.confirmDelete') }}
          </NPopconfirm>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>
