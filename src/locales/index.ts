import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

// Detect system language, default to zh-CN
function detectLanguage(): string {
  // Check stored preference first
  try {
    const stored = localStorage.getItem('claudedesk-language')
    if (stored && ['zh-CN', 'en-US'].includes(stored)) {
      return stored
    }
  } catch { /* localStorage not available */ }

  // Fall back to system language
  const lang = navigator.language
  if (lang.startsWith('zh')) return 'zh-CN'
  return 'en-US'
}

export const SUPPORTED_LOCALES = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
] as const

const i18n = createI18n({
  legacy: false,        // Use Composition API mode
  locale: detectLanguage(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n

/** Switch locale and persist preference */
export function switchLocale(locale: string): void {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem('claudedesk-language', locale)
  } catch { /* ignore */ }
}
