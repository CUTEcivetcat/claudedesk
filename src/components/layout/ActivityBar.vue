<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NTooltip } from 'naive-ui'
import { ChatbubbleOutline, FolderOpenOutline, SearchOutline, SettingsOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'

export type ActivityView = 'files' | 'chats' | 'search'

const props = defineProps<{ active: ActivityView }>()
const emit = defineEmits<{ 'update:active': [view: ActivityView] }>()
const router = useRouter()
const { t } = useI18n()

const activities = computed(() => [
  { key: 'files' as ActivityView, icon: FolderOpenOutline, label: t('activity.explorer') },
  { key: 'chats' as ActivityView, icon: ChatbubbleOutline, label: t('activity.chats') },
  { key: 'search' as ActivityView, icon: SearchOutline, label: t('activity.search') },
])

function activate(key: ActivityView) {
  if (key !== props.active) emit('update:active', key)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; align-items: center; padding: 8px 0; height: 100%; gap: 2px; border-right: 1px solid var(--n-border-color);">
    <div v-for="act in activities" :key="act.key" style="position: relative; display: flex; align-items: center;">
      <div v-if="active === act.key" style="position: absolute; left: -8px; top: 4px; bottom: 4px; width: 2px; background: var(--n-color-target); border-radius: 0 2px 2px 0;" />
      <NTooltip placement="right" trigger="hover">
        <template #trigger>
          <NButton size="small" :type="active === act.key ? 'primary' : 'tertiary'" @click="activate(act.key)" style="width: 36px; height: 36px;">
            <template #icon><NIcon size="20"><component :is="act.icon" /></NIcon></template>
          </NButton>
        </template>
        {{ act.label }}
      </NTooltip>
    </div>

    <div style="flex: 1;" />

    <NTooltip placement="right" trigger="hover">
      <template #trigger>
        <NButton size="small" quaternary @click="router.push('/settings')" style="width: 36px; height: 36px;">
          <template #icon><NIcon size="20"><SettingsOutline /></NIcon></template>
        </NButton>
      </template>
      {{ t('activity.settings') }}
    </NTooltip>
  </div>
</template>
