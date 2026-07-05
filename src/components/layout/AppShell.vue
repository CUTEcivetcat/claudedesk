<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from '../../stores/profile'
import { useConversationStore } from '../../stores/conversation'
import { useChatStore } from '../../stores/chat'
import { useEditorStore } from '../../stores/editor'
import { useResizable } from '../../composables/useResizable'
import { SUPPORTED_LOCALES, switchLocale } from '../../locales'
import ActivityBar from './ActivityBar.vue'
import type { ActivityView } from './ActivityBar.vue'
import LeftPanel from './LeftPanel.vue'
import CenterEditor from './CenterEditor.vue'
import StatusBar from './StatusBar.vue'
import ProfileSwitcher from '../config/ProfileSwitcher.vue'
import { NSpace, NButton, NIcon, NConfigProvider, NLayout, NLayoutContent, darkTheme, lightTheme, NMessageProvider, NSelect, NTooltip } from 'naive-ui'
import { MoonOutline, SunnyOutline, SettingsOutline, MenuOutline, ChatbubbleOutline } from '@vicons/ionicons5'

const router = useRouter()
const profileStore = useProfileStore()
const conversationStore = useConversationStore()
const chatStore = useChatStore()
const editorStore = useEditorStore()
const { locale } = useI18n()

const isDark = ref(true)
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)
const activeActivity = ref<ActivityView>('files')

const leftResize = useResizable(280, 200, 500)
const rightResize = useResizable(400, 300, 600)

function toggleTheme() { isDark.value = !isDark.value }
function toggleLeft() { leftCollapsed.value = !leftCollapsed.value; if (!leftCollapsed.value) leftResize.resetWidth() }
function toggleRight() { rightCollapsed.value = !rightCollapsed.value; if (!rightCollapsed.value) rightResize.resetWidth() }

const localeOptions = SUPPORTED_LOCALES.map(l => ({ label: l.label, value: l.value }))

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'b') { e.preventDefault(); toggleLeft() }
    if (e.key === 'j') { e.preventDefault(); toggleRight() }
    if (e.shiftKey && e.key === 'E') { e.preventDefault(); activeActivity.value = 'files'; if (leftCollapsed.value) toggleLeft() }
    if (e.shiftKey && e.key === 'H') { e.preventDefault(); activeActivity.value = 'chats'; if (leftCollapsed.value) toggleLeft() }
  }
}

onMounted(async () => {
  await profileStore.loadProfiles()
  await conversationStore.loadConversations()
  document.addEventListener('keydown', handleKeydown)

  window.electronAPI.onStreamToken((p: any) => chatStore.appendToken(p.token, p.type))
  window.electronAPI.onStreamDone(async (p: any) => {
    chatStore.finalizeStream()
    if (p.conversationId === conversationStore.activeConversationId) await chatStore.loadMessages(p.conversationId)
    await conversationStore.loadConversations()
  })
  window.electronAPI.onStreamError(() => chatStore.abortStream())
  window.electronAPI.onContextUpdate((p: any) => chatStore.updateContext(p.usedTokens, p.budgetTokens, p.percentUsed, p.cost))

  window.electronAPI.onFileModified(async (p: any) => {
    if (!p.path) return
    editorStore.applyAiChange(p.path, p.content)
  })
})

onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <NConfigProvider :theme="isDark ? darkTheme : lightTheme">
    <NMessageProvider>
      <NLayout style="height: 100vh; overflow: hidden;">
        <NLayoutContent style="height: 100%; overflow: hidden;">
          <!-- ROOT: full height, no scroll -->
          <div style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">

        <!-- TOP BAR: fixed height -->
        <div style="height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; border-bottom: 1px solid var(--n-border-color); flex-shrink: 0; -webkit-app-region: drag; background: var(--n-color-body);">
          <div style="display: flex; align-items: center; gap: 4px; -webkit-app-region: no-drag;">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="tiny" quaternary @click="toggleLeft"><template #icon><NIcon size="16"><MenuOutline /></NIcon></template></NButton>
              </template>
              Toggle Panel (Ctrl+B)
            </NTooltip>
            <ProfileSwitcher />
          </div>
          <NSpace :size="2" style="-webkit-app-region: no-drag;">
            <NSelect :value="locale" :options="localeOptions" size="tiny" style="width: 70px;" @update:value="(v: string) => switchLocale(v)" />
            <NButton size="tiny" quaternary @click="toggleTheme"><template #icon><NIcon><MoonOutline v-if="!isDark" /><SunnyOutline v-else /></NIcon></template></NButton>
            <NButton size="tiny" quaternary @click="router.push('/settings')"><template #icon><NIcon><SettingsOutline /></NIcon></template></NButton>
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="tiny" quaternary @click="toggleRight"><template #icon><NIcon size="16"><ChatbubbleOutline /></NIcon></template></NButton>
              </template>
              Toggle Chat (Ctrl+J)
            </NTooltip>
          </NSpace>
        </div>

        <!-- BODY: flex row, fills remaining height, NO SCROLL -->
        <div style="flex: 1; display: flex; overflow: hidden; min-height: 0;">

          <!-- Activity Bar -->
          <div style="width: 40px; flex-shrink: 0; background: var(--n-color-embedded); border-right: 1px solid var(--n-border-color);">
            <ActivityBar v-model:active="activeActivity" />
          </div>

          <!-- Left Panel -->
          <div v-if="!leftCollapsed" :style="{ width: leftResize.width.value + 'px', flexShrink: 0, borderRight: '1px solid var(--n-border-color)' }">
            <LeftPanel :active="activeActivity" />
          </div>

          <!-- Left Drag Handle -->
          <div v-if="!leftCollapsed" @mousedown="leftResize.onMouseDown"
            style="width: 3px; flex-shrink: 0; cursor: col-resize;"
            :style="{ background: leftResize.isDragging.value ? 'var(--n-color-target)' : 'transparent' }" />

          <!-- CENTER: flex column -->
          <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;">
            <CenterEditor style="flex: 1; min-height: 0;" />
            <StatusBar />
          </div>

          <!-- Right Drag Handle -->
          <div v-if="!rightCollapsed" @mousedown="rightResize.onMouseDown"
            style="width: 3px; flex-shrink: 0; cursor: col-resize;"
            :style="{ background: rightResize.isDragging.value ? 'var(--n-color-target)' : 'transparent' }" />

          <!-- Right Panel -->
          <div v-if="!rightCollapsed" :style="{ width: rightResize.width.value + 'px', flexShrink: 0, borderLeft: '1px solid var(--n-border-color)' }">
            <router-view />
          </div>

        </div>
          </div>
        </NLayoutContent>
      </NLayout>
    </NMessageProvider>
  </NConfigProvider>
</template>
