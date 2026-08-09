import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

const nodeMajorVersion = Number.parseInt(process.versions.node, 10)

const resolvedViteConfig =
  typeof viteConfig === 'function'
    ? viteConfig({
        command: 'serve',
        mode: 'test',
        isSsrBuild: false,
        isPreview: false,
      })
    : viteConfig

export default mergeConfig(
  resolvedViteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // Node 26's global Web Storage throws unless a backing file is configured.
      // Disable only that Node global in workers so jsdom can provide the
      // browser-scoped localStorage implementation the application tests use.
      execArgv: nodeMajorVersion >= 26 ? ['--no-webstorage'] : [],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
