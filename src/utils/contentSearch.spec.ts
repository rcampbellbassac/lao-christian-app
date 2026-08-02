import { describe, expect, it } from 'vitest'
import { searchContentSets, type CachedSearchSet } from './contentSearch'

const sets = [{
  material: { id: 1, eng_name: 'Bible', native_name: 'ພຣະຄຳພີ', url: 'Bible.json', lang: { name: 'Lao', native_name: 'ລາວ', emoji_flag: '🇱🇦' }, icon: '' },
  data: {
    id: 1, title: 'Bible', description: '', imageurl: '', enabled: 1, created_at: '', updated_at: '', language: 'Lao', sortorder: 1, series: 1, lang: 1,
    unit: [{ id: 10, name: 'ປະຖົມມະການ', content: null, enabled: 1, books_id: 1, created_at: '', updated_at: '', sortorder: 1, toc: [], contents: [{ id: 20, name: 'ບົດທີ 1', content: '<p>ໃນປະຖົມມະການ ພຣະເຈົ້າຊົງສ້າງຟ້າສະຫວັນ</p>', pdfurl: '', audiourl: '', videourl: '', audioembed: '', videoembed: '', units_id: 10, created_at: '', updated_at: '', sortorder: 1 }] }],
  },
}] satisfies CachedSearchSet[]

describe('content search', () => {
  it('finds normalized Lao content and creates a snippet', () => {
    const results = searchContentSets(sets, 'ພຣະເຈົ້າ')
    expect(results).toHaveLength(1)
    expect(results[0]?.chapterId).toBe(20)
    expect(results[0]?.snippet).toContain('ພຣະເຈົ້າ')
  })

  it('searches existing English collection metadata without translating content', () => {
    expect(searchContentSets(sets, 'Bible')).toHaveLength(1)
  })

  it('ignores one-character searches', () => {
    expect(searchContentSets(sets, 'ພ')).toEqual([])
  })
})
