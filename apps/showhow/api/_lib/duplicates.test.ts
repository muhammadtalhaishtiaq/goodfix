import { describe, expect, test, vi } from 'vitest'
import { findDuplicate } from './duplicates'

const sparkJson = vi.fn()
vi.mock('./meta', () => ({ sparkJson: (...a: unknown[]) => sparkJson(...a) }))

const draft = { id: 'new', title: 'Load a dishwasher', category: 'Kitchen', creatorName: 'Talha', stepTitles: ['Scrape plates', 'Bottom rack'] }
const db = (rows: unknown[] | null, error: unknown = null) => ({ rpc: vi.fn(async () => ({ data: rows, error })) })
const cand = [{ id: 'old', title: 'How to load your dishwasher', creator_name: 'Sam', sim: 0.6 }]

describe('findDuplicate (warn, never block)', () => {
  test('no similar titles → no model call, no warning', async () => {
    sparkJson.mockReset()
    expect(await findDuplicate(db([]), draft)).toBeNull()
    expect(sparkJson).not.toHaveBeenCalled()
  })
  test('a ≥90% match returns the existing guide and what the new one adds', async () => {
    sparkJson.mockReset().mockResolvedValue({ best_id: 'old', similarity: 93, adds: 'a tip about the spray arm' })
    expect(await findDuplicate(db(cand), draft)).toEqual({ id: 'old', title: 'How to load your dishwasher', creatorName: 'Sam', similarity: 93, adds: 'a tip about the spray arm', sameCreator: false })
  })
  test('below 90 → no warning', async () => {
    sparkJson.mockReset().mockResolvedValue({ best_id: 'old', similarity: 70, adds: 'x' })
    expect(await findDuplicate(db(cand), draft)).toBeNull()
  })
  test('the same creator is flagged (did you mean to update it?)', async () => {
    sparkJson.mockReset().mockResolvedValue({ best_id: 'old', similarity: 97, adds: '' })
    expect((await findDuplicate(db([{ ...cand[0], creator_name: 'talha' }]), draft))?.sameCreator).toBe(true)
  })
  test('any error or a made-up id → no warning (best effort)', async () => {
    sparkJson.mockReset().mockRejectedValue(new Error('Meta 503'))
    expect(await findDuplicate(db(cand), draft)).toBeNull()
    sparkJson.mockReset().mockResolvedValue({ best_id: 'invented', similarity: 99, adds: '' })
    expect(await findDuplicate(db(cand), draft)).toBeNull()
    expect(await findDuplicate(db(null, { message: 'rpc down' }), draft)).toBeNull()
  })
})
