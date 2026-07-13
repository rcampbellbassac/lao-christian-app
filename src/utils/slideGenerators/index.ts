import { bibleSlideGenerator } from './bibleGenerator'
import { defaultSlideGenerator } from './defaultGenerator'
import { songsSlideGenerator } from './songsGenerator'
import { studiesSlideGenerator } from './studiesGenerator'
import type { SlideContentType, SlideGenerator } from './types'

const generators: Record<SlideContentType, SlideGenerator> = {
  default: defaultSlideGenerator,
  bible: bibleSlideGenerator,
  songs: songsSlideGenerator,
  studies: studiesSlideGenerator,
}

export function createSlideGenerator(type: SlideContentType): SlideGenerator {
  return generators[type] ?? generators.default
}

export function getRegisteredSlideGeneratorTypes(): SlideContentType[] {
  return Object.keys(generators) as SlideContentType[]
}

export * from './types'
