import {
  buildHeaderLabel,
  createContentSlide,
  createTitleSlide,
  expandOversizedBlocks,
  isHardBreakTag,
  isHeadingTag,
  normalizeConfig,
  parseBlocks,
} from './helpers'
import type { SlideGenerator } from './types'

export const defaultSlideGenerator: SlideGenerator = {
  type: 'default',
  generate(context, config) {
    const resolvedConfig = normalizeConfig(config)
    const blocks = expandOversizedBlocks(parseBlocks(context.html), resolvedConfig.maxCharsPerSlide)
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

    const headerLabel = buildHeaderLabel(context)
    chunks.forEach((chunk, index) => {
      slides.push(createContentSlide(index, chunk, headerLabel))
    })

    return slides
  },
}
