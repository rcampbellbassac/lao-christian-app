<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  useStudyStore,
  type HighlightRecord,
  type NoteRecord,
  type StudyRecord,
} from '@/stores/study'
import { createUserBackup, downloadUserBackup, importUserBackup } from '@/utils/userBackup'
import { useStaticText } from '@/composables/useStaticText'
import BilingualText from '@/components/BilingualText.vue'
import DevelopmentNotice from '@/components/DevelopmentNotice.vue'
import StudyNoteDialog from '@/components/StudyNoteDialog.vue'

type StudySection = 'all' | 'bookmarks' | 'highlights' | 'notes'
type StudyListItem =
  | (StudyRecord & { kind: 'bookmarks' })
  | (HighlightRecord & { kind: 'highlights' })
  | (NoteRecord & { kind: 'notes' })

const study = useStudyStore()
const importInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importMode = ref<'merge' | 'replace'>('merge')
const activeSection = ref<StudySection>('all')
const query = ref('')
const editingNote = ref<NoteRecord | null>(null)
const copy = useStaticText()

onMounted(() => study.load())

const allItems = computed<StudyListItem[]>(() =>
  [
    ...study.bookmarks.map((item) => ({ ...item, kind: 'bookmarks' as const })),
    ...study.highlights.map((item) => ({ ...item, kind: 'highlights' as const })),
    ...study.notes.map((item) => ({ ...item, kind: 'notes' as const })),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
)

const visibleItems = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  return allItems.value.filter((item) => {
    if (activeSection.value !== 'all' && item.kind !== activeSection.value) return false
    if (!needle) return true
    const body = item.kind === 'notes' ? item.body : ''
    return [item.title, item.bookTitle, item.quote, body]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
      .includes(needle)
  })
})

const tabs: Array<{
  id: StudySection
  key: 'study.all' | 'study.bookmarks' | 'study.highlights' | 'study.notes'
}> = [
  { id: 'all', key: 'study.all' },
  { id: 'bookmarks', key: 'study.bookmarks' },
  { id: 'highlights', key: 'study.highlights' },
  { id: 'notes', key: 'study.notes' },
]

function contentPath(item: {
  fileId: number
  bookId: number
  chapterId: number
  blockIndex?: number
}): string {
  const base = `/content/${item.fileId}/${item.bookId}/${item.chapterId}`
  return item.blockIndex === undefined ? base : `${base}#study-block-${item.blockIndex}`
}

function countFor(section: StudySection): number {
  if (section === 'all') return allItems.value.length
  return allItems.value.filter((item) => item.kind === section).length
}

async function exportBackup(): Promise<void> {
  downloadUserBackup(await createUserBackup())
}

async function importBackup(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    importMessage.value = copy.text('study.backupTooLarge')
    return
  }
  try {
    await importUserBackup(JSON.parse(await file.text()), importMode.value)
    importMessage.value =
      importMode.value === 'merge'
        ? copy.text('study.backupMerged')
        : copy.text('study.backupReplaced')
  } catch (error) {
    importMessage.value = error instanceof Error ? error.message : copy.text('study.importFailed')
  } finally {
    if (importInput.value) importInput.value.value = ''
  }
}

async function saveEditedNote(body: string): Promise<void> {
  if (!editingNote.value) return
  await study.updateNote(editingNote.value.id, body)
  editingNote.value = null
}

async function removeItem(item: StudyListItem): Promise<void> {
  if (!window.confirm(copy.text('study.confirmDelete'))) return
  await study.removeRecord(item.kind, item.id)
}
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <DevelopmentNotice />
      <div class="study-heading">
        <div>
          <h1 class="app-section-title">ການສຶກສາຂອງຂ້ອຍ</h1>
          <p class="app-muted"><BilingualText text-key="study.localOnly" /></p>
        </div>
        <details class="study-backup">
          <summary class="app-chip app-control">{{ copy.text('study.backup') }}</summary>
          <div class="study-backup-panel">
            <p class="app-muted text-sm"><BilingualText text-key="study.privateWarning" /></p>
            <button type="button" class="app-chip app-control" @click="exportBackup">
              ⇩ {{ copy.text('study.export') }}
            </button>
            <select
              v-model="importMode"
              class="app-chip app-control"
              :aria-label="copy.text('study.importMode')"
            >
              <option value="merge">{{ copy.text('study.merge') }}</option>
              <option value="replace">{{ copy.text('study.replace') }}</option>
            </select>
            <label class="app-chip app-control cursor-pointer"
              >⇧ {{ copy.text('study.import')
              }}<input
                ref="importInput"
                type="file"
                accept="application/json,.json"
                class="sr-only"
                @change="importBackup"
            /></label>
            <p v-if="importMessage" class="text-sm" role="status">{{ importMessage }}</p>
          </div>
        </details>
      </div>

      <section v-if="study.history.length" class="study-continue">
        <h2><BilingualText text-key="study.continue" /></h2>
        <div class="study-continue-list">
          <router-link
            v-for="item in study.history.slice(0, 4)"
            :key="`${item.fileId}:${item.bookId}:${item.chapterId}`"
            :to="contentPath(item)"
            class="study-continue-card"
          >
            <strong>{{ item.title }}</strong
            ><small>{{ new Date(item.visitedAt).toLocaleDateString() }}</small>
          </router-link>
        </div>
      </section>

      <div class="study-tools">
        <div class="study-tabs" role="tablist" :aria-label="copy.text('study.savedItems')">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            role="tab"
            class="study-tab"
            :class="{ 'study-tab--active': activeSection === tab.id }"
            :aria-selected="activeSection === tab.id"
            @click="activeSection = tab.id"
          >
            {{ copy.text(tab.key) }} <span>{{ countFor(tab.id) }}</span>
          </button>
        </div>
        <input
          v-model="query"
          type="search"
          class="study-search"
          :placeholder="copy.text('study.searchSaved')"
          :aria-label="copy.text('study.searchSaved')"
        />
      </div>

      <div v-if="!allItems.length" class="study-empty">
        <BilingualText text-key="study.empty" />
      </div>
      <div v-else-if="!visibleItems.length" class="study-empty">
        {{ copy.text('study.noMatches') }}
      </div>
      <ul v-else class="study-grid">
        <li v-for="item in visibleItems" :key="`${item.kind}:${item.id}`" class="study-card">
          <div class="study-card-meta">
            <span class="study-kind">{{ copy.text(`study.${item.kind}`) }}</span>
            <span class="study-scope">{{
              copy.text(
                item.blockIndex === undefined ? 'study.chapterScope' : 'study.paragraphScope',
              )
            }}</span>
            <span v-if="item.unmatched" class="study-warning">!</span>
          </div>
          <router-link :to="contentPath(item)" class="study-card-title">{{
            item.title
          }}</router-link>
          <p v-if="item.bookTitle" class="app-muted text-sm">{{ item.bookTitle }}</p>
          <blockquote v-if="item.quote" class="study-quote">{{ item.quote }}</blockquote>
          <p v-if="item.kind === 'notes'" class="study-note-body">{{ item.body }}</p>
          <p v-if="item.unmatched" class="study-unmatched">
            <BilingualText text-key="study.unmatched" />
          </p>
          <footer>
            <button
              v-if="item.kind === 'notes'"
              type="button"
              class="app-chip app-control"
              @click="editingNote = item"
            >
              {{ copy.text('study.editNote') }}
            </button>
            <router-link :to="contentPath(item)" class="app-chip app-control"
              >{{ copy.text('study.open') }} →</router-link
            >
            <button type="button" class="study-delete" @click="removeItem(item)">
              × <span class="sr-only">{{ copy.text('study.deleteItem') }}</span>
            </button>
          </footer>
        </li>
      </ul>
    </section>

    <StudyNoteDialog
      :open="Boolean(editingNote)"
      :quote="editingNote?.quote"
      :initial-body="editingNote?.body"
      @save="saveEditedNote"
      @cancel="editingNote = null"
    />
  </main>
</template>

<style scoped>
.study-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.study-backup {
  position: relative;
}
.study-backup summary {
  list-style: none;
  cursor: pointer;
}
.study-backup-panel {
  position: absolute;
  right: 0;
  z-index: 20;
  display: flex;
  width: min(30rem, calc(100vw - 2rem));
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.5rem;
  border: 1px solid var(--lc-border);
  border-radius: 0.85rem;
  background: var(--lc-paper);
  padding: 0.85rem;
  box-shadow: var(--app-panel-shadow);
}
.study-backup-panel p {
  width: 100%;
}
.study-continue {
  margin-top: 1.5rem;
}
.study-continue h2 {
  font-size: 1.05rem;
  font-weight: 700;
}
.study-continue-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.6rem;
  margin-top: 0.6rem;
}
.study-continue-card {
  display: grid;
  gap: 0.2rem;
  border: 1px solid var(--lc-border);
  border-radius: 0.75rem;
  background: var(--lc-soft);
  padding: 0.7rem;
}
.study-continue-card small {
  color: var(--app-muted);
}
.study-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-top: 1.6rem;
}
.study-tabs {
  display: flex;
  max-width: 100%;
  gap: 0.35rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}
.study-tab {
  min-height: 2.75rem;
  white-space: nowrap;
  border: 1px solid var(--lc-border);
  border-radius: 999px;
  color: var(--app-muted);
  padding: 0.45rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
}
.study-tab span {
  opacity: 0.65;
}
.study-tab--active {
  border-color: transparent;
  background: var(--lc-brand);
  color: #f6f1e7;
}
.study-search {
  min-height: 2.75rem;
  min-width: min(18rem, 100%);
  flex: 1;
  border: 1px solid var(--lc-border);
  border-radius: 999px;
  background: var(--app-panel);
  color: var(--app-ink);
  padding: 0.55rem 0.9rem;
}
.study-empty {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--app-muted);
}
.study-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(19rem, 100%), 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}
.study-card {
  display: grid;
  align-content: start;
  gap: 0.55rem;
  border: 1px solid var(--lc-border);
  border-radius: 0.95rem;
  background: var(--app-panel);
  padding: 1rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}
.study-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.study-kind,
.study-scope {
  border-radius: 999px;
  background: var(--lc-soft);
  color: var(--lc-brand);
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
}
.study-scope {
  color: var(--app-muted);
}
.study-warning {
  display: grid;
  width: 1.4rem;
  height: 1.4rem;
  place-items: center;
  border-radius: 999px;
  background: var(--lc-clay);
  color: white;
  font-weight: 800;
}
.study-card-title {
  color: var(--app-ink);
  font-size: 1.05rem;
  font-weight: 700;
}
.study-card-title:hover {
  color: var(--lc-brand);
  text-decoration: underline;
}
.study-quote {
  display: -webkit-box;
  overflow: hidden;
  border-left: 3px solid var(--lc-gold);
  color: var(--app-muted);
  padding-left: 0.7rem;
  font-size: 0.9rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.study-note-body {
  white-space: pre-wrap;
  line-height: 1.55;
}
.study-unmatched {
  color: var(--lc-clay);
  font-size: 0.78rem;
  font-weight: 700;
}
.study-card footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.3rem;
}
.study-delete {
  min-width: 2.75rem;
  min-height: 2.75rem;
  margin-left: auto;
  border-radius: 999px;
  color: var(--lc-clay);
  font-size: 1.15rem;
}
@media (max-width: 639px) {
  .study-backup {
    width: 100%;
  }
  .study-backup summary {
    justify-content: center;
  }
  .study-backup-panel {
    position: static;
    width: 100%;
  }
  .study-search {
    width: 100%;
  }
}
</style>
