import { afterEach, describe, expect, it, vi } from 'vitest'
import { dataUrlToBlob, downloadBlob, sanitizeFilename } from './presentationExport'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('presentation exports', () => {
  it('converts base64 data URLs into typed blobs', () => {
    const blob = dataUrlToBlob('data:text/plain;base64,SGVsbG8=')

    expect(blob.type).toBe('text/plain')
    expect(blob.size).toBe(5)
  })

  it('downloads through an anchor attached to the document', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    downloadBlob(new Blob(['test']), 'slides.zip')

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(document.querySelector('a[download="slides.zip"]')).toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.advanceTimersByTime(30_000)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    vi.useRealTimers()
  })

  it('keeps Lao characters while making safe filenames', () => {
    expect(sanitizeFilename('<b>ພຣະຄຳ</b> / lesson 1')).toBe('ພຣະຄຳ-lesson-1')
  })
})
