import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { FIXTURE_GUIDES } from '../fixtures/guides'
import type { Guide } from '../lib/types'
import { GuideView } from './GuideView'

const video = FIXTURE_GUIDES[0]
const voice: Guide = { ...video, id: 'voice-1', kind: 'voice', videoUrl: undefined }
const n = video.steps.length

beforeEach(() => { location.hash = '#/start' })

test('→ goes to the next step and ← to the previous one', async () => {
  const user = userEvent.setup()
  render(<GuideView guide={video} stepIdx={1} />)
  await user.keyboard('{ArrowRight}')
  expect(location.hash).toBe(`#/guide/${video.id}/3`)
  await user.keyboard('{ArrowLeft}')
  expect(location.hash).toBe(`#/guide/${video.id}/1`)
})

test('arrow keys are clamped at the first and last step', async () => {
  const user = userEvent.setup()
  const { unmount } = render(<GuideView guide={video} stepIdx={0} />)
  await user.keyboard('{ArrowLeft}')
  expect(location.hash).toBe('#/start')
  unmount()
  render(<GuideView guide={video} stepIdx={n - 1} />)
  await user.keyboard('{ArrowRight}')
  expect(location.hash).toBe('#/start')
})

test('arrow keys are ignored while typing in a field', async () => {
  const user = userEvent.setup()
  render(<GuideView guide={video} stepIdx={1} />)
  await user.click(screen.getByLabelText('Your question'))
  await user.keyboard('{ArrowRight}{ArrowLeft}')
  expect(location.hash).toBe('#/start')
})

test('Back and Next under the title are disabled at the ends', () => {
  const { unmount } = render(<GuideView guide={video} stepIdx={0} />)
  for (const b of screen.getAllByRole('button', { name: /previous step|^back$/i })) expect((b as HTMLButtonElement).disabled).toBe(true)
  unmount()
  render(<GuideView guide={video} stepIdx={n - 1} />)
  for (const b of screen.getAllByRole('button', { name: /^next step$/i })) expect((b as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getAllByRole('button', { name: /finish/i }).length).toBeGreaterThan(0)
})

test('voice guides have no I’m stuck check and label pictures as AI', () => {
  render(<GuideView guide={voice} stepIdx={0} />)
  expect(screen.queryByRole('button', { name: /^i’m stuck$/i })).toBeNull()
  expect(screen.getAllByText(/illustration by ai/i).length).toBeGreaterThan(0)
})

test('video guides offer I’m stuck', () => {
  render(<GuideView guide={video} stepIdx={0} />)
  expect(screen.getByRole('button', { name: /^i’m stuck$/i })).toBeDefined()
})
