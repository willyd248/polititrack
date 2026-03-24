import { describe, it, expect } from 'vitest'
import { inferTopicFromText } from '../lib/topicTagger'

describe('inferTopicFromText', () => {
  it('returns Healthcare for health-related text', () => {
    expect(inferTopicFromText('Healthcare Reform Bill')).toBe('Healthcare')
  })

  it('returns Environment for climate-related text', () => {
    expect(inferTopicFromText('Climate Action Act of 2024')).toBe('Environment')
  })

  it('returns Infrastructure for infrastructure text', () => {
    expect(inferTopicFromText('Infrastructure Investment Act')).toBe('Infrastructure')
  })

  it('returns Defense for defense text', () => {
    expect(inferTopicFromText('National Defense Authorization Act')).toBe('Defense')
  })

  it('returns Agriculture for farm text', () => {
    expect(inferTopicFromText('Farm Bill 2024')).toBe('Agriculture')
  })

  it('returns null for unmatched text', () => {
    expect(inferTopicFromText('Tax Reform Act')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(inferTopicFromText('')).toBeNull()
  })

  it('returns null for null/undefined input', () => {
    expect(inferTopicFromText(null as unknown as string)).toBeNull()
    expect(inferTopicFromText(undefined as unknown as string)).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(inferTopicFromText('CLIMATE CHANGE POLICY')).toBe('Environment')
  })
})
