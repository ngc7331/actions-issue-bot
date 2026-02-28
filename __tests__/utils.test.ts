import { normalizeStringList, previewString } from '../src/utils/index.js'

describe('utils', () => {
  it('previews long strings by truncating', () => {
    const text = 'a'.repeat(100)
    expect(previewString(text, 10)).toBe('aaaaaaaaaa…')
  })

  it('returns original when shorter than max', () => {
    expect(previewString('short', 10)).toBe('short')
  })

  it('normalizes lists and filters empty values', () => {
    expect(normalizeStringList(['a', '', 'b'])).toEqual(['a', 'b'])
    expect(normalizeStringList(undefined)).toEqual([])
    expect(normalizeStringList('solo')).toEqual(['solo'])
  })

  it('deduplicates when unique=true', () => {
    expect(normalizeStringList(['a', 'a', 'b'], true)).toEqual(['a', 'b'])
  })
})
