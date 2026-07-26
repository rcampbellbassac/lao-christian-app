import {
  defaultSlideGeneratorConfig,
  type Slide,
  type SlideGeneratorConfig,
  type SlideGeneratorContext,
} from './types'

export interface ParsedBlock {
  html: string
  text: string
  rawText: string
  tagName: string | null
  isElement: boolean
}

export function normalizeConfig(config?: Partial<SlideGeneratorConfig>): SlideGeneratorConfig {
  return {
    maxNodesPerSlide: config?.maxNodesPerSlide ?? defaultSlideGeneratorConfig.maxNodesPerSlide,
    maxCharsPerSlide: config?.maxCharsPerSlide ?? defaultSlideGeneratorConfig.maxCharsPerSlide,
    hardBreakTags: config?.hardBreakTags ?? defaultSlideGeneratorConfig.hardBreakTags,
    versesPerSlide: config?.versesPerSlide ?? defaultSlideGeneratorConfig.versesPerSlide,
    stanzasPerSlide: config?.stanzasPerSlide ?? defaultSlideGeneratorConfig.stanzasPerSlide,
    sectionsPerSlide: config?.sectionsPerSlide ?? defaultSlideGeneratorConfig.sectionsPerSlide,
  }
}

export function createTitleSlide(context: SlideGeneratorContext): Slide {
  return {
    id: 'title',
    title: context.title,
    html: context.bookTitle ?? '',
  }
}

/** "{Book} — {Chapter}", or just the chapter title if no book name is known. */
export function buildHeaderLabel(context: SlideGeneratorContext): string {
  const bookTitle = context.bookTitle?.trim()
  return bookTitle ? `${bookTitle} — ${context.title}` : context.title
}

export function createContentSlide(index: number, html: string, headerLabel: string): Slide {
  return {
    id: `slide-${index + 1}`,
    title: headerLabel,
    html,
  }
}

const genericContainerTags = new Set(['div', 'section'])

/**
 * Source HTML sometimes wraps an entire chapter in one outer <div> (every
 * LaoBible.json chapter does this). If we only look at the parsed root's
 * direct children, that collapses the whole chapter into a single block
 * instead of one block per paragraph/verse. Descend through any chain of
 * single, attribute-less div/section wrappers to reach the real content.
 */
function unwrapSingleChildContainers(root: Element): Element {
  let current = root

  while (true) {
    const meaningfulChildren = Array.from(current.childNodes).filter(
      (node) => !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim())
    )

    if (meaningfulChildren.length !== 1) return current

    const [onlyChild] = meaningfulChildren
    if (onlyChild.nodeType !== Node.ELEMENT_NODE) return current

    const element = onlyChild as Element
    if (!genericContainerTags.has(element.tagName.toLowerCase())) return current
    if (element.attributes.length > 0) return current

    current = element
  }
}

export function parseBlocks(html: string): ParsedBlock[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="root">${html || ''}</div>`, 'text/html')
  const parsedRoot = doc.querySelector('#root')
  if (!parsedRoot) return []

  const root = unwrapSingleChildContainers(parsedRoot)

  const blocks: ParsedBlock[] = []

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) return

    const tagName = node.nodeType === Node.ELEMENT_NODE
      ? (node as Element).tagName.toLowerCase()
      : null

    blocks.push({
      html: nodeToHtml(node),
      text: normalizeText(node.textContent || ''),
      rawText: node.textContent || '',
      tagName,
      isElement: node.nodeType === Node.ELEMENT_NODE,
    })
  })

  return blocks
}

const blockLikeTags = new Set(['p', 'div', 'li', 'blockquote'])
const listContainerTags = new Set(['ul', 'ol'])

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
    .split(/(?<=[.!?。!?៖។])\s+/u)
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

/**
 * Splits any single block that's still too large for one slide (a long
 * paragraph, or a block that survived unwrapping still containing a huge
 * amount of text) into several smaller blocks. Applied as a defense-in-depth
 * pass by every generator, on top of the wrapper-unwrapping fix in
 * parseBlocks(), so no single oversized block can ever become one giant slide.
 */
export function expandBlock(block: ParsedBlock, maxChars: number): ParsedBlock[] {
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

export function expandOversizedBlocks(blocks: ParsedBlock[], maxChars: number): ParsedBlock[] {
  return blocks.flatMap(block => expandBlock(block, maxChars))
}

export function isHeadingTag(tagName: string | null): boolean {
  return Boolean(tagName && /^h[1-6]$/.test(tagName))
}

export function isHardBreakTag(tagName: string | null, config: SlideGeneratorConfig): boolean {
  return Boolean(tagName && config.hardBreakTags.includes(tagName))
}

export function isBlankText(text: string): boolean {
  return normalizeText(text).length === 0
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function nodeToHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return `<p>${escapeHtml(node.textContent ?? '')}</p>`
  }

  const wrapper = document.createElement('div')
  wrapper.appendChild(node.cloneNode(true))
  return wrapper.innerHTML
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
