// Guide source. Fixtures for now; T3 reads published guides from Supabase.
import { FIXTURE_GUIDES } from '../fixtures/guides'
import type { CheckRequest, CheckResult, Guide } from './types'

const guides: Guide[] = [...FIXTURE_GUIDES]

export const CATEGORIES = ['DIY', 'Home', 'Kitchen', 'Gadgets', 'Garden']

export function listGuides(): Guide[] {
  return guides
}

export function getGuide(id: string): Guide | undefined {
  return guides.find(g => g.id === id)
}

export function addGuide(g: Guide) {
  guides.unshift(g)
}

// TEST FIXTURE check: T6 replaces this with POST /api/check.
export async function checkStep(req: CheckRequest): Promise<CheckResult> {
  await new Promise(r => setTimeout(r, 1200))
  if (req.mode === 'where') return { mode: 'where', stepIdx: req.stepIdx, reason: 'TEST FIXTURE: no model was called.', fixture: true }
  return {
    mode: 'stuck',
    fixture: true,
    outline: null,
    verdict: { status: 'match', differences: [], message: 'TEST FIXTURE: no model was called, so this is not a real comparison.' },
  }
}
