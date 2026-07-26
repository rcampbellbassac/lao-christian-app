import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'
import type { AspectRatioPreset } from './aspectRatios'

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

export function sanitizeFilename(value: string): string {
  return (
    value
      .replace(/<[^>]*>/g, '')
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
  filenamePrefix: string
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
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `${sanitizeFilename(filenamePrefix)}-slides.zip`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
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
  filenamePrefix: string
): Promise<void> {
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'CUSTOM', width: preset.pptxInches.width, height: preset.pptxInches.height })
  pptx.layout = 'CUSTOM'

  for (const slide of slides) {
    const element = await renderSlide(slide)
    const dataUrl = await rasterizeSlide({ ...slide, element }, preset)
    const pptxSlide = pptx.addSlide()
    pptxSlide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: preset.pptxInches.width,
      h: preset.pptxInches.height,
    })
  }

  await pptx.writeFile({ fileName: `${sanitizeFilename(filenamePrefix)}.pptx` })
}
