import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('localforage', () => ({
  default: { createInstance: () => ({ getItem: async () => null, setItem: async (_key: string, value: unknown) => value }) },
}))

import { useSettingsStore } from '@/stores/settings'
import { useStaticText } from './useStaticText'

describe('static app localization', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows Lao by default and adds English only in bilingual mode', () => {
    const settings = useSettingsStore()
    const copy = useStaticText()
    expect(copy.text('settings.title')).toBe('ການຕັ້ງຄ່າ')
    settings.setBilingualUi(true)
    expect(copy.text('settings.title')).toBe('ການຕັ້ງຄ່າ · Settings')
  })
})
