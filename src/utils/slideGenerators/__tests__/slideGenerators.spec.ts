import { describe, expect, it } from 'vitest'
import { createSlideGenerator } from '../index'
import { buildSlidesFromSelection, parseBlocks } from '../helpers'
import { representativeFixtures } from '../__fixtures__/representativeContent'

describe('buildSlidesFromSelection', () => {
  const html = '<p>Alpha</p><p>Beta</p><h2>Header</h2><p>Gamma</p><p>Delta</p>'
  const context = { title: 'Chapter One', bookTitle: 'Genesis', html }

  it('always includes a title slide first, matching the normal generators', () => {
    const blocks = parseBlocks(html)
    const slides = buildSlidesFromSelection(context, blocks, 'grouped')
    expect(slides[0].id).toBe('title')
    expect(slides[0].title).toBe('Chapter One')
    expect(slides[0].html).toBe('Genesis')
  })

  it('grouped mode merges the selection into as few slides as fit maxCharsPerSlide', () => {
    const allBlocks = parseBlocks(html)
    const selected = [allBlocks[0], allBlocks[1], allBlocks[3]] // Alpha, Beta, Gamma (skip Header/Delta)
    const slides = buildSlidesFromSelection(context, selected, 'grouped', { maxCharsPerSlide: 1000 })

    const contentSlides = slides.slice(1)
    expect(contentSlides.length).toBe(1)
    expect(contentSlides[0].html).toContain('Alpha')
    expect(contentSlides[0].html).toContain('Beta')
    expect(contentSlides[0].html).toContain('Gamma')
    expect(contentSlides[0].html).not.toContain('Delta')
    expect(contentSlides[0].title).toBe('Genesis — Chapter One')
  })

  it('split mode gives each selected block its own slide', () => {
    const allBlocks = parseBlocks(html)
    const selected = [allBlocks[0], allBlocks[1], allBlocks[3]]
    const slides = buildSlidesFromSelection(context, selected, 'split', { maxCharsPerSlide: 1000 })

    const contentSlides = slides.slice(1)
    expect(contentSlides.length).toBe(3)
    expect(contentSlides[0].html).toContain('Alpha')
    expect(contentSlides[1].html).toContain('Beta')
    expect(contentSlides[2].html).toContain('Gamma')
  })

  it('split mode still auto-splits an individually oversized selected block', () => {
    const longSentence = 'This sentence keeps repeating so the paragraph becomes far too long for one slide. '
    const oversizedHtml = `<p>${longSentence.repeat(20)}</p>`
    const blocks = parseBlocks(oversizedHtml)

    const slides = buildSlidesFromSelection(context, blocks, 'split', { maxCharsPerSlide: 200 })
    const contentSlides = slides.slice(1)

    expect(contentSlides.length).toBeGreaterThan(1)
    expect(contentSlides.every((slide) => slide.html.length <= 260)).toBe(true)
  })
})

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

  it('shows book name as the title-slide subtitle and "Book — Chapter" on content slides', () => {
    const generator = createSlideGenerator('default')
    const slides = generator.generate({
      title: 'Chapter One',
      bookTitle: 'Genesis',
      html: '<p>One</p><p>Two</p><h2>Header</h2><p>Three</p>',
    })

    expect(slides[0].id).toBe('title')
    expect(slides[0].title).toBe('Chapter One')
    expect(slides[0].html).toBe('Genesis')

    const contentSlides = slides.slice(1)
    expect(contentSlides.length).toBeGreaterThan(0)
    contentSlides.forEach((slide) => {
      expect(slide.title).toBe('Genesis — Chapter One')
    })
  })

  it('falls back to just the chapter title when no book name is given', () => {
    const generator = createSlideGenerator('default')
    const slides = generator.generate({
      title: 'Chapter One',
      html: '<p>One</p><p>Two</p>',
    })

    expect(slides[0].html).toBe('')
    expect(slides[1].title).toBe('Chapter One')
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

  it('splits list-heavy default content into readable slides', () => {
    const generator = createSlideGenerator('default')
    const html = [
      '<h2>Checklist</h2>',
      '<ul>',
      '<li>First bullet with enough context to need its own readable chunk.</li>',
      '<li>Second bullet with more supporting detail and a second sentence.</li>',
      '<li>Third bullet keeps the content moving without overcrowding the slide.</li>',
      '<li>Fourth bullet adds one more line to make the list intentionally long.</li>',
      '</ul>',
      '<blockquote>Long quoted material should remain readable and not feel like a wall of text. It needs to be split into smaller pieces.</blockquote>',
    ].join('')

    const slides = generator.generate(
      { title: 'List Heavy', html },
      { maxCharsPerSlide: 180, maxNodesPerSlide: 4 },
    )

    const contentSlides = slides.slice(1)

    expect(contentSlides.length).toBeGreaterThan(3)
    expect(contentSlides.some(slide => slide.html.includes('<li>First bullet'))).toBe(true)
    expect(contentSlides.some(slide => slide.html.includes('<blockquote>'))).toBe(true)
    expect(contentSlides.every(slide => slide.html.length <= 260)).toBe(true)
  })

  it('splits a chapter wrapped in a single outer div into multiple verse-bounded slides', () => {
    // Real LaoBible.json data wraps every chapter's content in one outer <div>,
    // e.g. <div><h1>...</h1><p><sup>1</sup>...</p><p><sup>2</sup>...</p>...</div>.
    // Without unwrapping this container, parseBlocks() sees one giant block
    // instead of one block per verse, and the whole chapter collapses into a
    // single unreadable slide.
    const generator = createSlideGenerator('bible')
    const verses = Array.from({ length: 10 }, (_, i) => {
      const verseNumber = i + 1
      return `<p><sup><span class="verse">${verseNumber}</span></sup> This is verse number ${verseNumber} with enough text to be meaningful.</p>`
    }).join('')
    const html = `<div><h1>Genesis Chapter 1</h1>${verses}</div>`

    const slides = generator.generate({ title: 'Genesis 1', html }, { versesPerSlide: 3 })
    const contentSlides = slides.slice(1)

    expect(contentSlides.length).toBeGreaterThan(1)
    expect(contentSlides.every(slide => slide.html.length < html.length)).toBe(true)

    const verse1Slide = contentSlides.find(slide => slide.html.includes('verse number 1 '))
    const verse10Slide = contentSlides.find(slide => slide.html.includes('verse number 10 '))
    expect(verse1Slide).toBeDefined()
    expect(verse10Slide).toBeDefined()
    expect(verse1Slide).not.toBe(verse10Slide)
  })

  it('unwraps nested single-child section/div wrappers for default content too', () => {
    const generator = createSlideGenerator('default')
    const html = '<div><section><div><p>One</p><p>Two</p><h2>Header</h2><p>Three</p></div></section></div>'

    const slides = generator.generate({ title: 'Nested', html }, { maxNodesPerSlide: 1 })
    const contentSlides = slides.slice(1)

    expect(contentSlides.length).toBeGreaterThan(1)
    expect(contentSlides.some(slide => slide.html.includes('One'))).toBe(true)
    expect(contentSlides.some(slide => slide.html.includes('Header'))).toBe(true)
  })

  it('does not unwrap a wrapper div that carries its own attributes', () => {
    const generator = createSlideGenerator('default')
    const html = '<div class="chapter"><p>One</p><p>Two</p></div>'

    const slides = generator.generate({ title: 'Attributed wrapper', html })
    const contentSlides = slides.slice(1)

    expect(contentSlides.length).toBeGreaterThan(0)
    expect(contentSlides.some(slide => slide.html.includes('One') && slide.html.includes('Two'))).toBe(true)
  })

  it.each(['bible', 'songs', 'studies'] as const)(
    'splits an oversized single block for %s content as a defense-in-depth fallback',
    (type) => {
      const generator = createSlideGenerator(type)
      const longSentence = 'This sentence keeps repeating so the paragraph becomes far too long for one slide. '
      const html = `<p>${longSentence.repeat(20)}</p>`

      const slides = generator.generate({ title: 'Oversized block', html }, { maxCharsPerSlide: 200 })
      const contentSlides = slides.slice(1)

      expect(contentSlides.length).toBeGreaterThan(1)
      expect(contentSlides.every(slide => slide.html.length <= 260)).toBe(true)
    }
  )

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
