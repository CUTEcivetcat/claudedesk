<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConversationStore } from '../stores/conversation'
import { NInput, NIcon, NButton, NDataTable, NText, NPopconfirm, NSpace } from 'naive-ui'
import { SearchOutline, TrashOutline, DownloadOutline, EyeOutline } from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'
import type { Conversation } from '../../shared/types'

const router = useRouter()
const conversationStore = useConversationStore()
const { t } = useI18n()
const searchQuery = ref('')

onMounted(() => {
  conversationStore.loadConversations()
})

const columns: DataTableColumns<Conversation> = [
  {
    title: t('history.title_column'),
    key: 'title',
    ellipsis: { tooltip: true }
  },
  {
    title: t('history.model'),
    key: 'model',
    width: 150
  },
  {
    title: t('history.messages'),
    key: 'messageCount',
    width: 80,
    align: 'center'
  },
  {
    title: t('history.tokens'),
    key: 'tokens',
    width: 100,
    render(row) {
      const total = (row.totalInputTokens || 0) + (row.totalOutputTokens || 0)
      return total >= 1000 ? (total / 1000).toFixed(1) + 'K' : String(total)
    }
  },
  {
    title: t('history.updated'),
    key: 'updatedAt',
    width: 160,
    render(row) {
      return new Date(row.updatedAt).toLocaleString('zh-CN')
    }
  },
  {
    title: t('history.actions'),
    key: 'actions',
    width: 140,
    render(row) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, {
            size: 'tiny', quaternary: true,
            onClick: () => openConversation(row.id)
          }, { icon: () => h(NIcon, null, { default: () => h(EyeOutline) }) }),
          h(NButton, {
            size: 'tiny', quaternary: true,
            onClick: () => exportConversation(row.id)
          }, { icon: () => h(NIcon, null, { default: () => h(DownloadOutline) }) }),
          h(NPopconfirm, {
            onPositiveClick: () => conversationStore.deleteConversation(row.id)
          }, {
            trigger: () => h(NButton, {
              size: 'tiny', quaternary: true, type: 'error'
            }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
            default: () => t('history.confirmDelete')
          })
        ]
      })
    }
  }
]

function openConversation(id: string) {
  router.push(`/chat/${id}`)
}

async function exportConversation(id: string) {
  await window.electronAPI.exportMessages(id, 'markdown')
}

function handleSearch() {
  conversationStore.searchConversations(searchQuery.value)
}
</script>

<template>
  <div style="max-width: 900px; margin: 0 auto; padding: 24px; height: 100%; overflow-y: auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <NText style="font-size: 20px; font-weight: 700;">{{ t('history.title') }}</NText>
        <NText depth="3" style="display: block; font-size: 13px; margin-top: 4px;">
          {{ t('history.subtitle') }}
        </NText>
      </div>
    </div>

    <NInput
      v-model:value="searchQuery"
      :placeholder="t('history.searchPlaceholder')"
      clearable
      @input="handleSearch"
      style="margin-bottom: 16px;"
    >
      <template #prefix>
        <NIcon><SearchOutline /></NIcon>
      </template>
    </NInput>

    <NDataTable
      :columns="columns"
      :data="conversationStore.filteredConversations"
      :bordered="false"
      :single-line="false"
      size="small"
    />
  </div>
</template>
