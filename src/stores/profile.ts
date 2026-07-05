import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProfilePublic, CreateProfileInput } from '../../shared/types'

export const useProfileStore = defineStore('profile', () => {
  const profiles = ref<ProfilePublic[]>([])
  const activeProfile = ref<ProfilePublic | null>(null)
  const isLoading = ref(false)

  const hasProfiles = computed(() => profiles.value.length > 0)
  const activeProfileId = computed(() => activeProfile.value?.id || null)

  async function loadProfiles() {
    isLoading.value = true
    try {
      const result = await window.electronAPI.listProfiles()
      if (result.success && result.data) {
        profiles.value = result.data
        activeProfile.value = result.data.find(p => p.isActive) || result.data[0] || null
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createProfile(input: CreateProfileInput) {
    const result = await window.electronAPI.createProfile(input)
    if (result.success && result.data) {
      profiles.value.unshift(result.data)
      if (result.data.isActive) {
        activeProfile.value = result.data
      }
    }
    return result
  }

  async function updateProfile(id: string, data: Partial<CreateProfileInput>) {
    const result = await window.electronAPI.updateProfile({ id, ...data })
    if (result.success && result.data) {
      const idx = profiles.value.findIndex(p => p.id === id)
      if (idx !== -1) {
        profiles.value[idx] = result.data
      }
      if (result.data.isActive) {
        activeProfile.value = result.data
      }
    }
    return result
  }

  async function deleteProfile(id: string) {
    const result = await window.electronAPI.deleteProfile(id)
    if (result.success) {
      profiles.value = profiles.value.filter(p => p.id !== id)
      if (activeProfile.value?.id === id) {
        activeProfile.value = profiles.value[0] || null
      }
    }
    return result
  }

  async function setActive(id: string) {
    const result = await window.electronAPI.setActiveProfile(id)
    if (result.success && result.data) {
      activeProfile.value = result.data
      profiles.value.forEach(p => {
        p.isActive = p.id === id
      })
    }
    return result
  }

  return {
    profiles,
    activeProfile,
    isLoading,
    hasProfiles,
    activeProfileId,
    loadProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    setActive
  }
})
