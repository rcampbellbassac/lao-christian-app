<script setup lang="ts">
import BilingualText from '@/components/BilingualText.vue'
</script>

<template>
  <main class="app-page">
    <article class="app-panel policy-page">
      <h1 class="app-section-title"><BilingualText text-key="policy.terms" /></h1>
      <section>
        <h2><BilingualText text-key="terms.acceptTitle" /></h2>
        <p><BilingualText text-key="terms.acceptBeforeLink" /> <RouterLink to="/privacy-policy" class="app-link underline"><BilingualText text-key="policy.privacy" /></RouterLink>. <BilingualText text-key="terms.acceptAfterLink" /></p>
      </section>
      <section><h2><BilingualText text-key="terms.useTitle" /></h2><p><BilingualText text-key="terms.use" /></p></section>
      <section><h2><BilingualText text-key="terms.propertyTitle" /></h2><p><BilingualText text-key="terms.property" /></p></section>
      <section><h2><BilingualText text-key="terms.userContentTitle" /></h2><p><BilingualText text-key="terms.userContent" /></p></section>
      <section><h2><BilingualText text-key="terms.disclaimersTitle" /></h2><p><BilingualText text-key="terms.disclaimers" /></p></section>
      <section><h2><BilingualText text-key="terms.liabilityTitle" /></h2><p><BilingualText text-key="terms.liability" /></p></section>
      <section><h2><BilingualText text-key="terms.changesTitle" /></h2><p><BilingualText text-key="terms.changes" /></p></section>
      <section><h2><BilingualText text-key="terms.lawTitle" /></h2><p><BilingualText text-key="terms.law" /></p></section>
      <section><h2><BilingualText text-key="terms.contactTitle" /></h2><p><BilingualText text-key="terms.contact" /></p></section>
    </article>
  </main>
</template>

<style scoped>
.policy-page { display: grid; gap: 1.5rem; }
.policy-page section { display: grid; gap: .45rem; }
.policy-page h2 { font-size: 1.35rem; font-weight: 700; color: var(--lc-brand); }
.dark .policy-page h2 { color: var(--lc-gold); }
</style>
