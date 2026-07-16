import {
  createContentSlide,
  createTitleSlide,
  isHardBreakTag,
  isHeadingTag,
  normalizeConfig,
  normalizeText,
  parseBlocks,
} from './helpers'
import type { SlideGenerator } from './types'
import type { ParsedBlock } from './helpers'

const blockLikeTags = new Set(['p', 'div', 'li', 'blockquote'])
const listContainerTags = new Set(['ul', 'ol'])

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function wrapFragment(fragment: string, tagName: string | null): string {
  const safeTag = tagName && blockLikeTags.has(tagName) ? tagName : 'p'
  return `<${safeTag}>${escapeHtml(fragment)}</${safeTag}>`
}

function wrapListItem(fragment: string): string {
  return `<ul><li>${escapeHtml(fragment)}</li></ul>`
}

function splitLongText(value: string, maxChars: number): string[] {
  const normalized = normalizeText(value)
  if (!normalized) return []
  if (normalized.length <= maxChars) return [normalized]

  const sentenceParts = normalized
    .split(/(?<=[.!?。！？៖។])\s+/u)
    .map(part => normalizeText(part))
    .filter(Boolean)

  const units = sentenceParts.length > 1 ? sentenceParts : normalized.split(/\s+/)
  const chunks: string[] = []
  let currentChunk = ''

  const flush = () => {
    if (!currentChunk) return
    chunks.push(currentChunk)
    currentChunk = ''
  }

  for (const unit of units) {
    if (!unit) continue

    if (unit.length > maxChars) {
      flush()

      let remaining = unit
      while (remaining.length > maxChars) {
        chunks.push(remaining.slice(0, maxChars).trim())
        remaining = remaining.slice(maxChars).trim()
      }

      if (remaining) {
        currentChunk = remaining
      }

      continue
    }

    const separator = currentChunk ? ' ' : ''
    if (currentChunk.length + separator.length + unit.length > maxChars) {
      flush()
    }

    currentChunk = currentChunk ? `${currentChunk} ${unit}` : unit
  }

  flush()

  return chunks
}

function createParsedBlockFromHtml(html: string, tagName: string | null, text: string): ParsedBlock {
  return {
    html,
    text,
    rawText: text,
    tagName,
    isElement: true,
  }
}

function extractListItems(block: ParsedBlock): ParsedBlock[] {
  if (!block.tagName || !listContainerTags.has(block.tagName)) return [block]

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="root">${block.html}</div>`, 'text/html')
  const root = doc.querySelector('#root')
  if (!root) return [block]

  const items = Array.from(root.querySelectorAll('li'))
  if (items.length === 0) return [block]

  return items.map((item) => {
    const itemText = normalizeText(item.textContent || '')
    return createParsedBlockFromHtml(wrapListItem(itemText), 'li', itemText)
  })
}

function expandBlock(block: ParsedBlock, maxChars: number): ParsedBlock[] {
  const listItems = extractListItems(block)
  if (listItems.length > 1 || listItems[0] !== block) {
    return listItems.flatMap(listItem => expandBlock(listItem, maxChars))
  }

  if (block.html.length <= maxChars) return [block]

  const fragments = splitLongText(block.rawText || block.text, maxChars)
  if (fragments.length <= 1) return [block]

  return fragments.map((fragment) => ({
    html: block.tagName === 'li' ? wrapListItem(fragment) : wrapFragment(fragment, block.tagName),
    text: fragment,
    rawText: fragment,
    tagName: block.tagName && blockLikeTags.has(block.tagName) ? block.tagName : 'p',
    isElement: true,
  }))
}

export const defaultSlideGenerator: SlideGenerator = {
  type: 'default',
  generate(context, config) {
    const resolvedConfig = normalizeConfig(config)
    const blocks = parseBlocks(context.html).flatMap(block => expandBlock(block, resolvedConfig.maxCharsPerSlide))
    const slides = [createTitleSlide(context)]

    const chunks: string[] = []
    let currentChunk: string[] = []
    let currentCharCount = 0

    const flushChunk = () => {
      if (currentChunk.length === 0) return
      chunks.push(currentChunk.join(''))
      currentChunk = []
      currentCharCount = 0
    }

    for (const block of blocks) {
      if (isHeadingTag(block.tagName) && currentChunk.length > 0) {
        flushChunk()
      }

      const nextCharCount = currentCharCount + block.html.length
      if (currentChunk.length > 0 && nextCharCount > resolvedConfig.maxCharsPerSlide) {
        flushChunk()
      }

      currentChunk.push(block.html)

      currentCharCount += block.html.length

      if (
        isHardBreakTag(block.tagName, resolvedConfig)
        || currentChunk.length >= resolvedConfig.maxNodesPerSlide
      ) {
        flushChunk()
      }
    }

    flushChunk()

    chunks.forEach((chunk, index) => {
      slides.push(createContentSlide(index, chunk))
    })

    return slides
  },
}
