import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(projectRoot, 'src/assets/data')
const outputDir = path.join(projectRoot, 'src/assets/data-normalized')

const DATA_FILES = [
  'LaoBible.json',
  'LaoSongs.json',
  'LaoBibleStudies.json',
  'LaoEGW.json',
  'LaoHealthBooks.json',
  'LaoStories.json',
]

const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH'])
const ALLOWED_INLINE_TAGS = new Set(['A', 'BR', 'EM', 'I', 'STRONG', 'B', 'SUP', 'SUB', 'SPAN', 'U', 'SMALL'])

const report = []

await fs.mkdir(outputDir, { recursive: true })

for (const fileName of DATA_FILES) {
  const inputPath = path.join(sourceDir, fileName)
  const outputPath = path.join(outputDir, fileName)
  const raw = await fs.readFile(inputPath, 'utf8')
  const json = JSON.parse(raw)
  const stats = {
    file: fileName,
    items: 0,
    cleanedChars: 0,
    removedStyleAttrs: 0,
    removedColorAttrs: 0,
    removedFontTags: 0,
    removedSpanWrappers: 0,
    removedAlignAttrs: 0,
    removedNbsp: 0,
    addedClasses: 0,
  }

  walk(json, (node, parentKey) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return
    if (typeof node.content !== 'string') return

    stats.items += 1
    const { html, changeStats } = normalizeContent(node.content, fileName, node.name || '', parentKey)
    node.content = html
    stats.cleanedChars += html.length
    stats.removedStyleAttrs += changeStats.removedStyleAttrs
    stats.removedColorAttrs += changeStats.removedColorAttrs
    stats.removedFontTags += changeStats.removedFontTags
    stats.removedSpanWrappers += changeStats.removedSpanWrappers
    stats.removedAlignAttrs += changeStats.removedAlignAttrs
    stats.removedNbsp += changeStats.removedNbsp
    stats.addedClasses += changeStats.addedClasses
  })

  await fs.writeFile(outputPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  report.push(stats)
}

await fs.writeFile(path.join(outputDir, 'normalization-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log('Normalization complete')
console.table(report)

function walk(value, visit, parentKey = '') {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit, parentKey)
    return
  }

  visit(value, parentKey)

  for (const [key, child] of Object.entries(value)) {
    walk(child, visit, key)
  }
}

function normalizeContent(content, fileName, itemName, parentKey) {
  const dom = new JSDOM(`<body>${content}</body>`)
  const { document } = dom.window
  const body = document.body
  const changeStats = {
    removedStyleAttrs: 0,
    removedColorAttrs: 0,
    removedFontTags: 0,
    removedSpanWrappers: 0,
    removedAlignAttrs: 0,
    removedNbsp: 0,
    addedClasses: 0,
  }

  const contentType = inferContentType(fileName, itemName, parentKey)
  normalizeChildren(body, document, contentType, changeStats)

  const html = sanitizeOutput(body.innerHTML, changeStats)
  return {
    html,
    changeStats,
  }
}

function normalizeChildren(parent, document, contentType, changeStats) {
  for (let node = parent.firstChild; node;) {
    const current = node
    const nextSibling = current.nextSibling
    normalizeNode(current, document, contentType, changeStats)
    node = current.parentNode === parent ? current.nextSibling : parent.firstChild === current ? nextSibling : parent.firstChild
  }
}

function normalizeNode(node, document, contentType, changeStats) {
  if (node.nodeType === node.TEXT_NODE) {
    const text = normalizeText(node.textContent || '', changeStats)
    if (!text.trim()) {
      node.remove()
      return
    }
    node.textContent = text
    return
  }

  if (node.nodeType !== node.ELEMENT_NODE) return

  const element = node
  const tagName = element.tagName.toUpperCase()

  stripAttributes(element, changeStats)

  if (tagName === 'FONT') {
    changeStats.removedFontTags += 1
    unwrapElement(element)
    if (element.parentNode) normalizeChildren(element.parentNode, document, contentType, changeStats)
    return
  }

  if (!ALLOWED_INLINE_TAGS.has(tagName) && !BLOCK_TAGS.has(tagName)) {
    unwrapElement(element)
    return
  }

  if (tagName === 'SPAN' && isPureSpanWrapper(element)) {
    changeStats.removedSpanWrappers += 1
    unwrapElement(element)
    if (element.parentNode) normalizeChildren(element.parentNode, document, contentType, changeStats)
    return
  }

  if (tagName === 'BR') return

  const semanticClass = classifyElement(element, contentType)
  if (semanticClass) {
    addClass(element, semanticClass, changeStats)
  }

  if (contentType === 'bible') {
    if (tagName === 'P') addClass(element, 'bible-verse', changeStats)
    if (tagName === 'H1') addClass(element, 'bible-chapter-title', changeStats)
  }

  if (contentType === 'songs') {
    if (tagName === 'P') addClass(element, 'song-line', changeStats)
    if (tagName === 'H1' || tagName === 'H2' || tagName === 'H3') addClass(element, 'song-title', changeStats)
  }

  if (contentType === 'study') {
    if (tagName === 'H1' || tagName === 'H2' || tagName === 'H3') addClass(element, 'section-title', changeStats)
    if (tagName === 'P' && isLeadParagraph(element)) addClass(element, 'lead-paragraph', changeStats)
    if (tagName === 'BLOCKQUOTE') addClass(element, 'pullquote', changeStats)
    if (tagName === 'TABLE') addClass(element, 'data-table', changeStats)
  }

  if (tagName === 'TABLE') normalizeTable(element, changeStats)
  if (tagName === 'UL' || tagName === 'OL') addClass(element, 'content-list', changeStats)

  normalizeChildren(element, document, contentType, changeStats)
}

function normalizeTable(table, changeStats) {
  addClass(table, 'table', changeStats)
  for (const cell of table.querySelectorAll('td, th')) {
    addClass(cell, 'table-cell', changeStats)
  }
}

function stripAttributes(element, changeStats) {
  for (const attr of [...element.attributes]) {
    const name = attr.name.toLowerCase()
    if (name === 'style') {
      changeStats.removedStyleAttrs += 1
      element.removeAttribute(attr.name)
      continue
    }
    if (name === 'color' || name === 'bgcolor' || name === 'face' || name === 'size' || name === 'lang' || name === 'xml:lang') {
      if (name === 'color' || name === 'bgcolor') changeStats.removedColorAttrs += 1
      element.removeAttribute(attr.name)
      continue
    }
    if (name === 'align') {
      changeStats.removedAlignAttrs += 1
      element.removeAttribute(attr.name)
      continue
    }
    if (name.startsWith('on')) {
      element.removeAttribute(attr.name)
    }
  }
}

function unwrapElement(element) {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) parent.insertBefore(element.firstChild, element)
  parent.removeChild(element)
}

function sanitizeOutput(html, changeStats) {
  return html
    .replace(/<\/?font\b[^>]*>/gi, () => {
      changeStats.removedFontTags += 1
      return ''
    })
    .replace(/<\/?span\b[^>]*>/gi, () => {
      changeStats.removedSpanWrappers += 1
      return ''
    })
    .replace(/&nbsp;/g, () => {
      changeStats.removedNbsp += 1
      return ' '
    })
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

function normalizeText(text, changeStats) {
  const replaced = text.replace(/\u00a0/g, () => {
    changeStats.removedNbsp += 1
    return ' '
  })
  return replaced.replace(/\s+/g, ' ')
}

function isPureSpanWrapper(element) {
  if (element.attributes.length > 0) return false
  return [...element.childNodes].every((node) => node.nodeType === node.TEXT_NODE || node.nodeType === node.ELEMENT_NODE)
}

function classifyElement(element, contentType) {
  const tagName = element.tagName.toUpperCase()
  if (tagName === 'H1' || tagName === 'H2' || tagName === 'H3') return 'section-heading'
  if (tagName === 'BLOCKQUOTE') return 'quote'
  if (tagName === 'P' && contentType === 'songs') {
    const text = element.textContent || ''
    if (/^\s*[0-9០-៩໐-໙]+[\.\)]\s*/.test(text)) return 'verse-line'
    if (/^\s*\(/.test(text)) return 'refrain-line'
  }
  if (tagName === 'P' && contentType === 'bible') return 'verse-paragraph'
  if (tagName === 'P' && contentType === 'study' && isCentered(element)) return 'centered-line'
  return ''
}

function isLeadParagraph(element) {
  const text = (element.textContent || '').trim()
  return text.length > 120 || /[?：:]/.test(text)
}

function isCentered(element) {
  const align = element.getAttribute('align')
  return align?.toLowerCase() === 'center'
}

function addClass(element, className, changeStats) {
  if (!className) return
  const existing = new Set((element.getAttribute('class') || '').split(/\s+/).filter(Boolean))
  if (!existing.has(className)) {
    existing.add(className)
    element.setAttribute('class', [...existing].join(' '))
    changeStats.addedClasses += 1
  }
}

function inferContentType(fileName, itemName, parentKey) {
  const source = `${fileName} ${itemName} ${parentKey}`.toLowerCase()
  if (source.includes('bible') && !source.includes('study')) return 'bible'
  if (source.includes('song')) return 'songs'
  return 'study'
}
