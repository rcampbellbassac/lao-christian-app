import { defineConfig } from '@playwright/test'
import baseConfig from './playwright.config'

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'http://127.0.0.1:5200',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 5200',
    url: 'http://127.0.0.1:5200',
    reuseExistingServer: false,
  },
})
