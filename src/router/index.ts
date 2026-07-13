import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import CookiePolicyView from '../views/CookiePolicyView.vue'
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue'
import TermsOfServiceView from '../views/TermsOfServiceView.vue'
import FileView from '../views/FileView.vue'
import BookView from '../views/BookView.vue'
import ChapterView from '../views/ChapterView.vue'
import PresentationView from '../views/PresentationView.vue'

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
      component: AboutView,
    },
    {
      path: '/cookie-policy',
      name: 'cookie-policy',
      component: CookiePolicyView,
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: PrivacyPolicyView,
    },
    {
      path: '/terms-of-service',
      name: 'terms-of-service',
      component: TermsOfServiceView,
    },

    {
      path: '/content/:fileid',
      component: FileView, // This loads the JSON file
    },

    {
      path: '/content/:fileid/:bookid',
      component: BookView, // This loads the indiivudal books withint the JSON file
    },

    {
      path: '/content/:fileid/:bookid/:chapterid',
      component: ChapterView,  // This loads the individual chapters within the book
    },

    {
      path: '/present/:fileid/:bookid/:chapterid',
      name: 'presentation',
      component: PresentationView,
    },

  ],
})

export default router
