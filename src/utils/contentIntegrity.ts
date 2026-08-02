export interface ContentChecksums {
  raw?: string
  gzip?: string
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', bytes))
}

function isGzip(bytes: ArrayBuffer): boolean {
  const view = new Uint8Array(bytes)
  return view.length >= 2 && view[0] === 0x1f && view[1] === 0x8b
}

async function decompressGzip(bytes: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot open compressed content downloads.')
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).arrayBuffer()
}

async function assertChecksum(bytes: ArrayBuffer, expected?: string): Promise<void> {
  if (!expected) return
  const actual = await sha256Hex(bytes)
  if (actual.toLowerCase() !== expected.trim().toLowerCase()) {
    throw new Error('Content integrity check failed. The previous offline copy was kept.')
  }
}

export async function decodeVerifiedJson<T>(bytes: ArrayBuffer, checksums: ContentChecksums): Promise<T> {
  let jsonBytes = bytes
  if (isGzip(bytes)) {
    await assertChecksum(bytes, checksums.gzip)
    jsonBytes = await decompressGzip(bytes)
    // When only a raw checksum is published, verify the decompressed payload too.
    if (!checksums.gzip) await assertChecksum(jsonBytes, checksums.raw)
  } else {
    // Fetch transparently decompresses responses carrying Content-Encoding: gzip.
    await assertChecksum(bytes, checksums.raw)
  }

  try {
    return JSON.parse(new TextDecoder().decode(jsonBytes)) as T
  } catch {
    throw new Error('Downloaded content is not valid JSON. The previous offline copy was kept.')
  }
}
