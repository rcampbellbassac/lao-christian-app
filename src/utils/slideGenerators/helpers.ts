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
    html: context.title,
  }
}

export function createContentSlide(index: number, html: string): Slide {
  return {
    id: `slide-${index + 1}`,
    title: `Slide ${index + 1}`,
    html,
  }
}

export function parseBlocks(html: string): ParsedBlock[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="root">${html || ''}</div>`, 'text/html')
  const root = doc.querySelector('#root')
  if (!root) return []

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
