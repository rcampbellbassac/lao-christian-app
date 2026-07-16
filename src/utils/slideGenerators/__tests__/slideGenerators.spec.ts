import { describe, expect, it } from 'vitest'
import { createSlideGenerator } from '../index'
import { representativeFixtures } from '../__fixtures__/representativeContent'

describe('slide generators', () => {
  it('uses default generator for generic content', () => {
    const generator = createSlideGenerator('default')
    const slides = generator.generate({
      title: 'Generic',
      html: '<p>One</p><p>Two</p><h2>Header</h2><p>Three</p>',
    })

    expect(slides.length).toBeGreaterThan(1)
    expect(slides[0].id).toBe('title')
  })

  it('splits long default content into readable slides', () => {
    const generator = createSlideGenerator('default')
    const longParagraph = [
      'This is a long paragraph that should not stay on a single dense slide.',
      'It should be split into smaller readable pieces for presentation mode.',
      'Each part needs to remain easy to scan from a distance.',
    ].join(' ')

    const slides = generator.generate(
      {
        title: 'Long Generic',
        html: `<p>${longParagraph.repeat(4)}</p><p>Short closing paragraph.</p>`,
      },
      { maxCharsPerSlide: 220, maxNodesPerSlide: 10 },
    )

    const contentSlides = slides.slice(1)

    expect(contentSlides.length).toBeGreaterThan(2)
    expect(contentSlides.some(slide => slide.html.includes('Short closing paragraph.'))).toBe(true)
    expect(contentSlides.every(slide => slide.html.length <= 280)).toBe(true)
  })

  it('keeps verse groups bounded for bible content', () => {
    const generator = createSlideGenerator('bible')
    const fixture = representativeFixtures.find(item => item.setKey === 'LaoBible')
    if (!fixture) throw new Error('Missing fixture LaoBible')

    const slides = generator.generate({ title: fixture.title, html: fixture.html }, { versesPerSlide: 2 })

    const contentSlides = slides.slice(1)

    expect(contentSlides.length).toBeGreaterThan(1)
    expect(contentSlides.every(slide => slide.html.length > 0)).toBe(true)
    expect(slides.length).toBeGreaterThanOrEqual(4)

    const requiredPairs = [
      { verse: '1:1', body: 'In the beginning was the Word' },
      { verse: '1:2', body: 'He was with God in the beginning' },
      { verse: '1:3', body: 'Through him all things were made' },
    ]

    requiredPairs.forEach((pair) => {
      const containingSlide = contentSlides.find(slide => slide.html.includes(pair.verse))
      expect(containingSlide, `Expected verse ${pair.verse} in one content slide`).toBeDefined()
      expect(containingSlide?.html.includes(pair.body)).toBe(true)
    })

    const rerunSlides = generator.generate({ title: fixture.title, html: fixture.html }, { versesPerSlide: 2 })
    expect(rerunSlides.map(slide => slide.html)).toEqual(slides.map(slide => slide.html))
  })

  it('keeps stanzas intact for songs content', () => {
    const generator = createSlideGenerator('songs')
    const fixture = representativeFixtures.find(item => item.setKey === 'LaoSongs')
    if (!fixture) throw new Error('Missing fixture LaoSongs')

    const slides = generator.generate({ title: fixture.title, html: fixture.html }, { stanzasPerSlide: 1 })
    const contentSlides = slides.slice(1)

    expect(contentSlides.length).toBeGreaterThanOrEqual(3)

    const stanzaChecks = [
      ['Amazing grace how sweet the sound', 'That saved a wretch like me'],
      ['I once was lost but now am found', 'Was blind but now I see'],
      ['Through many dangers toils and snares', 'I have already come'],
    ]

    stanzaChecks.forEach(([lineA, lineB]) => {
      const containingSlide = contentSlides.find(slide => slide.html.includes(lineA))
      expect(containingSlide, `Expected stanza line ${lineA} in one content slide`).toBeDefined()
      expect(containingSlide?.html.includes(lineB)).toBe(true)
    })

    const rerunSlides = generator.generate({ title: fixture.title, html: fixture.html }, { stanzasPerSlide: 1 })
    expect(rerunSlides.map(slide => slide.html)).toEqual(slides.map(slide => slide.html))
  })

  it('keeps section headings attached for studies content', () => {
    const studyFixtures = representativeFixtures.filter(item => item.type === 'studies')

    for (const fixture of studyFixtures) {
      const generator = createSlideGenerator(fixture.type)
      const slides = generator.generate(
        { title: fixture.title, html: fixture.html },
        { sectionsPerSlide: 1, maxCharsPerSlide: 500 },
      )

      expect(slides.length).toBeGreaterThan(1)
      const contentSlides = slides.slice(1)
      const headings = fixture.html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g) ?? []

      headings.forEach((headingHtml) => {
        const headingText = headingHtml.replace(/<[^>]*>/g, '').trim()
        const containingSlide = contentSlides.find(slide => slide.html.includes(headingText))
        expect(containingSlide, `Expected heading ${headingText} in a content slide`).toBeDefined()
      })

      const rerunSlides = generator.generate(
        { title: fixture.title, html: fixture.html },
        { sectionsPerSlide: 1, maxCharsPerSlide: 500 },
      )
      expect(rerunSlides.map(slide => slide.html)).toEqual(slides.map(slide => slide.html))
    }
  })

  it('generates slides for all representative content sets', () => {
    representativeFixtures.forEach((fixture) => {
      const generator = createSlideGenerator(fixture.type)
      const slides = generator.generate({ title: fixture.title, html: fixture.html })
      expect(slides[0].id).toBe('title')
      expect(slides.length).toBeGreaterThan(1)
    })
  })
})
