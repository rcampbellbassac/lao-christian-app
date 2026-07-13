import {
  createContentSlide,
  createTitleSlide,
  isHeadingTag,
  normalizeConfig,
  parseBlocks,
} from './helpers'
import type { ParsedBlock } from './helpers'
import type { SlideGenerator } from './types'

const verseStartPattern = /^((\d+[:.]\d+)|(\d+\s+))/

function isVerseStart(block: ParsedBlock): boolean {
  if (!block.text) return false

  if (block.isElement && (block.tagName === 'strong' || block.tagName === 'sup')) {
    return true
  }

  return verseStartPattern.test(block.text)
}

interface VerseGroup {
  html: string
  isVerse: boolean
}

export const bibleSlideGenerator: SlideGenerator = {
  type: 'bible',
  generate(context, config) {
    const resolvedConfig = normalizeConfig(config)
    const blocks = parseBlocks(context.html)
    const slides = [createTitleSlide(context)]

    const verseGroups: VerseGroup[] = []
    let currentVerseParts: string[] = []
    let currentIsVerse = false
    let pendingPrefixParts: string[] = []

    const flushVerseGroup = () => {
      if (currentVerseParts.length === 0) return
      verseGroups.push({ html: currentVerseParts.join(''), isVerse: currentIsVerse })
      currentVerseParts = []
      currentIsVerse = false
    }

    for (const block of blocks) {
      if (isHeadingTag(block.tagName)) {
        flushVerseGroup()
        pendingPrefixParts = [block.html]
        continue
      }

      if (isVerseStart(block)) {
        flushVerseGroup()
        currentVerseParts = [...pendingPrefixParts, block.html]
        currentIsVerse = true
        pendingPrefixParts = []
        continue
      }

      if (currentVerseParts.length === 0) {
        currentVerseParts = [...pendingPrefixParts, block.html]
        pendingPrefixParts = []
        currentIsVerse = false
      } else {
        currentVerseParts.push(block.html)
      }
    }

    flushVerseGroup()
    if (pendingPrefixParts.length > 0) {
      verseGroups.push({ html: pendingPrefixParts.join(''), isVerse: false })
    }

    const chunks: string[] = []
    let currentChunkParts: string[] = []
    let currentVerseCount = 0
    let currentCharCount = 0

    const flushChunk = () => {
      if (currentChunkParts.length === 0) return
      chunks.push(currentChunkParts.join(''))
      currentChunkParts = []
      currentVerseCount = 0
      currentCharCount = 0
    }

    for (const group of verseGroups) {
      const nextVerseCount = currentVerseCount + (group.isVerse ? 1 : 0)
      const nextCharCount = currentCharCount + group.html.length

      const exceedsVerseLimit = group.isVerse && nextVerseCount > resolvedConfig.versesPerSlide
      const exceedsCharLimit = currentChunkParts.length > 0 && nextCharCount > resolvedConfig.maxCharsPerSlide

      if (exceedsVerseLimit || exceedsCharLimit) {
        flushChunk()
      }

      currentChunkParts.push(group.html)
      currentCharCount += group.html.length
      if (group.isVerse) {
        currentVerseCount += 1
      }
    }

    flushChunk()

    chunks.forEach((chunk, index) => {
      slides.push(createContentSlide(index, chunk))
    })

    return slides
  },
}
