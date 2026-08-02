<script setup lang="ts">
import BilingualText from '@/components/BilingualText.vue'
</script>

<template>
  <main class="app-page">
    <article class="app-panel policy-page">
      <img src="../assets/img/legal-cookies-v2.webp" alt="" class="policy-illustration" />
      <hr class="app-divider" />
      <h1 class="app-section-title"><BilingualText text-key="policy.cookies" /></h1>
      <p class="policy-intro"><BilingualText text-key="cookies.intro" /></p>

      <section>
        <h2><BilingualText text-key="cookies.whatTitle" /></h2>
        <p><BilingualText text-key="cookies.what" /></p>
      </section>
      <section>
        <h2><BilingualText text-key="cookies.useTitle" /></h2>
        <p><BilingualText text-key="cookies.use" /></p>
      </section>
      <section>
        <h2><BilingualText text-key="cookies.choicesTitle" /></h2>
        <p><BilingualText text-key="cookies.choices" /></p>
      </section>
      <section>
        <h2><BilingualText text-key="cookies.moreTitle" /></h2>
        <p><BilingualText text-key="cookies.moreBeforeLink" /> <RouterLink to="/privacy-policy" class="app-link underline"><BilingualText text-key="policy.privacy" /></RouterLink>.</p>
      </section>
    </article>
  </main>
</template>

<style scoped>
.policy-page { display: grid; gap: 1.5rem; }
.policy-illustration { width: min(18rem, 72vw); margin-inline: auto; }
.policy-intro { font-size: 1.08rem; color: var(--app-muted); }
.policy-page section { display: grid; gap: .45rem; }
.policy-page h2 { font-size: 1.35rem; font-weight: 700; color: var(--lc-brand); }
.dark .policy-page h2 { color: var(--lc-gold); }
</style>
