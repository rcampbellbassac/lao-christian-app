import {
  buildHeaderLabel,
  createContentSlide,
  createTitleSlide,
  expandOversizedBlocks,
  isBlankText,
  isHeadingTag,
  normalizeConfig,
  parseBlocks,
} from './helpers'
import type { ParsedBlock } from './helpers'
import type { SlideGenerator } from './types'

function isStanzaBoundary(block: ParsedBlock): boolean {
  if (isHeadingTag(block.tagName) || block.tagName === 'hr') return true
  if ((block.tagName === 'p' || block.tagName === 'div') && isBlankText(block.text)) return true
  return false
}

interface StanzaGroup {
  html: string
  isStanza: boolean
}

export const songsSlideGenerator: SlideGenerator = {
  type: 'songs',
  generate(context, config) {
    const resolvedConfig = normalizeConfig(config)
    const blocks = expandOversizedBlocks(parseBlocks(context.html), resolvedConfig.maxCharsPerSlide)
    const slides = [createTitleSlide(context)]

    const stanzas: StanzaGroup[] = []
    let stanzaParts: string[] = []
    let pendingHeadingHtml = ''

    const flushStanza = () => {
      if (stanzaParts.length === 0) return
      stanzas.push({ html: stanzaParts.join(''), isStanza: true })
      stanzaParts = []
    }

    for (const block of blocks) {
      if (isHeadingTag(block.tagName)) {
        flushStanza()
        pendingHeadingHtml = block.html
        continue
      }

      if (isStanzaBoundary(block)) {
        flushStanza()
        continue
      }

      if (
        stanzaParts.length > 0
        && stanzaParts.join('').length + block.html.length > resolvedConfig.maxCharsPerSlide
      ) {
        // Prevents an unbounded run of blocks (e.g. fragments from an
        // oversized block) from merging into a single giant stanza.
        flushStanza()
      }

      if (pendingHeadingHtml) {
        stanzaParts.push(pendingHeadingHtml)
        pendingHeadingHtml = ''
      }

      stanzaParts.push(block.html)
    }

    flushStanza()
    if (pendingHeadingHtml) {
      stanzas.push({ html: pendingHeadingHtml, isStanza: false })
    }

    const chunks: string[] = []
    let chunkParts: string[] = []
    let stanzaCount = 0
    let charCount = 0

    const flushChunk = () => {
      if (chunkParts.length === 0) return
      chunks.push(chunkParts.join(''))
      chunkParts = []
      stanzaCount = 0
      charCount = 0
    }

    for (const stanza of stanzas) {
      const nextStanzaCount = stanzaCount + (stanza.isStanza ? 1 : 0)
      const nextCharCount = charCount + stanza.html.length
      const exceedsStanzaLimit = stanza.isStanza && nextStanzaCount > resolvedConfig.stanzasPerSlide
      const exceedsCharLimit = chunkParts.length > 0 && nextCharCount > resolvedConfig.maxCharsPerSlide

      if (exceedsStanzaLimit || exceedsCharLimit) {
        flushChunk()
      }

      chunkParts.push(stanza.html)
      charCount += stanza.html.length
      if (stanza.isStanza) {
        stanzaCount += 1
      }
    }

    flushChunk()

    const headerLabel = buildHeaderLabel(context)
    chunks.forEach((chunk, index) => {
      slides.push(createContentSlide(index, chunk, headerLabel))
    })

    return slides
  },
}
