import { describe, expect, it } from 'vitest'
import { decodeVerifiedJson, sha256Hex } from './contentIntegrity'

const encoder = new TextEncoder()

describe('content integrity', () => {
  it('computes a stable SHA-256 digest', async () => {
    expect(await sha256Hex(encoder.encode('abc').buffer)).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('accepts verified JSON and rejects altered bytes', async () => {
    const original = encoder.encode('{"id":1}').buffer
    const checksum = await sha256Hex(original)
    await expect(decodeVerifiedJson<{ id: number }>(original, { raw: checksum })).resolves.toEqual({ id: 1 })
    await expect(decodeVerifiedJson(encoder.encode('{"id":2}').buffer, { raw: checksum })).rejects.toThrow(
      'integrity check failed',
    )
  })
})
