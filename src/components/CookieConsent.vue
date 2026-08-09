<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BilingualText from '@/components/BilingualText.vue'

const show = ref(false)
const consentCookie = 'cookieConsent=true'

onMounted(() => {
  show.value = !document.cookie.split(';').some((cookie) => cookie.trim() === consentCookie)
})

function agree(): void {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${consentCookie}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`
  show.value = false
}
</script>

<template>
  <transition name="consent-fade">
    <aside v-if="show" class="consent" role="region" aria-labelledby="cookie-consent-title">
      <div>
        <h2 id="cookie-consent-title" class="consent-title">
          <BilingualText text-key="consent.title" />
        </h2>
        <p class="consent-copy"><BilingualText text-key="consent.message" /></p>
      </div>
      <div class="consent-actions">
        <RouterLink to="/cookie-policy" class="app-chip"
          ><BilingualText text-key="consent.read"
        /></RouterLink>
        <button type="button" class="consent-agree" @click="agree">
          ✓ <BilingualText text-key="consent.agree" />
        </button>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
.consent {
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  left: max(1rem, env(safe-area-inset-left));
  z-index: 60;
  display: flex;
  max-width: 52rem;
  margin-inline: auto;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid var(--lc-border);
  border-radius: 1rem;
  padding: 1rem;
  background: var(--app-panel);
  color: var(--app-ink);
  box-shadow: var(--app-panel-shadow);
  backdrop-filter: blur(18px);
}
.consent-title {
  font-size: 1rem;
  font-weight: 800;
}
.consent-copy {
  margin-top: 0.3rem;
  font-size: 0.85rem;
}
.consent-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.5rem;
}
.consent-agree {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.6rem 0.9rem;
  background: var(--lc-brand);
  color: white;
  font-weight: 700;
}
.consent-fade-enter-active,
.consent-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.consent-fade-enter-from,
.consent-fade-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
@media (max-width: 1023px) {
  .consent {
    bottom: calc(4.7rem + env(safe-area-inset-bottom));
  }
}
@media (max-width: 639px) {
  .consent {
    align-items: stretch;
    flex-direction: column;
  }
  .consent-actions {
    justify-content: flex-end;
  }
}
</style>
