<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStaticText } from '@/composables/useStaticText'
import BilingualText from './BilingualText.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    quote?: string
    initialBody?: string
  }>(),
  {
    quote: '',
    initialBody: '',
  },
)
const emit = defineEmits<{
  save: [body: string]
  cancel: []
}>()
const copy = useStaticText()
const draft = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    draft.value = props.initialBody
    await nextTick()
    textarea.value?.focus()
  },
)

function submit(): void {
  if (draft.value.trim()) emit('save', draft.value)
}

function onKeydown(event: KeyboardEvent): void {
  if (props.open && event.key === 'Escape') emit('cancel')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="study-dialog-backdrop" @click.self="emit('cancel')">
      <form
        class="study-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-note-title"
        @submit.prevent="submit"
      >
        <header>
          <h2 id="study-note-title"><BilingualText text-key="reader.studyNote" /></h2>
          <p v-if="quote" class="study-dialog-quote">“{{ quote }}”</p>
        </header>
        <textarea
          ref="textarea"
          v-model="draft"
          rows="7"
          required
          :placeholder="copy.lao('reader.notePlaceholder')"
        ></textarea>
        <footer>
          <button type="button" class="app-chip app-control" @click="emit('cancel')">
            {{ copy.text('action.cancel') }}
          </button>
          <button type="submit" class="study-dialog-save">{{ copy.text('action.save') }}</button>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.study-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  background: rgb(2 6 23 / 0.58);
  padding: 1rem;
}
.study-dialog {
  display: grid;
  width: min(36rem, 100%);
  max-height: min(44rem, 90dvh);
  gap: 1rem;
  overflow: auto;
  border: 1px solid var(--lc-border);
  border-radius: 1rem;
  background: var(--lc-paper);
  color: var(--app-ink);
  padding: 1.1rem;
  box-shadow: 0 28px 80px rgb(0 0 0 / 0.38);
}
.study-dialog h2 {
  font-family: 'Noto Serif Lao Variable', serif;
  font-size: 1.35rem;
  font-weight: 700;
}
.study-dialog-quote {
  display: -webkit-box;
  margin-top: 0.5rem;
  overflow: hidden;
  color: var(--app-muted);
  font-size: 0.88rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.study-dialog textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--lc-border);
  border-radius: 0.75rem;
  background: var(--app-panel);
  color: var(--app-ink);
  padding: 0.8rem;
  line-height: 1.55;
}
.study-dialog footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
}
.study-dialog-save {
  min-height: 2.75rem;
  border-radius: 999px;
  background: var(--lc-brand);
  color: #f6f1e7;
  padding: 0.55rem 1rem;
  font-weight: 700;
}
@media (max-width: 639px) {
  .study-dialog-backdrop {
    align-items: end;
    padding: 0;
  }
  .study-dialog {
    width: 100%;
    max-height: 82dvh;
    border-radius: 1.2rem 1.2rem 0 0;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
}
</style>
