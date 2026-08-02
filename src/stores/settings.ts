import { ref } from 'vue'
import { defineStore } from 'pinia'
import localforage from 'localforage'
import type { AspectRatioId } from '@/utils/aspectRatios'
import { DEFAULT_ASPECT_RATIO_ID } from '@/utils/aspectRatios'
import type { LaoFontId } from '@/utils/laoFonts'
import { DEFAULT_LAO_FONT_ID } from '@/utils/laoFonts'
import type { PresentationThemeId } from '@/utils/presentationThemes'
import { DEFAULT_PRESENTATION_THEME_ID } from '@/utils/presentationThemes'

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

export type PresentationTextAlign = 'left' | 'center'

export interface PersistedSettings {
  bilingualUi: boolean
  contentFontScale: number
  presentationFontScale: number
  presentationAspectRatio: AspectRatioId
  presentationTheme: PresentationThemeId
  presentationTextAlign: PresentationTextAlign
  presentationFontFamily: LaoFontId
  presentationBlocksPerSlide: number
  presentationLinesPerSlide: number
}

const defaultSettings: PersistedSettings = {
  bilingualUi: false,
  contentFontScale: 1,
  presentationFontScale: 1,
  presentationAspectRatio: DEFAULT_ASPECT_RATIO_ID,
  presentationTheme: DEFAULT_PRESENTATION_THEME_ID,
  presentationTextAlign: 'left',
  presentationFontFamily: DEFAULT_LAO_FONT_ID,
  presentationBlocksPerSlide: 4,
  presentationLinesPerSlide: 10,
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, value)))
}

function clampScale(value: number): number {
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value))
}

export const useSettingsStore = defineStore('settings', () => {
  const bilingualUi = ref(defaultSettings.bilingualUi)
  const contentFontScale = ref(defaultSettings.contentFontScale)
  const presentationFontScale = ref(defaultSettings.presentationFontScale)
  const presentationAspectRatio = ref<AspectRatioId>(defaultSettings.presentationAspectRatio)
  const presentationTheme = ref<PresentationThemeId>(defaultSettings.presentationTheme)
  const presentationTextAlign = ref<PresentationTextAlign>(defaultSettings.presentationTextAlign)
  const presentationFontFamily = ref<LaoFontId>(defaultSettings.presentationFontFamily)
  const presentationBlocksPerSlide = ref(defaultSettings.presentationBlocksPerSlide)
  const presentationLinesPerSlide = ref(defaultSettings.presentationLinesPerSlide)
  const isLoaded = ref(false)

  async function persist(): Promise<void> {
    const snapshot: PersistedSettings = {
      bilingualUi: bilingualUi.value,
      contentFontScale: contentFontScale.value,
      presentationFontScale: presentationFontScale.value,
      presentationAspectRatio: presentationAspectRatio.value,
      presentationTheme: presentationTheme.value,
      presentationTextAlign: presentationTextAlign.value,
      presentationFontFamily: presentationFontFamily.value,
      presentationBlocksPerSlide: presentationBlocksPerSlide.value,
      presentationLinesPerSlide: presentationLinesPerSlide.value,
    }
    await settingsStorage.setItem(SETTINGS_KEY, snapshot)
  }

  async function load(): Promise<void> {
    if (isLoaded.value) return

    const stored = await settingsStorage.getItem<Partial<PersistedSettings>>(SETTINGS_KEY)
    if (stored) {
      bilingualUi.value = stored.bilingualUi ?? defaultSettings.bilingualUi
      contentFontScale.value = clampScale(stored.contentFontScale ?? defaultSettings.contentFontScale)
      presentationFontScale.value = clampScale(stored.presentationFontScale ?? defaultSettings.presentationFontScale)
      presentationAspectRatio.value = stored.presentationAspectRatio ?? defaultSettings.presentationAspectRatio
      presentationTheme.value = stored.presentationTheme ?? defaultSettings.presentationTheme
      presentationTextAlign.value = stored.presentationTextAlign ?? defaultSettings.presentationTextAlign
      presentationFontFamily.value = stored.presentationFontFamily ?? defaultSettings.presentationFontFamily
      presentationBlocksPerSlide.value = clampInteger(stored.presentationBlocksPerSlide ?? defaultSettings.presentationBlocksPerSlide, 1, 10)
      presentationLinesPerSlide.value = clampInteger(stored.presentationLinesPerSlide ?? defaultSettings.presentationLinesPerSlide, 3, 24)
    }

    isLoaded.value = true
  }

  function setContentFontScale(value: number): void {
    contentFontScale.value = clampScale(value)
    void persist()
  }

  function setBilingualUi(value: boolean): void {
    bilingualUi.value = value
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

  function setPresentationTheme(value: PresentationThemeId): void {
    presentationTheme.value = value
    void persist()
  }

  function setPresentationTextAlign(value: PresentationTextAlign): void {
    presentationTextAlign.value = value
    void persist()
  }

  function setPresentationFontFamily(value: LaoFontId): void {
    presentationFontFamily.value = value
    void persist()
  }

  function setPresentationBlocksPerSlide(value: number): void {
    presentationBlocksPerSlide.value = clampInteger(value, 1, 10)
    void persist()
  }

  function setPresentationLinesPerSlide(value: number): void {
    presentationLinesPerSlide.value = clampInteger(value, 3, 24)
    void persist()
  }

  function resetContentFontScale(): void {
    setContentFontScale(defaultSettings.contentFontScale)
  }

  function resetPresentationFontScale(): void {
    setPresentationFontScale(defaultSettings.presentationFontScale)
  }

  function createBackupData(): PersistedSettings {
    return {
      bilingualUi: bilingualUi.value,
      contentFontScale: contentFontScale.value,
      presentationFontScale: presentationFontScale.value,
      presentationAspectRatio: presentationAspectRatio.value,
      presentationTheme: presentationTheme.value,
      presentationTextAlign: presentationTextAlign.value,
      presentationFontFamily: presentationFontFamily.value,
      presentationBlocksPerSlide: presentationBlocksPerSlide.value,
      presentationLinesPerSlide: presentationLinesPerSlide.value,
    }
  }

  async function importBackupData(value: Partial<PersistedSettings>): Promise<void> {
    if (!value || typeof value !== 'object') throw new Error('Invalid settings backup data.')
    bilingualUi.value = value.bilingualUi ?? bilingualUi.value
    contentFontScale.value = clampScale(value.contentFontScale ?? contentFontScale.value)
    presentationFontScale.value = clampScale(value.presentationFontScale ?? presentationFontScale.value)
    presentationAspectRatio.value = value.presentationAspectRatio ?? presentationAspectRatio.value
    presentationTheme.value = value.presentationTheme ?? presentationTheme.value
    presentationTextAlign.value = value.presentationTextAlign ?? presentationTextAlign.value
    presentationFontFamily.value = value.presentationFontFamily ?? presentationFontFamily.value
    presentationBlocksPerSlide.value = clampInteger(value.presentationBlocksPerSlide ?? presentationBlocksPerSlide.value, 1, 10)
    presentationLinesPerSlide.value = clampInteger(value.presentationLinesPerSlide ?? presentationLinesPerSlide.value, 3, 24)
    await persist()
  }

  return {
    bilingualUi,
    contentFontScale,
    presentationFontScale,
    presentationAspectRatio,
    presentationTheme,
    presentationTextAlign,
    presentationFontFamily,
    presentationBlocksPerSlide,
    presentationLinesPerSlide,
    isLoaded,
    load,
    setBilingualUi,
    setContentFontScale,
    setPresentationFontScale,
    setPresentationAspectRatio,
    setPresentationTheme,
    setPresentationTextAlign,
    setPresentationFontFamily,
    setPresentationBlocksPerSlide,
    setPresentationLinesPerSlide,
    resetContentFontScale,
    resetPresentationFontScale,
    createBackupData,
    importBackupData,
  }
})
