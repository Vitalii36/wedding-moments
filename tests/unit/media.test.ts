import { describe, expect, it } from 'vitest'
import {
  extensionOf,
  fitWithin,
  formatBytes,
  kindOf,
  objectPaths,
  resolveMime,
  storageExtension,
  validateFile,
} from '../../src/lib/media'

const MAX = 2 * 1024 ** 3

describe('extensionOf', () => {
  it('lowercases and extracts', () => {
    expect(extensionOf('IMG_0001.HEIC')).toBe('heic')
    expect(extensionOf('clip.final.mov')).toBe('mov')
  })
  it('returns null when missing', () => {
    expect(extensionOf('noext')).toBeNull()
    expect(extensionOf('weird.toolongext')).toBeNull()
  })
})

describe('resolveMime', () => {
  it('prefers reported type', () => {
    expect(resolveMime('a.jpg', 'image/png')).toBe('image/png')
  })
  it('falls back to extension when type empty or octet-stream', () => {
    expect(resolveMime('a.HEIC', '')).toBe('image/heic')
    expect(resolveMime('b.mov', 'application/octet-stream')).toBe('video/quicktime')
  })
  it('unknown stays octet-stream', () => {
    expect(resolveMime('c.xyz', '')).toBe('application/octet-stream')
  })
})

describe('kindOf', () => {
  it('classifies', () => {
    expect(kindOf('image/heic')).toBe('photo')
    expect(kindOf('video/mp4')).toBe('video')
    expect(kindOf('application/pdf')).toBeNull()
  })
})

describe('storageExtension', () => {
  it('uses filename ext, else mime, else bin', () => {
    expect(storageExtension('x.JPG', 'image/jpeg')).toBe('jpg')
    expect(storageExtension('blob', 'video/quicktime')).toBe('mov')
    expect(storageExtension('blob', 'image/x-unknown')).toBe('bin')
  })
})

describe('validateFile', () => {
  it('accepts photo and video', () => {
    expect(validateFile({ name: 'a.jpg', type: 'image/jpeg', size: 10 }, MAX)).toEqual({
      ok: true,
      kind: 'photo',
      mime: 'image/jpeg',
      ext: 'jpg',
    })
    expect(validateFile({ name: 'v.mov', type: '', size: 10 }, MAX)).toMatchObject({ ok: true, kind: 'video' })
  })
  it('rejects wrong type, too big, empty', () => {
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 10 }, MAX)).toEqual({ ok: false, reason: 'type' })
    expect(validateFile({ name: 'a.mp4', type: 'video/mp4', size: MAX + 1 }, MAX)).toEqual({ ok: false, reason: 'size' })
    expect(validateFile({ name: 'a.mp4', type: 'video/mp4', size: 0 }, MAX)).toEqual({ ok: false, reason: 'empty' })
  })
})

describe('objectPaths', () => {
  it('builds owner-scoped paths', () => {
    expect(objectPaths('u1', 'id1', 'mov')).toEqual({ path: 'u1/id1.mov', thumbPath: 'u1/id1_t.jpg' })
  })
})

describe('fitWithin', () => {
  it('scales landscape and portrait to longest side', () => {
    expect(fitWithin(4032, 3024, 480)).toEqual({ width: 480, height: 360 })
    expect(fitWithin(1080, 1920, 480)).toEqual({ width: 270, height: 480 })
  })
  it('never upscales', () => {
    expect(fitWithin(200, 100, 480)).toEqual({ width: 200, height: 100 })
  })
  it('handles zero', () => {
    expect(fitWithin(0, 100, 480)).toEqual({ width: 0, height: 0 })
  })
})

describe('formatBytes', () => {
  it('formats', () => {
    expect(formatBytes(500)).toBe('500 Б')
    expect(formatBytes(1536)).toBe('1.5 КБ')
    expect(formatBytes(2 * 1024 ** 3)).toBe('2.0 ГБ')
  })
})
