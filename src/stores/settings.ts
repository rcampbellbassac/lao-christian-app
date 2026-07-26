import { ref } from 'vue'
import { defineStore } from 'pinia'
import localforage from 'localforage'
import type { AspectRatioId } from '@/utils/aspectRatios'
import { DEFAULT_ASPECT_RATIO_ID } from '@/utils/aspectRatios'

const settingsStorage = localforage.createInstance({
  name: 'lao-christian-app',
  storeName: 'app-settings',
  description: 'User preferences for Lao Christian App',
})

const SETTINGS_KEY = 'preferences'

// Bounds are chosen to stay on the same 10%-step grid as the 100% default
// (60, 70, ... 100, ... 250), so +/- never drifts off-step at the edges.
export const FONT_SCALE_MIN = 0.6
export const FONT_SCALE_MAX = 2.5
export const FONT_SCALE_STEP = 0.1

interface PersistedSettings {
  contentFontScale: number
  presentationFontScale: number
  presentationAspectRatio: AspectRatioId
}

const defaultSettings: PersistedSettings = {
  contentFontScale: 1,
  presentationFontScale: 1,
  presentationAspectRatio: DEFAULT_ASPECT_RATIO_ID,
}

function clampScale(value: number): number {
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value))
}

export const useSettingsStore = defineStore('settings', () => {
  const contentFontScale = ref(defaultSettings.contentFontScale)
  const presentationFontScale = ref(defaultSettings.presentationFontScale)
  const presentationAspectRatio = ref<AspectRatioId>(defaultSettings.presentationAspectRatio)
  const isLoaded = ref(false)

  async function persist(): Promise<void> {
    const snapshot: PersistedSettings = {
      contentFontScale: contentFontScale.value,
      presentationFontScale: presentationFontScale.value,
      presentationAspectRatio: presentationAspectRatio.value,
    }
    await settingsStorage.setItem(SETTINGS_KEY, snapshot)
  }

  async function load(): Promise<void> {
    if (isLoaded.value) return

    const stored = await settingsStorage.getItem<Partial<PersistedSettings>>(SETTINGS_KEY)
    if (stored) {
      contentFontScale.value = clampScale(stored.contentFontScale ?? defaultSettings.contentFontScale)
      presentationFontScale.value = clampScale(stored.presentationFontScale ?? defaultSettings.presentationFontScale)
      presentationAspectRatio.value = stored.presentationAspectRatio ?? defaultSettings.presentationAspectRatio
    }

    isLoaded.value = true
  }

  function setContentFontScale(value: number): void {
    contentFontScale.value = clampScale(value)
    void persist()
  }

  function setPresentationFontScale(value: number): void {
    presentationFontScale.value = clampScale(value)
    void persist()
  }

  function setPresentationAspectRatio(value: AspectRatioId): void {
    presentationAspectRatio.value = value
    void persist()
  }

  function resetContentFontScale(): void {
    setContentFontScale(defaultSettings.contentFontScale)
  }

  function resetPresentationFontScale(): void {
    setPresentationFontScale(defaultSettings.presentationFontScale)
  }

  return {
    contentFontScale,
    presentationFontScale,
    presentationAspectRatio,
    isLoaded,
    load,
    setContentFontScale,
    setPresentationFontScale,
    setPresentationAspectRatio,
    resetContentFontScale,
    resetPresentationFontScale,
  }
})
