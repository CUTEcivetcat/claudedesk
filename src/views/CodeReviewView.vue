<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConversationStore } from '../stores/conversation'
import { useProfileStore } from '../stores/profile'
import {
  NButton, NIcon, NText, NInput, NScrollbar, NSpace, NTag,
  NSpin, NDivider
} from 'naive-ui'
import { FolderOpenOutline, TrashOutline, PlayOutline } from '@vicons/ionicons5'
import MarkdownRenderer from '../components/markdown/MarkdownRenderer.vue'

interface ReviewFile {
  path: string
  content: string
  language: string
}

const route = useRoute()
const conversationStore = useConversationStore()
const profileStore = useProfileStore()
const { t } = useI18n()

const selectedFiles = ref<ReviewFile[]>([])
const reviewPrompt = ref('')
const isReviewing = ref(false)
const reviewContent = ref('')
const reviewError = ref('')

async function handleSelectFiles() {
  const result = await window.electronAPI.selectFiles('file', [
    { name: 'Code Files', extensions: ['ts', 'tsx', 'js', 'jsx', 'vue', 'py', 'rs', 'go', 'java', 'html', 'css', 'json', 'yaml', 'yml', 'md', 'sql', 'sh'] },
    { name: 'All Files', extensions: ['*'] }
  ])

  if (result.success && result.data && result.data.length > 0) {
    const readResult = await window.electronAPI.readFiles(result.data)
    if (readResult.success && readResult.data) {
      const existingPaths = new Set(selectedFiles.value.map(f => f.path))
      for (const file of readResult.data) {
        if (!existingPaths.has(file.path)) {
          selectedFiles.value.push(file)
          existingPaths.add(file.path)
        }
      }
    }
  }
}

function removeFile(path: string) {
  selectedFiles.value = selectedFiles.value.filter(f => f.path !== path)
}

async function startReview() {
  if (selectedFiles.value.length === 0) return

  let convId = route.params.conversationId as string || conversationStore.activeConversationId

  if (!convId) {
    if (!profileStore.activeProfile) {
      reviewError.value = t('review.configureApiFirst')
      return
    }
    convId = await conversationStore.createConversation(
      profileStore.activeProfile.id,
      profileStore.activeProfile.defaultModel
    )
    if (!convId) {
      reviewError.value = 'Failed to create conversation'
      return
    }
    conversationStore.setActive(convId)
  }

  isReviewing.value = true
  reviewContent.value = ''
  reviewError.value = ''

  const cleanupToken = window.electronAPI.onReviewStreamToken((payload: any) => {
    reviewContent.value += payload.token
  })

  const cleanupDone = window.electronAPI.onReviewStreamDone((_payload: any) => {
    isReviewing.value = false
    cleanupToken()
    cleanupDone()
    cleanupError()
  })

  const cleanupError = window.electronAPI.onReviewStreamError((payload: any) => {
    reviewError.value = payload.error
    isReviewing.value = false
    cleanupToken()
    cleanupDone()
    cleanupError()
  })

  const result = await window.electronAPI.startReview({
    conversationId: convId,
    files: selectedFiles.value.map(f => ({
      path: f.path,
      content: f.content,
      language: f.language
    })),
    prompt: reviewPrompt.value || 'Please review the following code for bugs, security issues, performance problems, and code style improvements.'
  })

  if (!result.success) {
    reviewError.value = result.error || 'Failed to start review'
    isReviewing.value = false
  }
}

function getLanguageColor(lang: string): string {
  const colors: Record<string, string> = {
    typescript: '#3178c6', javascript: '#f7df1e', python: '#3776ab',
    rust: '#dea584', go: '#00add8', vue: '#4fc08d',
    html: '#e34f26', css: '#563d7c', json: '#5e5e5e'
  }
  return colors[lang] || '#888'
}
</script>

<template>
  <div style="display: flex; height: 100%;">
    <!-- Left: File Selection -->
    <div style="width: 340px; border-right: 1px solid var(--n-border-color); display: flex; flex-direction: column;">
      <div style="padding: 16px;">
        <NText strong style="font-size: 15px;">{{ t('review.title') }}</NText>
        <NText depth="3" style="display: block; font-size: 12px; margin-top: 4px;">
          {{ t('review.subtitle') }}
        </NText>

        <NButton type="primary" block @click="handleSelectFiles" style="margin-top: 12px;">
          <template #icon><NIcon><FolderOpenOutline /></NIcon></template>
          {{ t('review.selectFiles') }}
        </NButton>
      </div>

      <NDivider style="margin: 0;" />

      <NScrollbar style="flex: 1;">
        <div style="padding: 8px;">
          <div v-if="selectedFiles.length === 0" style="text-align: center; padding: 24px; color: var(--n-text-color-3); font-size: 13px;">
            {{ t('review.noFiles') }}
          </div>
          <div
            v-for="file in selectedFiles"
            :key="file.path"
            style="padding: 8px 10px; margin: 2px 0; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; background: var(--n-color-embedded);"
          >
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ file.path.split(/[/\\]/).pop() }}
              </div>
              <div style="font-size: 11px; color: var(--n-text-color-3); display: flex; align-items: center; gap: 4px;">
                <span :style="{ width: '8px', height: '8px', borderRadius: '50%', background: getLanguageColor(file.language), display: 'inline-block' }" />
                {{ file.language }}
              </div>
            </div>
            <NButton size="tiny" quaternary type="error" @click="removeFile(file.path)">
              <template #icon><NIcon size="14"><TrashOutline /></NIcon></template>
            </NButton>
          </div>
        </div>
      </NScrollbar>

      <!-- Review Prompt -->
      <div style="padding: 12px; border-top: 1px solid var(--n-border-color);">
        <NInput
          v-model:value="reviewPrompt"
          type="textarea"
          :placeholder="t('review.reviewPrompt')"
          :autosize="{ minRows: 2, maxRows: 4 }"
          size="small"
          style="margin-bottom: 8px;"
        />
        <NButton
          type="primary"
          block
          :disabled="selectedFiles.length === 0 || isReviewing"
          :loading="isReviewing"
          @click="startReview"
        >
          <template #icon><NIcon><PlayOutline /></NIcon></template>
          {{ isReviewing ? t('review.reviewing') : t('review.reviewButton', { count: selectedFiles.length }) }}
        </NButton>
      </div>
    </div>

    <!-- Right: Review Results -->
    <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
      <div style="padding: 16px; border-bottom: 1px solid var(--n-border-color);">
        <NText strong style="font-size: 15px;">{{ t('review.results') }}</NText>
        <div v-if="selectedFiles.length > 0" style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
          <NTag v-for="file in selectedFiles" :key="file.path" size="small" closable @close="removeFile(file.path)">
            {{ file.path.split(/[/\\]/).pop() }}
          </NTag>
        </div>
      </div>

      <NScrollbar style="flex: 1;">
        <div style="padding: 20px; max-width: 800px;">
          <div v-if="reviewError" style="padding: 16px; background: var(--n-color-error-pressed); border-radius: 8px; color: var(--n-text-color); margin-bottom: 16px;">
            <NText>{{ reviewError }}</NText>
          </div>

          <div v-if="!reviewContent && !isReviewing && !reviewError" style="text-align: center; padding: 80px 20px; color: var(--n-text-color-3);">
            <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">{{ t('review.title') }}</div>
            <div style="font-size: 14px;">{{ t('review.emptyHint') }}</div>
          </div>

          <div v-if="reviewContent" style="line-height: 1.65;">
            <MarkdownRenderer :content="reviewContent" />
          </div>

          <div v-if="isReviewing && !reviewContent" style="text-align: center; padding: 40px;">
            <NSpin size="medium" />
            <NText depth="3" style="display: block; margin-top: 12px;">{{ t('review.analyzing') }}</NText>
          </div>
        </div>
      </NScrollbar>
    </div>
  </div>
</template>
