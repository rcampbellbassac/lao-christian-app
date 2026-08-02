import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'src/locales/static.en.json')
const targetPath = path.join(root, 'src/locales/static.lo.json')
const project = process.env.GOOGLE_CLOUD_PROJECT || execFileSync('gcloud', ['config', 'get-value', 'project'], { encoding: 'utf8' }).trim()
if (!project) throw new Error('Set GOOGLE_CLOUD_PROJECT or select a gcloud project.')
const token = execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8' }).trim()
const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'))
const keys = Object.keys(source)

const response = await fetch(`https://translation.googleapis.com/v3/projects/${encodeURIComponent(project)}/locations/global:translateText`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-goog-user-project': project },
  body: JSON.stringify({ sourceLanguageCode: 'en', targetLanguageCode: 'lo', mimeType: 'text/plain', contents: keys.map(key => source[key]) }),
})
if (!response.ok) throw new Error(`Google Cloud Translation failed (${response.status}): ${await response.text()}`)
const result = await response.json()
const translated = Object.fromEntries(keys.map((key, index) => [key, result.translations[index].translatedText]))
await fs.writeFile(targetPath, `${JSON.stringify(translated, null, 2)}\n`, 'utf8')
console.log(`Translated ${keys.length} static app strings to ${path.relative(root, targetPath)}`)
