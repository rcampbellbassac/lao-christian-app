import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import type { AspectRatioPreset } from './aspectRatios'
import { buildImagePptx } from './pptxPackage'
import { contentHtmlToText } from './sanitize'

export interface ExportableSlide {
  id: string
  title: string
  /** Rendered element for this slide, captured while it's the visible slide. */
  element: HTMLElement
}

async function rasterizeSlide(slide: ExportableSlide, preset: AspectRatioPreset): Promise<string> {
  return toPng(slide.element, {
    cacheBust: true,
    width: preset.exportPixelWidth,
    height: Math.round(preset.exportPixelWidth / preset.ratio),
    style: {
      width: `${preset.exportPixelWidth}px`,
      height: `${Math.round(preset.exportPixelWidth / preset.ratio)}px`,
    },
  })
}

/**
 * Starts a browser download using an attached anchor and keeps the object URL
 * alive long enough for browsers that consume it after the click handler ends.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, encoded = ''] = dataUrl.split(',', 2)
  const mimeType = metadata.match(/^data:([^;,]+)/)?.[1] ?? 'application/octet-stream'
  const bytes = metadata.includes(';base64')
    ? Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(encoded))
  return new Blob([bytes], { type: mimeType })
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  downloadBlob(dataUrlToBlob(dataUrl), filename)
}

export async function exportSlideAsPng(
  slide: ExportableSlide,
  preset: AspectRatioPreset,
  filenamePrefix: string,
): Promise<void> {
  const dataUrl = await rasterizeSlide(slide, preset)
  downloadDataUrl(
    dataUrl,
    `${sanitizeFilename(filenamePrefix)}-${sanitizeFilename(slide.title)}.png`,
  )
}

export function sanitizeFilename(value: string): string {
  return (
    contentHtmlToText(value)
      .replace(/[^a-zA-Z0-9຀-໿\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'presentation'
  )
}

/**
 * Renders each slide (one at a time, via `renderSlide`) and rasterizes it at
 * the chosen aspect ratio, then bundles all PNGs into a single ZIP download.
 */
export async function exportSlidesAsZip(
  slides: Array<{ id: string; title: string }>,
  preset: AspectRatioPreset,
  renderSlide: (slide: { id: string; title: string }) => Promise<HTMLElement>,
  filenamePrefix: string,
): Promise<void> {
  const zip = new JSZip()

  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i]
    const element = await renderSlide(slide)
    const dataUrl = await rasterizeSlide({ ...slide, element }, preset)
    const base64 = dataUrl.split(',')[1]
    const filename = `${String(i + 1).padStart(2, '0')}-${sanitizeFilename(slide.title)}.png`
    zip.file(filename, base64, { base64: true })
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, `${sanitizeFilename(filenamePrefix)}-slides.zip`)
}

/**
 * Renders each slide and rasterizes it, then places each image as a
 * full-bleed background on its own .pptx slide sized to the chosen preset.
 * Slides are images (not editable text boxes) so the Lao web font always
 * renders correctly regardless of what's installed on the opening machine.
 */
export async function exportSlidesAsPptx(
  slides: Array<{ id: string; title: string }>,
  preset: AspectRatioPreset,
  renderSlide: (slide: { id: string; title: string }) => Promise<HTMLElement>,
  filenamePrefix: string,
): Promise<void> {
  const images: string[] = []

  for (const slide of slides) {
    const element = await renderSlide(slide)
    const dataUrl = await rasterizeSlide({ ...slide, element }, preset)
    images.push(dataUrl)
  }

  const blob = await buildImagePptx(images, preset)
  downloadBlob(blob, `${sanitizeFilename(filenamePrefix)}.pptx`)
}
