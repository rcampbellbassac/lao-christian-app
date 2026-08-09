import DOMPurify from 'dompurify'

const CONTENT_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'sup',
  'sub',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'a',
  'div',
  'section',
  'mark',
]

const CONTENT_ATTRIBUTES = ['href', 'title', 'lang', 'dir', 'class']

export function sanitizeContentHtml(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: CONTENT_TAGS,
    ALLOWED_ATTR: CONTENT_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [
      'script',
      'style',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'button',
      'svg',
      'math',
      'img',
    ],
    FORBID_ATTR: ['style', 'src', 'srcset', 'onerror', 'onclick', 'onload'],
  })
}

export function contentHtmlToText(html: string | null | undefined): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(sanitizeContentHtml(html), 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export function applyInlineHighlights(html: string, exactPhrases: string[]): string {
  if (!exactPhrases.length) return html
  const doc = new DOMParser().parseFromString(
    `<div id="highlight-root">${sanitizeContentHtml(html)}</div>`,
    'text/html',
  )
  const root = doc.querySelector('#highlight-root')
  if (!root) return sanitizeContentHtml(html)

  for (const phrase of exactPhrases.filter((value) => value.length >= 2)) {
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const nodes: Text[] = []
    let node = walker.nextNode()
    while (node) {
      if (!node.parentElement?.closest('mark')) nodes.push(node as Text)
      node = walker.nextNode()
    }
    for (const textNode of nodes) {
      const value = textNode.data
      const index = value.indexOf(phrase)
      if (index < 0) continue
      const before = value.slice(0, index)
      const after = value.slice(index + phrase.length)
      const mark = doc.createElement('mark')
      mark.className = 'study-inline-highlight'
      mark.textContent = phrase
      textNode.replaceWith(doc.createTextNode(before), mark, doc.createTextNode(after))
      break
    }
  }
  return sanitizeContentHtml(root.innerHTML)
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
