import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const SOURCE_DIR = process.env.CONTENT_SOURCE_DIR
  ? path.resolve(projectRoot, process.env.CONTENT_SOURCE_DIR)
  : path.join(projectRoot, 'src/assets/data-normalized')
const FALLBACK_SOURCE_DIR = path.join(projectRoot, 'src/assets/data')
const OUTPUT_DIR = process.env.CONTENT_RELEASE_DIR
  ? path.resolve(projectRoot, process.env.CONTENT_RELEASE_DIR)
  : path.join(projectRoot, 'dist/content-release')
const INDEX_PATH = path.join(projectRoot, 'src/assets/data/index.json')

const CONTENT_BASE_URL = (process.env.CONTENT_BASE_URL || 'https://laoadventist-media.s3.us-west-2.amazonaws.com').replace(/\/$/, '')
const RELEASE_VERSION = process.env.CONTENT_RELEASE_VERSION || new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
const PUBLISHED_AT = process.env.CONTENT_PUBLISHED_AT || new Date().toISOString()

const sourceDir = await resolveSourceDir(SOURCE_DIR, FALLBACK_SOURCE_DIR)
await fs.mkdir(OUTPUT_DIR, { recursive: true })

const indexRaw = await fs.readFile(INDEX_PATH, 'utf8')
const indexJson = JSON.parse(indexRaw)

const nextUrls = []

for (const item of indexJson.urls) {
  const baseName = path.basename(new URL(item.url).pathname)
  const sourcePath = path.join(sourceDir, baseName)
  const outputJsonPath = path.join(OUTPUT_DIR, baseName)
  const outputGzipPath = `${outputJsonPath}.gz`

  const raw = await fs.readFile(sourcePath)
  const gz = zlib.gzipSync(raw, { level: 9 })

  await fs.writeFile(outputJsonPath, raw)
  await fs.writeFile(outputGzipPath, gz)

  const checksum = hashSha256(raw)
  const checksumGzip = hashSha256(gz)

  nextUrls.push({
    ...item,
    url: `${CONTENT_BASE_URL}/${baseName}`,
    url_gzip: `${CONTENT_BASE_URL}/${baseName}.gz`,
    version: RELEASE_VERSION,
    published_at: PUBLISHED_AT,
    checksum_sha256: checksum,
    checksum_sha256_gzip: checksumGzip,
    size_bytes: raw.byteLength,
    size_gzip_bytes: gz.byteLength,
  })
}

const releaseIndex = {
  ...indexJson,
  urls: nextUrls,
  update: PUBLISHED_AT,
  release_version: RELEASE_VERSION,
}

await fs.writeFile(path.join(OUTPUT_DIR, 'index.json'), `${JSON.stringify(releaseIndex, null, 2)}\n`, 'utf8')

console.log(`Content release generated in ${OUTPUT_DIR}`)
console.log(`Source directory: ${sourceDir}`)
console.log(`Release version: ${RELEASE_VERSION}`)

function hashSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function resolveSourceDir(primary, fallback) {
  if (await dirExists(primary)) return primary
  if (await dirExists(fallback)) return fallback
  throw new Error(`No content source directory found. Checked: ${primary}, ${fallback}`)
}

async function dirExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}
