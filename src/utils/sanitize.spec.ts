import { describe, expect, it } from 'vitest'
import { applyInlineHighlights, extractSafeEmbedLink, safeExternalUrl, sanitizeContentHtml } from './sanitize'

describe('content sanitization', () => {
  it('preserves reading markup while removing executable content', () => {
    const clean = sanitizeContentHtml('<h2 onclick="steal()">Title</h2><script>steal()</script><p style="position:fixed">Text <strong>bold</strong></p>')
    expect(clean).toContain('<h2>Title</h2>')
    expect(clean).toContain('<strong>bold</strong>')
    expect(clean).not.toContain('script')
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('style=')
  })

  it('allows HTTPS media links and rejects active or insecure protocols', () => {
    expect(safeExternalUrl('https://example.com/audio.mp3')).toContain('https://example.com')
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(safeExternalUrl('http://example.com/audio.mp3')).toBeNull()
  })

  it('extracts a safe link from legacy embed HTML without rendering the embed', () => {
    expect(extractSafeEmbedLink('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toBe('https://www.youtube.com/embed/abc')
  })

  it('marks exact text without making stored HTML executable', () => {
    const marked = applyInlineHighlights('<p>ພຣະເຈົ້າຊົງຮັກໂລກ<script>bad()</script></p>', ['ຊົງຮັກ'])
    expect(marked).toContain('<mark class="study-inline-highlight">ຊົງຮັກ</mark>')
    expect(marked).not.toContain('script')
  })
})
