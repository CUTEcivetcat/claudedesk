import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Conversation } from '../../shared/types'

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([])
  const activeConversationId = ref<string | null>(null)
  const isLoading = ref(false)
  const searchQuery = ref('')

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value) || null
  )

  const filteredConversations = computed(() => {
    if (!searchQuery.value) return conversations.value
    const q = searchQuery.value.toLowerCase()
    return conversations.value.filter(c =>
      c.title.toLowerCase().includes(q)
    )
  })

  async function loadConversations() {
    isLoading.value = true
    try {
      const result = await window.electronAPI.listConversations({ limit: 100 })
      if (result.success && result.data) {
        conversations.value = result.data
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createConversation(profileId: string, model: string): Promise<string | null> {
    const result = await window.electronAPI.createConversation(profileId, model)
    if (result.success && result.data) {
      conversations.value.unshift(result.data)
      return result.data.id
    }
    return null
  }

  async function deleteConversation(id: string) {
    const result = await window.electronAPI.deleteConversation(id)
    if (result.success) {
      conversations.value = conversations.value.filter(c => c.id !== id)
      if (activeConversationId.value === id) {
        activeConversationId.value = null
      }
    }
  }

  async function searchConversations(q: string) {
    searchQuery.value = q
    if (!q.trim()) {
      await loadConversations()
      return
    }
    const result = await window.electronAPI.searchConversations(q)
    if (result.success && result.data) {
      conversations.value = result.data
    }
  }

  function setActive(id: string | null) {
    activeConversationId.value = id
  }

  async function updateTitle(id: string, title: string) {
    const result = await window.electronAPI.updateConversation({ id, title })
    if (result.success && result.data) {
      const idx = conversations.value.findIndex(c => c.id === id)
      if (idx !== -1) {
        conversations.value[idx] = result.data
      }
    }
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    isLoading,
    searchQuery,
    filteredConversations,
    loadConversations,
    createConversation,
    deleteConversation,
    searchConversations,
    setActive,
    updateTitle
  }
})
