import en from '@/locales/static.en.json'
import lo from '@/locales/static.lo.json'
import { useSettingsStore } from '@/stores/settings'

export type StaticTextKey = keyof typeof en

export function useStaticText() {
  const settings = useSettingsStore()
  function lao(key: StaticTextKey): string { return lo[key] }
  function english(key: StaticTextKey): string | undefined { return settings.bilingualUi ? en[key] : undefined }
  function text(key: StaticTextKey): string { return settings.bilingualUi ? `${lo[key]} · ${en[key]}` : lo[key] }
  return { lao, english, text }
}
