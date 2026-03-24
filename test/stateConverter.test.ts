import { describe, it, expect } from 'vitest'
import { stateNameToCode } from '../lib/stateConverter'

describe('stateNameToCode', () => {
  it('converts full state name to code', () => {
    expect(stateNameToCode('California')).toBe('CA')
    expect(stateNameToCode('New York')).toBe('NY')
    expect(stateNameToCode('Texas')).toBe('TX')
  })

  it('returns 2-letter code as-is (uppercased)', () => {
    expect(stateNameToCode('CA')).toBe('CA')
    expect(stateNameToCode('ny')).toBe('NY')
  })

  it('handles case-insensitive lookup', () => {
    expect(stateNameToCode('california')).toBe('CA')
    expect(stateNameToCode('NEW YORK')).toBe('NY')
  })

  it('converts DC', () => {
    expect(stateNameToCode('District of Columbia')).toBe('DC')
  })

  it('returns original string for unknown input', () => {
    expect(stateNameToCode('Unknown Place')).toBe('Unknown Place')
  })

  it('returns falsy input as-is', () => {
    expect(stateNameToCode('')).toBe('')
  })
})
