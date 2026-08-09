import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { getAspectRatioPreset } from './aspectRatios'
import { buildImagePptx, PPTX_MIME_TYPE } from './pptxPackage'

const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAASUExURUxpcQAAAAAAAAAAAAAAAAAAACUC4ZMAAAAFdFJOUwDxJzBL//uJ/QAAAMF6VFh0UmF3IHByb2ZpbGUgdHlwZSBleGlmAAAYlW1Q2w3DIAz89xQdAT8gMA5pqNQNOn5tbKok6kncHTYYbBif9wseBkIByVstrZSkkCaNupqaHH0yJpk8kUc4vMbhlyBVVmVP1OKKKx4XlmJXl0+F6jMS+zXRxJXqrRC5sP3I/BGFWhRi8gRGge5tpdLqdm5hH+mK6guMnisYh+972XR6R9Z3mGgwclJmFv8A2xLgPo2x6EGcnlSNV6s6kH9zWoAvpFZZw7JHiAEAAAAJcEhZcwAAHYcAAB2HAY/l8WUAAABASURBVAjXY2BAAqEBUDoUwmIFMkKhAhAhIMkaGgRjhIKUMEAJmAiEEQxlQM0JYAgVgNjACrUDrAcIXEORXcAAACTfEOa/h9A9AAAAV3pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHic4/IMCHFWKCjKT8vMSeVSAAMjCy5jCxMjE0uTFAMTIESANMNkAyOzVCDL2NTIxMzEHMQHy4BIoEouAOoXEXTyQjWVAAAAAElFTkSuQmCC'

describe('PPTX package builder', () => {
  it('creates a complete image-only presentation without external image parsing', async () => {
    const blob = await buildImagePptx([ONE_PIXEL_PNG, ONE_PIXEL_PNG], getAspectRatioPreset('16:9'))
    const archive = await JSZip.loadAsync(blob)
    const names = Object.keys(archive.files)

    expect(blob.type).toBe(PPTX_MIME_TYPE)
    expect(names).toContain('[Content_Types].xml')
    expect(names).toContain('ppt/presentation.xml')
    expect(names).toContain('ppt/slides/slide1.xml')
    expect(names).toContain('ppt/slides/slide2.xml')
    expect(names).toContain('ppt/media/image1.png')
    expect(names).toContain('ppt/media/image2.png')

    const presentation = await archive.file('ppt/presentation.xml')!.async('text')
    expect(presentation).toContain('cx="12191695"')
    expect(presentation).toContain('cy="6858000"')
    expect(presentation.match(/<p:sldId /g)).toHaveLength(2)
  })

  it('rejects empty presentations and non-PNG slide data', async () => {
    await expect(buildImagePptx([], getAspectRatioPreset('16:9'))).rejects.toThrow(
      'At least one slide',
    )
    await expect(
      buildImagePptx(['data:image/jpeg;base64,AA=='], getAspectRatioPreset('16:9')),
    ).rejects.toThrow('base64 PNG')
  })
})
