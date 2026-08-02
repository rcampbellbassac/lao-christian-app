export type AspectRatioId = '16:9' | '4:3' | '1:1' | 'a4'

export interface AspectRatioPreset {
  id: AspectRatioId
  label: string
  labelKey: 'ratio.widescreen' | 'ratio.standard' | 'ratio.square' | 'ratio.portrait'
  description: string
  /** width / height */
  ratio: number
  /** Page size in inches, used when building the .pptx export. */
  pptxInches: { width: number; height: number }
  /** Raster width in px used for PNG/pptx image export; height derives from ratio. */
  exportPixelWidth: number
}

export const aspectRatioPresets: AspectRatioPreset[] = [
  {
    id: '16:9',
    label: '16:9 Widescreen',
    labelKey: 'ratio.widescreen',
    description: 'Default for modern PowerPoint, Google Slides, and Canva presentations.',
    ratio: 16 / 9,
    pptxInches: { width: 13.333, height: 7.5 },
    exportPixelWidth: 1920,
  },
  {
    id: '4:3',
    label: '4:3 Standard',
    labelKey: 'ratio.standard',
    description: 'Classic presentation ratio for older templates and projectors.',
    ratio: 4 / 3,
    pptxInches: { width: 10, height: 7.5 },
    exportPixelWidth: 1600,
  },
  {
    id: '1:1',
    label: '1:1 Square',
    labelKey: 'ratio.square',
    description: 'Square slides for social media carousels (Canva/Instagram-style).',
    ratio: 1,
    pptxInches: { width: 10, height: 10 },
    exportPixelWidth: 1600,
  },
  {
    id: 'a4',
    label: 'A4 / Letter Portrait',
    labelKey: 'ratio.portrait',
    description: 'Print-oriented portrait page for handouts rather than on-screen presenting.',
    ratio: 8.5 / 11,
    pptxInches: { width: 8.5, height: 11 },
    exportPixelWidth: 1275,
  },
]

export const DEFAULT_ASPECT_RATIO_ID: AspectRatioId = '16:9'

export function getAspectRatioPreset(id: AspectRatioId): AspectRatioPreset {
  return aspectRatioPresets.find(preset => preset.id === id) ?? aspectRatioPresets[0]
}
