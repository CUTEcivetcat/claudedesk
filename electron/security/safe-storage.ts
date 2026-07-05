import { safeStorage } from 'electron'

/**
 * Encrypt an API key using OS-level encryption (DPAPI on Windows, Keychain on macOS).
 * Returns a Buffer that can be stored as base64 string.
 * Prepends a version marker so we know how to decrypt later.
 */
const ENCRYPTED_PREFIX = 'ENC:'

export function encryptApiKey(apiKey: string): Buffer {
  if (!safeStorage.isEncryptionAvailable()) {
    // Fallback: store as plain text with marker indicating it's NOT encrypted
    console.warn('safeStorage not available — storing key as plain text (not encrypted)')
    return Buffer.from('PLAIN:' + apiKey, 'utf-8')
  }
  const encrypted = safeStorage.encryptString(apiKey)
  // Prepend marker so decrypt knows this is actually encrypted
  const marked = Buffer.concat([Buffer.from(ENCRYPTED_PREFIX), encrypted])
  return marked
}

/**
 * Decrypt an API key. Handles both encrypted and plaintext storage transparently.
 */
export function decryptApiKey(data: Buffer): string {
  const str = data.toString('utf-8')

  // Check if it was stored as plain text
  if (str.startsWith('PLAIN:')) {
    return str.slice(6)
  }

  // Check if it's encrypted with our marker
  if (str.startsWith(ENCRYPTED_PREFIX)) {
    const encryptedPart = data.subarray(ENCRYPTED_PREFIX.length)
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('safeStorage not available — cannot decrypt API key')
    }
    return safeStorage.decryptString(encryptedPart)
  }

  // Legacy: try decrypting directly, fall back to treating as plain text
  if (safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(data)
    } catch {
      // Must be plain text stored before encryption was available
      return str
    }
  }

  // No encryption available, assume plain text
  return str
}

/**
 * Mask an API key for display: "sk-ant-...xxxx"
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****'
  const prefix = apiKey.slice(0, 6)
  const suffix = apiKey.slice(-4)
  return `${prefix}...${suffix}`
}
