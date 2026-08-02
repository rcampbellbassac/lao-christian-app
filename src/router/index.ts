import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
    {
      path: '/study',
      name: 'study',
      component: () => import('../views/StudyView.vue'),
    },
    {
      path: '/cookie-policy',
      name: 'cookie-policy',
      component: () => import('../views/CookiePolicyView.vue'),
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: () => import('../views/PrivacyPolicyView.vue'),
    },
    {
      path: '/terms-of-service',
      name: 'terms-of-service',
      component: () => import('../views/TermsOfServiceView.vue'),
    },

    {
      path: '/content/:fileid',
      component: () => import('../views/FileView.vue'), // This loads the JSON file
    },

    {
      path: '/content/:fileid/:bookid',
      component: () => import('../views/BookView.vue'), // This loads the indiivudal books withint the JSON file
    },

    {
      path: '/content/:fileid/:bookid/:chapterid',
      component: () => import('../views/ChapterView.vue'), // This loads the individual chapters within the book
    },

    {
      path: '/present/:fileid/:bookid/:chapterid',
      name: 'presentation',
      // Lazy-loaded: keeps pptxgenjs/jszip (used only by presentation export)
      // out of the main bundle for everyone just reading content.
      component: () => import('../views/PresentationView.vue'),
    },

  ],
})

export default router
