<script setup lang="ts">
import BilingualText from '@/components/BilingualText.vue'
</script>

<template>
  <main class="app-page">
    <article class="app-panel policy-page">
      <img src="../assets/img/legal-privacy-v2.webp" alt="" class="policy-illustration" />
      <hr class="app-divider" />
      <h1 class="app-section-title"><BilingualText text-key="policy.privacy" /></h1>

      <section>
        <h2><BilingualText text-key="privacy.legalTitle" /></h2>
        <p><BilingualText text-key="privacy.legalIntro" /></p>
        <ul class="policy-list">
          <li><strong><BilingualText text-key="privacy.consentTitle" /></strong><BilingualText text-key="privacy.consent" /></li>
          <li><strong><BilingualText text-key="privacy.contractTitle" /></strong><BilingualText text-key="privacy.contract" /></li>
          <li><strong><BilingualText text-key="privacy.obligationTitle" /></strong><BilingualText text-key="privacy.obligation" /></li>
          <li><strong><BilingualText text-key="privacy.interestsTitle" /></strong><BilingualText text-key="privacy.interests" /></li>
        </ul>
      </section>
      <section><h2><BilingualText text-key="privacy.rightsTitle" /></h2><p><BilingualText text-key="privacy.rights" /></p></section>
      <section><h2><BilingualText text-key="privacy.childrenTitle" /></h2><p><BilingualText text-key="privacy.children" /></p></section>
      <section><h2><BilingualText text-key="privacy.breachTitle" /></h2><p><BilingualText text-key="privacy.breach" /></p></section>
      <section><h2><BilingualText text-key="privacy.transfersTitle" /></h2><p><BilingualText text-key="privacy.transfers" /></p></section>
      <section><h2><BilingualText text-key="privacy.cookiesTitle" /></h2><p><BilingualText text-key="privacy.cookiesBeforeLink" /> <RouterLink to="/cookie-policy" class="app-link underline"><BilingualText text-key="policy.cookies" /></RouterLink>.</p></section>
      <section><h2><BilingualText text-key="privacy.changesTitle" /></h2><p><BilingualText text-key="privacy.changes" /></p></section>
      <section><h2><BilingualText text-key="privacy.contactTitle" /></h2><p><BilingualText text-key="privacy.contact" /></p></section>
    </article>
  </main>
</template>

<style scoped>
.policy-page { display: grid; gap: 1.5rem; }
.policy-illustration { width: min(18rem, 72vw); margin-inline: auto; }
.policy-page section { display: grid; gap: .45rem; }
.policy-page h2 { font-size: 1.35rem; font-weight: 700; color: var(--lc-brand); }
.dark .policy-page h2 { color: var(--lc-gold); }
.policy-list { display: grid; gap: .7rem; padding-left: 1.4rem; list-style: disc; }
.policy-list strong { display: block; }
</style>
