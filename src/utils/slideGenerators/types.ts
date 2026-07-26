export type SlideContentType = 'default' | 'bible' | 'songs' | 'studies'

export interface Slide {
  id: string
  title: string
  html: string
}

export interface SlideGeneratorConfig {
  maxNodesPerSlide: number
  maxCharsPerSlide: number
  hardBreakTags: string[]
  versesPerSlide: number
  stanzasPerSlide: number
  sectionsPerSlide: number
}

export interface SlideGeneratorContext {
  title: string
  html: string
  /** Book/unit name, shown alongside the chapter title on the title slide
   *  and as the running header on content slides instead of a generic
   *  "Slide N" label. */
  bookTitle?: string
}

export interface SlideGenerator {
  type: SlideContentType
  generate(context: SlideGeneratorContext, config?: Partial<SlideGeneratorConfig>): Slide[]
}

export const defaultSlideGeneratorConfig: SlideGeneratorConfig = {
  maxNodesPerSlide: 5,
  maxCharsPerSlide: 1400,
  hardBreakTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr'],
  versesPerSlide: 6,
  stanzasPerSlide: 2,
  sectionsPerSlide: 2,
}
