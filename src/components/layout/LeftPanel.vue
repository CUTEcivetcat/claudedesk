<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import FileTree from './FileTree.vue'
import type { ActivityView } from './ActivityBar.vue'

const props = defineProps<{ active: ActivityView }>()
const { t } = useI18n()

const title = computed(() => {
  if (props.active === 'files') return t('activity.explorer')
  if (props.active === 'chats') return t('activity.chats')
  return t('activity.search')
})
</script>

<template>
  <div style="height: 100%; overflow: hidden;">
    <div style="padding: 8px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--n-text-color-2); letter-spacing: 0.5px; border-bottom: 1px solid var(--n-border-color); flex-shrink: 0;">
      {{ title }}
    </div>
    <Sidebar v-if="active === 'chats'" />
    <FileTree v-else-if="active === 'files'" />
    <div v-else style="padding: 12px; font-size: 12px; color: var(--n-text-color-3);">
      {{ t('activity.searchComingSoon') }}
    </div>
  </div>
</template>
