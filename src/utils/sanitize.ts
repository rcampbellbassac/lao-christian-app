import DOMPurify from 'dompurify'

const CONTENT_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sup', 'sub', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
  'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'div', 'section',
]

const CONTENT_ATTRIBUTES = ['href', 'title', 'lang', 'dir', 'class']

export function sanitizeContentHtml(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: CONTENT_TAGS,
    ALLOWED_ATTR: CONTENT_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math', 'img'],
    FORBID_ATTR: ['style', 'src', 'srcset', 'onerror', 'onclick', 'onload'],
  })
}

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value, window.location.origin)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export function extractSafeEmbedLink(value: string | null | undefined): string | null {
  if (!value) return null
  const doc = new DOMParser().parseFromString(value, 'text/html')
  const source = doc.querySelector('iframe, audio, video, source')?.getAttribute('src')
  return safeExternalUrl(source)
}
