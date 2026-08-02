import type { ContentSet, MaterialSet } from '@/stores/content'

export interface CachedSearchSet {
  material: MaterialSet
  data: ContentSet
}

export interface ContentSearchResult {
  fileId: number
  bookId: number
  chapterId: number
  collectionTitle: string
  bookTitle: string
  chapterTitle: string
  snippet: string
  score: number
}

export function plainText(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalize(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim()
}

function snippetAround(text: string, query: string): string {
  const normalizedText = normalize(text)
  const index = normalizedText.indexOf(query)
  if (index < 0) return text.slice(0, 180)
  const start = Math.max(0, index - 70)
  const end = Math.min(text.length, index + query.length + 110)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}

export function searchContentSets(sets: CachedSearchSet[], rawQuery: string, limit = 100): ContentSearchResult[] {
  const query = normalize(rawQuery)
  if (query.length < 2) return []
  const results: ContentSearchResult[] = []

  for (const set of sets) {
    for (const book of set.data.unit) {
      for (const chapter of book.contents) {
        const collection = normalize(`${set.material.native_name} ${set.material.eng_name}`)
        const bookTitle = normalize(plainText(book.name))
        const chapterTitle = normalize(plainText(chapter.name))
        const content = plainText(chapter.content || '')
        const normalizedContent = normalize(content)
        let score = 0
        if (chapterTitle.includes(query)) score += 12
        if (bookTitle.includes(query)) score += 8
        if (collection.includes(query)) score += 4
        if (normalizedContent.includes(query)) score += 2
        if (score === 0) continue

        results.push({
          fileId: set.material.id,
          bookId: book.id,
          chapterId: chapter.id,
          collectionTitle: set.material.native_name,
          bookTitle: plainText(book.name),
          chapterTitle: plainText(chapter.name),
          snippet: snippetAround(content, query),
          score,
        })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score || a.chapterTitle.localeCompare(b.chapterTitle, 'lo')).slice(0, limit)
}
