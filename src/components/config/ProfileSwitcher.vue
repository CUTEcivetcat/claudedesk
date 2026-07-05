<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from '../../stores/profile'
import { NSelect, NText } from 'naive-ui'
import { computed } from 'vue'

const router = useRouter()
const profileStore = useProfileStore()
const { t } = useI18n()

const options = computed(() =>
  profileStore.profiles.map(p => ({
    label: `${p.name} (${p.provider})`,
    value: p.id
  }))
)

const selectedId = computed(() =>
  profileStore.activeProfile?.id || null
)

function handleChange(id: string) {
  profileStore.setActive(id)
}
</script>

<template>
  <div style="display: flex; align-items: center; gap: 6px;">
    <NText depth="3" style="font-size: 11px; white-space: nowrap;">{{ t('profile.switcherLabel') }}</NText>
    <NSelect
      v-if="profileStore.hasProfiles"
      :value="selectedId"
      :options="options"
      size="tiny"
      style="width: 180px;"
      @update:value="handleChange"
    />
    <NText
      v-else
      depth="3"
      style="font-size: 12px; cursor: pointer; text-decoration: underline;"
      @click="router.push('/settings')"
    >
      {{ t('profile.configureHint') }}
    </NText>
  </div>
</template>
