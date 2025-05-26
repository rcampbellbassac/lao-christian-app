<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const showModal = ref(false)

onMounted(() => {
if (!document.cookie.includes('cookieConsent=true')) {
showModal.value = true
}
})

function agreeToCookies() {
const date = new Date()
date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
document.cookie = `cookieConsent=true; expires=${date.toUTCString()}; path=/`
showModal.value = false
}
</script>


<template>
  <main class="mx-auto max-w-3xl p-6 mb-20 bg-white rounded-xl shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:outline-white/10 overflow-y-auto">
    <div class="">
      <div class="text-center mb-6">
        <img src="../assets/img/privacy-penguin-web-fast.webp" alt="Privacy Penguin Logo" class="mx-auto max-w-xs" />
      </div>
      <hr class="border-slate-300 dark:border-slate-600 mb-6" />
      <h1 class="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Privacy Policy</h1>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">Legal Basis for Processing Personal Data (GDPR)</h2>
        <p>We process Personal Data under the following legal bases:</p>
        <ul class="list-disc list-inside space-y-1 mt-2">
          <li><strong>Consent:</strong> Your consent to processing activities for specific purposes.</li>
          <li><strong>Contractual Necessity:</strong> Processing is necessary for the performance of a contract with you.</li>
          <li><strong>Legal Obligation:</strong> Processing is necessary to comply with the law.</li>
          <li><strong>Legitimate Interests:</strong> Processing is necessary for the purposes of our legitimate interests.</li>
        </ul>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">User Rights Under CCPA and GDPR</h2>
        <p>
          You have the right to access, rectify, or erase your personal data, restrict processing, object to processing,
          and if applicable, the right to data portability. Under the CCPA, you also have the right to opt-out of the sale
          of your personal data.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">Children's Privacy</h2>
        <p>
          We do not knowingly collect personal data from children under 13 (or a higher age threshold where applicable).
          If you are a parent or guardian and believe your child has provided us with personal data, please contact us.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">Data Protection Officer</h2>
        <p>Our Data Protection Officer can be contacted at [DPO's contact information].</p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">Data Breach Notification</h2>
        <p>
          In the event of a data breach, we will notify you and any applicable regulator when we are legally required to do so.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">International Data Transfers</h2>
        <p>
          We transfer data internationally only in compliance with data protection laws and ensure that there is adequate
          data protection in all cases of data transfer.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">Cookie Policy</h2>
        <p>
          Our website uses cookies. For more information, please visit our
          <RouterLink to="/cookie-policy" class="text-blue-600 hover:text-blue-800 underline">Cookie Policy</RouterLink>.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">Changes to This Privacy Policy</h2>
        <p>
          We review and update this policy regularly. The latest version will always be posted on our website.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">Contact Us</h2>
        <p>
          For any questions or concerns about this Privacy Policy or our data practices, contact us at [contact details].
        </p>
      </section>
    </div>

    <!-- Cookie Consent Modal -->
    <transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
        role="dialog"
        aria-modal="true"
      >
        <div class="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Cookie Consent</h3>
          <p class="mb-4">
            We use cookies to improve your experience on our site. By continuing, you agree to our use of cookies.
            Read the terms
            <RouterLink to="/cookie-policy" class="text-blue-600 hover:text-blue-800 underline">here</RouterLink>.
          </p>
          <div class="text-right">
            <button
              @click="agreeToCookies"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              I Agree
            </button>
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
