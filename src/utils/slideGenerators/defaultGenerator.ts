import {
  createContentSlide,
  createTitleSlide,
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
    const blocks = parseBlocks(context.html)
    const slides = [createTitleSlide(context)]

    const chunks: string[] = []
    let currentChunk: string[] = []

    const flushChunk = () => {
      if (currentChunk.length === 0) return
      chunks.push(currentChunk.join(''))
      currentChunk = []
    }

    for (const block of blocks) {
      if (isHeadingTag(block.tagName) && currentChunk.length > 0) {
        flushChunk()
      }

      currentChunk.push(block.html)

      if (isHardBreakTag(block.tagName, resolvedConfig) || currentChunk.length >= resolvedConfig.maxNodesPerSlide) {
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
