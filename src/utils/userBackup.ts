import { useStudyStore, type StudyBackupV1 } from '@/stores/study'
import { useDeckStore, type DeckDataV1 } from '@/stores/decks'
import { useSettingsStore, type PersistedSettings } from '@/stores/settings'

export interface UserBackupV2 {
  kind: 'laochristian-user-backup'
  schemaVersion: 2
  exportedAt: string
  study: StudyBackupV1
  decks: DeckDataV1
  settings: PersistedSettings
}

export async function createUserBackup(): Promise<UserBackupV2> {
  const study = useStudyStore()
  const decks = useDeckStore()
  const settings = useSettingsStore()
  await Promise.all([study.load(), decks.load(), settings.load()])
  return {
    kind: 'laochristian-user-backup',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    study: study.createBackup(),
    decks: decks.createBackupData(),
    settings: settings.createBackupData(),
  }
}

export async function importUserBackup(value: unknown, mode: 'merge' | 'replace' = 'merge'): Promise<void> {
  const study = useStudyStore()
  const decks = useDeckStore()
  const settings = useSettingsStore()
  if (value && typeof value === 'object' && (value as Partial<UserBackupV2>).kind === 'laochristian-user-backup') {
    const backup = value as UserBackupV2
    if (backup.schemaVersion !== 2 || !backup.study || !backup.decks || !backup.settings) throw new Error('This is not a valid LaoChristian user backup.')
    await study.importBackup(backup.study, mode)
    await decks.importBackupData(backup.decks, mode)
    await settings.importBackupData(backup.settings)
    return
  }
  // Continue accepting the earlier study-only backup format.
  await study.importBackup(value as StudyBackupV1, mode)
}

export function downloadUserBackup(backup: UserBackupV2): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `laochristian-user-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
