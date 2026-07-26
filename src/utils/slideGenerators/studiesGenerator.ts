import {
  buildHeaderLabel,
  createContentSlide,
  createTitleSlide,
  expandOversizedBlocks,
  isHeadingTag,
  normalizeConfig,
  parseBlocks,
} from './helpers'
import type { SlideGenerator } from './types'

interface SectionGroup {
  html: string
}

export const studiesSlideGenerator: SlideGenerator = {
  type: 'studies',
  generate(context, config) {
    const resolvedConfig = normalizeConfig(config)
    const blocks = expandOversizedBlocks(parseBlocks(context.html), resolvedConfig.maxCharsPerSlide)
    const slides = [createTitleSlide(context)]

    const sections: SectionGroup[] = []
    let currentSectionParts: string[] = []

    const flushSection = () => {
      if (currentSectionParts.length === 0) return
      sections.push({ html: currentSectionParts.join('') })
      currentSectionParts = []
    }

    for (const block of blocks) {
      if (isHeadingTag(block.tagName)) {
        flushSection()
        currentSectionParts.push(block.html)
        continue
      }

      if (
        currentSectionParts.length > 0
        && currentSectionParts.join('').length + block.html.length > resolvedConfig.maxCharsPerSlide
      ) {
        // Prevents an unbounded run of non-heading blocks (e.g. fragments
        // from an oversized block) from merging into a single giant section.
        flushSection()
      }

      currentSectionParts.push(block.html)
    }

    flushSection()

    const chunks: string[] = []
    let chunkParts: string[] = []
    let sectionCount = 0
    let charCount = 0

    const flushChunk = () => {
      if (chunkParts.length === 0) return
      chunks.push(chunkParts.join(''))
      chunkParts = []
      sectionCount = 0
      charCount = 0
    }

    for (const section of sections) {
      const nextSectionCount = sectionCount + 1
      const nextCharCount = charCount + section.html.length

      if (
        chunkParts.length > 0
        && (nextSectionCount > resolvedConfig.sectionsPerSlide || nextCharCount > resolvedConfig.maxCharsPerSlide)
      ) {
        flushChunk()
      }

      chunkParts.push(section.html)
      sectionCount += 1
      charCount += section.html.length
    }

    flushChunk()

    const headerLabel = buildHeaderLabel(context)
    chunks.forEach((chunk, index) => {
      slides.push(createContentSlide(index, chunk, headerLabel))
    })

    return slides
  },
}
