<script setup lang="ts">
import { onMounted, watch, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '../stores/chat'
import { useConversationStore } from '../stores/conversation'
import { useProfileStore } from '../stores/profile'
import { useEditorStore } from '../stores/editor'
import { NSpin, useMessage } from 'naive-ui'
import ChatMessage from '../components/chat/ChatMessage.vue'
import ChatInput from '../components/chat/ChatInput.vue'
import ToolCallBlock from '../components/chat/ToolCallBlock.vue'
import FileModifiedCard from '../components/chat/FileModifiedCard.vue'
import MarkdownRenderer from '../components/markdown/MarkdownRenderer.vue'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const conversationStore = useConversationStore()
const profileStore = useProfileStore()
const editorStore = useEditorStore()
const { t } = useI18n()
const message = useMessage()

const scrollRef = ref<HTMLElement | null>(null)

async function loadActiveConversation() {
  const convId = route.params.conversationId as string
  if (convId && convId !== conversationStore.activeConversationId) {
    conversationStore.setActive(convId)
    chatStore.resetContext()
    await chatStore.loadMessages(convId)
    scrollToBottom()
  }
}

onMounted(() => { loadActiveConversation() })
watch(() => route.params.conversationId, () => { loadActiveConversation() })
watch(() => chatStore.messages.length, async () => { await nextTick(); scrollToBottom() })
watch(() => chatStore.streamingContent, async () => { await nextTick(); scrollToBottom() })

function scrollToBottom() {
  requestAnimationFrame(() => {
    const el = scrollRef.value as HTMLElement | null
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

async function handleSend(content: string) {
  let convId = conversationStore.activeConversationId
  if (!convId) {
    if (!profileStore.activeProfile) {
      message.warning(t('review.configureApiFirst'))
      router.push('/settings')
      return
    }
    convId = await conversationStore.createConversation(
      profileStore.activeProfile.id,
      profileStore.activeProfile.defaultModel
    )
    if (!convId) { message.error('Failed to create conversation'); return }
    conversationStore.setActive(convId)
    router.push(`/chat/${convId}`)
  }

  // Build context: working directory + current file
  let finalContent = content

  if (editorStore.hasWorkingDir) {
    const dirCtx = await editorStore.buildDirectoryContext()
    if (dirCtx) {
      finalContent = `[Working Directory]\n${dirCtx}\n\n---\n${finalContent}`
    }
  }

  if (editorStore.activeFile) {
    finalContent = `[Current File: ${editorStore.activeFile.path}]\n\`\`\`${editorStore.activeFile.language}\n${editorStore.activeFile.content}\n\`\`\`\n\n${finalContent}`
  }

  try {
    await chatStore.sendMessage(convId, finalContent, editorStore.workingDirectory || undefined)
    await chatStore.loadMessages(convId)
    scrollToBottom()
  } catch (err: any) {
    message.error(err.message || 'Failed to send message')
  }
}

async function handleAttach() {
  const result = await window.electronAPI.selectFiles('file')
  if (result.success && result.data && result.data.length > 0) {
    const readResult = await window.electronAPI.readFiles(result.data)
    if (readResult.success && readResult.data) {
      for (const file of readResult.data) {
        // Open in editor
        editorStore.openFile(file.path)
        // Also insert content as context into the next message
      }
      message.success(`Loaded ${result.data.length} file(s)`)
    }
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%; min-height: 0;">
    <!-- Chat Header -->
    <div style="padding: 8px 12px; border-bottom: 1px solid var(--n-border-color); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
      <div style="font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        {{ conversationStore.activeConversation?.title || t('app.title') }}
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--n-text-color-3); flex-shrink: 0;">
        <div :style="{ width: '6px', height: '6px', borderRadius: '50%', background: chatStore.isStreaming ? '#27ae60' : '#95a5a6' }" />
        {{ chatStore.percentUsed }}%
      </div>
    </div>

    <!-- Messages -->
    <div ref="scrollRef" style="flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; padding: 12px;">
      <div v-if="chatStore.isLoadingMessages" style="text-align: center; padding: 40px;"><NSpin /></div>
      <div v-else>
            <!-- File Modified Notification -->
            <FileModifiedCard
              v-if="editorStore.lastModifiedFile"
              :path="editorStore.lastModifiedFile.path"
              :old-content="editorStore.lastModifiedFile.oldContent"
              :new-content="editorStore.lastModifiedFile.newContent"
              @dismiss="editorStore.clearLastModified()"
            />

            <div v-if="chatStore.messages.length === 0 && !chatStore.isStreaming" style="text-align: center; padding: 60px 16px; color: var(--n-text-color-3);">
              <div style="font-size: 36px; margin-bottom: 12px;">💬</div>
              <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">{{ t('chat.startConversation') }}</div>
              <div style="font-size: 12px;">{{ t('chat.startHint') }}</div>
            </div>

            <div v-for="msg in chatStore.messages" :key="msg.id" style="margin-bottom: 12px;">
              <ChatMessage :message="msg" />
            </div>

            <!-- Streaming -->
            <div v-if="chatStore.isStreaming && chatStore.streamingContent" style="margin-bottom: 12px;">
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <div style="width: 26px; height: 26px; border-radius: 50%; background: var(--n-color-target); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">🤖</div>
                <div style="flex: 1; min-width: 0; font-size: 13px; line-height: 1.6;">
                  <MarkdownRenderer :content="chatStore.streamingContent" />
                  <span style="display: inline-block; width: 6px; height: 14px; background: var(--n-text-color); animation: blink 0.6s infinite; vertical-align: text-bottom;" />
                </div>
              </div>
              <ToolCallBlock
                v-for="tc in chatStore.toolCalls"
                :key="tc.id"
                :tool-name="tc.toolName"
                :tool-input="tc.toolInput"
                :result="tc.result"
                :is-error="tc.isError"
                :is-executing="tc.isExecuting"
                style="margin-left: 34px; margin-top: 6px;"
              />
            </div>
      </div>
    </div>

    <!-- Input -->
    <div style="border-top: 1px solid var(--n-border-color); padding: 8px 12px; flex-shrink: 0;">
      <ChatInput :disabled="chatStore.isStreaming" @send="handleSend" @cancel="chatStore.abortStream" @attach="handleAttach" />
    </div>
  </div>
</template>

<style scoped>
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
