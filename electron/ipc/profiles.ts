import { ipcMain } from 'electron'
import * as channels from '../../shared/ipc-channels'
import type { CreateProfileInput, UpdateProfileInput, ProfilePublic } from '../../shared/types'
import {
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  setActiveProfile
} from '../db/repositories/profiles'
import { encryptApiKey, decryptApiKey } from '../security/safe-storage'

function toPublic(profile: any): ProfilePublic {
  return {
    id: profile.id,
    name: profile.name,
    provider: profile.provider,
    endpoint: profile.endpoint || '',
    defaultModel: profile.defaultModel || '',
    defaultMaxTokens: profile.defaultMaxTokens || 4096,
    isActive: !!profile.isActive,
    hasKey: !!(profile.apiKeyEncrypted),
    createdAt: profile.createdAt || '',
    updatedAt: profile.updatedAt || ''
  }
}

export function registerProfileHandlers(): void {
  ipcMain.handle(channels.PROFILES_LIST, async () => {
    try {
      const profiles = getAllProfiles()
      return { success: true, data: profiles.map(toPublic) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.PROFILES_GET, async (_event, { id }) => {
    try {
      const profile = getProfileById(id)
      return { success: true, data: profile ? toPublic(profile) : null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.PROFILES_CREATE, async (_event, input: CreateProfileInput) => {
    try {
      const encryptedKey = encryptApiKey(input.apiKey)
      const profile = createProfile(input, encryptedKey)
      return { success: true, data: toPublic(profile) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.PROFILES_UPDATE, async (_event, input: UpdateProfileInput) => {
    try {
      let encryptedKey: Buffer | undefined
      if (input.apiKey) {
        encryptedKey = encryptApiKey(input.apiKey)
      }
      const profile = updateProfile(input.id, input, encryptedKey)
      return { success: true, data: profile ? toPublic(profile) : null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.PROFILES_DELETE, async (_event, { id }) => {
    try {
      deleteProfile(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(channels.PROFILES_SET_ACTIVE, async (_event, { id }) => {
    try {
      const profile = setActiveProfile(id)
      return { success: true, data: profile ? toPublic(profile) : null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
