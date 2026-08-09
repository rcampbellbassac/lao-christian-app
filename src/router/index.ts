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
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
    },
    {
      path: '/migrate',
      name: 'migrate',
      component: () => import('../views/MigrationView.vue'),
    },
    {
      path: '/decks/:deckId?',
      name: 'decks',
      component: () => import('../views/SlideStudioView.vue'),
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
      // Lazy-loaded: keeps JSZip (used only by presentation export)
      // out of the main bundle for everyone just reading content.
      component: () => import('../views/PresentationView.vue'),
    },
    {
      path: '/present/deck/:deckId',
      name: 'deck-presenter',
      component: () => import('../views/DeckPresenterView.vue'),
      meta: { bare: true },
    },
    {
      path: '/audience/:deckId',
      name: 'deck-audience',
      component: () => import('../views/DeckAudienceView.vue'),
      meta: { bare: true },
    },
  ],
})

export default router
