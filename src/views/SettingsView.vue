<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from '../stores/profile'
import type { ProviderType, CreateProfileInput } from '../../shared/types'
import {
  NButton, NInput, NSelect, NIcon, NCard, NSpace, NText, NModal,
  NForm, NFormItem, NDivider, NPopconfirm, NTag, NSpin
} from 'naive-ui'
import { AddOutline, TrashOutline, KeyOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'

const profileStore = useProfileStore()
const { t } = useI18n()

const showModal = ref(false)
const editingProfile = ref<string | null>(null)
const formData = ref<CreateProfileInput>({
  name: '',
  provider: 'anthropic',
  apiKey: '',
  endpoint: '',
  defaultModel: '',
  defaultMaxTokens: 4096
})

const providerOptions = [
  { label: t('settings.anthropic'), value: 'anthropic' },
  { label: t('settings.openai'), value: 'openai' },
  { label: t('settings.deepseek'), value: 'deepseek' },
  { label: t('settings.custom'), value: 'custom' }
]

const providerModelDefaults: Record<ProviderType, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  deepseek: 'deepseek-chat',
  custom: ''
}

const providerEndpointDefaults: Record<ProviderType, string> = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  custom: 'http://localhost:11434/v1'
}

function openCreateModal() {
  editingProfile.value = null
  formData.value = {
    name: '',
    provider: 'anthropic',
    apiKey: '',
    endpoint: '',
    defaultModel: '',
    defaultMaxTokens: 4096
  }
  showModal.value = true
}

function openEditModal(profileId: string) {
  const profile = profileStore.profiles.find(p => p.id === profileId)
  if (!profile) return

  editingProfile.value = profileId
  formData.value = {
    name: profile.name,
    provider: profile.provider,
    apiKey: '',
    endpoint: profile.endpoint,
    defaultModel: profile.defaultModel,
    defaultMaxTokens: profile.defaultMaxTokens
  }
  showModal.value = true
}

async function handleSave() {
  if (editingProfile.value) {
    const data: any = {
      name: formData.value.name,
      provider: formData.value.provider,
      endpoint: formData.value.endpoint,
      defaultModel: formData.value.defaultModel,
      defaultMaxTokens: formData.value.defaultMaxTokens
    }
    if (formData.value.apiKey) {
      data.apiKey = formData.value.apiKey
    }
    await profileStore.updateProfile(editingProfile.value, data)
  } else {
    await profileStore.createProfile({ ...formData.value })
  }
  showModal.value = false
}

function onProviderChange(provider: ProviderType) {
  formData.value.provider = provider
  if (!formData.value.defaultModel) {
    formData.value.defaultModel = providerModelDefaults[provider]
  }
  if (!formData.value.endpoint) {
    formData.value.endpoint = providerEndpointDefaults[provider]
  }
}

onMounted(() => {
  profileStore.loadProfiles()
})
</script>

<template>
  <div style="max-width: 700px; margin: 0 auto; padding: 24px; height: 100%; overflow-y: auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <NText style="font-size: 20px; font-weight: 700;">{{ t('settings.title') }}</NText>
        <NText depth="3" style="display: block; font-size: 13px; margin-top: 4px;">
          {{ t('settings.subtitle') }}
        </NText>
      </div>
      <NButton type="primary" @click="openCreateModal">
        <template #icon><NIcon><AddOutline /></NIcon></template>
        {{ t('settings.addProfile') }}
      </NButton>
    </div>

    <NDivider />

    <NSpin :show="profileStore.isLoading">
      <div v-if="profileStore.profiles.length === 0" style="text-align: center; padding: 40px;">
        <NText depth="3">{{ t('settings.noProfiles') }}</NText>
      </div>

      <NCard
        v-for="profile in profileStore.profiles"
        :key="profile.id"
        size="small"
        :bordered="true"
        style="margin-bottom: 12px;"
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <NText strong>{{ profile.name }}</NText>
              <NTag v-if="profile.isActive" type="success" size="tiny" round>
                <template #icon><NIcon size="12"><CheckmarkCircleOutline /></NIcon></template>
                {{ t('settings.active') }}
              </NTag>
              <NTag size="tiny" :bordered="false">{{ profile.provider }}</NTag>
            </div>
            <div style="font-size: 12px; color: var(--n-text-color-3);">
              <span>{{ t('settings.defaultModel') }}: {{ profile.defaultModel }}</span>
              <span style="margin: 0 8px;">·</span>
              <span>{{ t('settings.apiKey') }}: {{ profile.hasKey ? '••••••••' : t('settings.keyNotSet') }}</span>
              <span style="margin: 0 8px;">·</span>
              <span>{{ t('settings.maxTokens') }}: {{ profile.defaultMaxTokens }}</span>
            </div>
            <div v-if="profile.endpoint" style="font-size: 11px; color: var(--n-text-color-3); margin-top: 2px;">
              {{ profile.endpoint }}
            </div>
          </div>

          <NSpace :size="4">
            <NButton size="tiny" @click="openEditModal(profile.id)">{{ t('settings.edit') }}</NButton>
            <NButton
              v-if="!profile.isActive"
              size="tiny"
              type="primary"
              ghost
              @click="profileStore.setActive(profile.id)"
            >
              {{ t('settings.activate') }}
            </NButton>
            <NPopconfirm @positive-click="profileStore.deleteProfile(profile.id)">
              <template #trigger>
                <NButton size="tiny" type="error" ghost>
                  <template #icon><NIcon size="14"><TrashOutline /></NIcon></template>
                </NButton>
              </template>
              {{ t('settings.confirmDelete') }}
            </NPopconfirm>
          </NSpace>
        </div>
      </NCard>
    </NSpin>

    <!-- Add/Edit Modal -->
    <NModal v-model:show="showModal" preset="card" :title="editingProfile ? t('settings.editProfile') : t('settings.addProfile')" style="width: 500px;">
      <NForm label-placement="top">
        <NFormItem :label="t('settings.profileName')" required>
          <NInput v-model:value="formData.name" :placeholder="t('settings.profileNamePlaceholder')" />
        </NFormItem>

        <NFormItem :label="t('settings.provider')" required>
          <NSelect
            v-model:value="formData.provider"
            :options="providerOptions"
            @update:value="onProviderChange"
          />
        </NFormItem>

        <NFormItem :label="t('settings.apiKey')" :required="!editingProfile">
          <NInput
            v-model:value="formData.apiKey"
            type="password"
            show-password-on="click"
            :placeholder="editingProfile ? t('settings.apiKeyLeaveEmpty') : t('settings.apiKeyPlaceholder')"
          >
            <template #prefix><NIcon><KeyOutline /></NIcon></template>
          </NInput>
        </NFormItem>

        <NFormItem :label="t('settings.endpointUrl')">
          <NInput v-model:value="formData.endpoint" :placeholder="t('settings.endpointAuto')" />
        </NFormItem>

        <NFormItem :label="t('settings.defaultModel')">
          <NInput v-model:value="formData.defaultModel" :placeholder="providerModelDefaults[formData.provider]" />
        </NFormItem>

        <NFormItem :label="t('settings.maxTokens')">
          <NInput v-model:value="formData.defaultMaxTokens" type="number" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">{{ t('settings.cancel') }}</NButton>
          <NButton type="primary" @click="handleSave" :disabled="!formData.name || (!formData.apiKey && !editingProfile)">
            {{ editingProfile ? t('settings.update') : t('settings.create') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
