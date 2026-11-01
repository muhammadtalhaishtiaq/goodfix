import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { jpegSize, sizeLike } from './jpeg'

const fixture = (n: string) => readFileSync(`${process.cwd()}/api/_lib/fixtures/${n}`) // tests run from apps/showhow

describe('jpegSize', () => {
  test('reads width and height from the frame header', () => {
    expect(jpegSize(fixture('64x36.jpg'))).toEqual({ width: 64, height: 36 })
    expect(jpegSize(fixture('36x64.jpg'))).toEqual({ width: 36, height: 64 })
  })
  test('returns null for anything that is not a JPEG', () => {
    expect(jpegSize(Buffer.from('not a jpeg'))).toBeNull()
    expect(jpegSize(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull()
  })
})

describe('sizeLike', () => {
  test('asks Muse Image for the same aspect ratio as the real frame', () => {
    expect(sizeLike({ width: 1280, height: 720 })).toBe('1792x1008')
    expect(sizeLike({ width: 720, height: 1280 })).toBe('1008x1792')
    expect(sizeLike(null)).toBe('1536x1024')
  })
})
