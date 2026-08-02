import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export const uiMessages = {
  home: { lo: 'ໜ້າຫຼັກ', en: 'Home' },
  about: { lo: 'ກ່ຽວກັບ', en: 'About' },
  settings: { lo: 'ການຕັ້ງຄ່າ', en: 'Settings' },
  search: { lo: 'ຄົ້ນຫາ', en: 'Search' },
  chooseApplication: { lo: 'ເລືອກແຫຼ່ງຂໍ້ມູນ', en: 'Choose a resource' },
  openCollection: { lo: 'ເປີດເບິ່ງ', en: 'Open collection' },
  darkMode: { lo: 'ໂໝດມືດ', en: 'Dark mode' },
  lightMode: { lo: 'ໂໝດສະຫວ່າງ', en: 'Light mode' },
  bilingual: { lo: 'ລາວ + English', en: 'Bilingual assistance' },
  laoOnly: { lo: 'ພາສາລາວ', en: 'Lao only' },
  myStudy: { lo: 'ການສຶກສາຂອງຂ້ອຍ', en: 'My Study' },
} as const

export type UiMessageKey = keyof typeof uiMessages

export function useUiText() {
  const settings = useSettingsStore()

  function lao(key: UiMessageKey): string {
    return uiMessages[key].lo
  }

  function english(key: UiMessageKey): string | undefined {
    return settings.bilingualUi ? uiMessages[key].en : undefined
  }

  function accessible(key: UiMessageKey): string {
    const message = uiMessages[key]
    return `${message.lo} — ${message.en}`
  }

  return {
    bilingual: computed(() => settings.bilingualUi),
    lao,
    english,
    accessible,
  }
}
