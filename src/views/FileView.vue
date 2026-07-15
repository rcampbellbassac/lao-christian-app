<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

const route = useRoute()
const router = useRouter()
const store = useContentStore()
const updateTimer = ref<number | null>(null)
const updateBusy = ref(false)

async function runUpdateCheckForCurrentSet(): Promise<void> {
  const fileId = parseInt(route.params.fileid as string, 10)
  const key = store.getKeyFromId(fileId)
  if (!key) return
  try {
    await store.checkForContentUpdate(key)
  } catch (err) {
    console.warn('Failed to check content update', err)
  }
}

async function applyUpdateForCurrentSet(): Promise<void> {
  if (updateBusy.value) return

  const fileId = parseInt(route.params.fileid as string, 10)
  const key = store.getKeyFromId(fileId)
  if (!key) return

  updateBusy.value = true
  try {
    await store.applyContentUpdate(key)
  } catch (err) {
    console.warn('Failed to apply content update', err)
  } finally {
    updateBusy.value = false
  }
}

onMounted(async () => {
  const fileId = parseInt(route.params.fileid as string, 10)
  await store.loadIndex()

  const key = store.getKeyFromId(fileId)
  if (!key) {
    router.push({ name: 'home' })
    return
  }

  try {
    await store.loadContentSet(key)
    await runUpdateCheckForCurrentSet()
    updateTimer.value = window.setInterval(() => {
      runUpdateCheckForCurrentSet()
    }, 1000 * 60 * 10)
  } catch (err) {
    console.warn(err)
    router.push({ name: 'home' })
  }
})

onUnmounted(() => {
  if (updateTimer.value !== null) {
    clearInterval(updateTimer.value)
    updateTimer.value = null
  }
})

const contentSet = computed(() => store.currentSetData)
const currentSetKey = computed(() => {
  const fileId = parseInt(route.params.fileid as string, 10)
  return store.getKeyFromId(fileId) ?? null
})
const updateState = computed(() => {
  if (!currentSetKey.value) return null
  return store.getContentUpdateState(currentSetKey.value)
})
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <BreadcrumbNav />
    <section v-if="contentSet">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <img :src="store.getSetById(parseInt(route.params.fileid as string, 10))?.icon" alt="Set Icon" class="h-16 w-16 rounded-xl bg-slate-100 object-contain p-2 dark:bg-slate-700" />
        <div class="min-w-0">
          <h1 v-html="contentSet.title" class="app-section-title"></h1>
          <p v-html="contentSet.description" class="mt-1 text-sm text-slate-600 dark:text-slate-300"></p>
          <div
            v-if="updateState?.hasUpdate"
            class="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-600/60 dark:bg-amber-900/30 dark:text-amber-100"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span>New content is available for this set.</span>
              <button
                class="rounded-md bg-amber-600 px-2 py-1 text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="updateBusy"
                @click="applyUpdateForCurrentSet"
              >
                {{ updateBusy ? 'Updating...' : 'Update now' }}
              </button>
            </div>
          </div>
          <p v-if="store.lastContentRefresh" class="mt-2 text-xs text-slate-500 dark:text-slate-400">Last refresh: {{ new Date(store.lastContentRefresh).toLocaleString() }}</p>
          <p v-if="updateState?.lastChecked" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Last update check: {{ new Date(updateState.lastChecked).toLocaleString() }}
          </p>
        </div>
      </div>

      <hr class="app-divider" />

      <h2 class="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Books</h2>
      <ul class="app-card-list">
        <li v-for="book in contentSet.unit" :key="book.id" class="rounded-xl border border-slate-300/70 bg-white/85 p-3 transition hover:shadow-md dark:border-slate-500/55 dark:bg-slate-950/88">
          <router-link
            :to="{ path: `/content/${route.params.fileid}/${book.id}` }"
            class="app-link text-base"
          >
            📘 <span v-html="book.name"></span>
          </router-link>
          <p v-if="book.content" class="mt-1 text-sm text-slate-600 dark:text-slate-300"><span v-html="book.content"></span></p>
        </li>
      </ul>
    </section>

    <section v-else>
      <p class="text-center text-slate-600 dark:text-slate-300">Loading content set...</p>
    </section>
    </section>
  </main>
</template>
