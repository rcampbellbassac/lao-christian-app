import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

describe('App shell', () => {
  it('renders app shell with router view', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>home</div>' } },
        { path: '/about', component: { template: '<div>about</div>' } },
        { path: '/cookie-policy', component: { template: '<div>cookie</div>' } },
        { path: '/privacy-policy', component: { template: '<div>privacy</div>' } },
        { path: '/terms-of-service', component: { template: '<div>terms</div>' } },
      ],
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('home')
  })
})
