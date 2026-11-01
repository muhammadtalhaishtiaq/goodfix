import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, expect, test, vi } from 'vitest'
import { FIXTURE_GUIDES } from '../fixtures/guides'
import type { CheckResult } from '../lib/types'
import { StuckDialog } from './StuckDialog'

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo')
  URL.revokeObjectURL = vi.fn()
})

const result: CheckResult = { mode: 'stuck', fixture: true, outline: null, verdict: { status: 'unclear', differences: [], message: 'Too dark' } }
const photo = (name: string) => new File(['x'], name, { type: 'image/jpeg' })

function setup(check = vi.fn(async (): Promise<CheckResult> => result)) {
  sessionStorage.clear()
  render(<StuckDialog guide={FIXTURE_GUIDES[0]} stepIdx={2} mode="stuck" check={check} onClose={() => {}} onGoToStep={() => {}} />)
  return { check, user: userEvent.setup() }
}
const confirmAdult = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByLabelText(/18 or older/i))

test('choosing a photo shows a preview but sends nothing until Send', async () => {
  const { check, user } = setup()
  await user.upload(screen.getByLabelText(/take or upload a photo/i), photo('a.jpg'))
  expect(screen.getByText(/nothing has been sent yet/i)).toBeDefined()
  expect(check).not.toHaveBeenCalled()
  await confirmAdult(user)
  await user.click(screen.getByRole('button', { name: /send for check/i }))
  expect(check).toHaveBeenCalledTimes(1)
})

test('Send stays disabled until the learner confirms they are 18+', async () => {
  const { check, user } = setup()
  await user.upload(screen.getByLabelText(/take or upload a photo/i), photo('a.jpg'))
  expect((screen.getByRole('button', { name: /send for check/i }) as HTMLButtonElement).disabled).toBe(true)
  await confirmAdult(user)
  expect((screen.getByRole('button', { name: /send for check/i }) as HTMLButtonElement).disabled).toBe(false)
  expect(check).not.toHaveBeenCalled()
})

test('a server error shows its plain message and nothing is guessed', async () => {
  const { user } = setup(vi.fn(async (): Promise<CheckResult> => { throw new Error('Today’s demo limit is reached. Viewing guides still works.') }))
  await user.upload(screen.getByLabelText(/take or upload a photo/i), photo('a.jpg'))
  await confirmAdult(user)
  await user.click(screen.getByRole('button', { name: /send for check/i }))
  expect(await screen.findByText(/demo limit is reached/i)).toBeDefined()
  expect(document.querySelector('.v-card')).toBeNull()
})

test('changing the photo requires a fresh approval', async () => {
  const { check, user } = setup()
  await user.upload(screen.getByLabelText(/take or upload a photo/i), photo('a.jpg'))
  await user.click(screen.getByRole('button', { name: /change photo/i }))
  await user.upload(screen.getByLabelText(/take or upload a photo/i), photo('b.jpg'))
  expect(check).not.toHaveBeenCalled()
  expect(screen.getByText(/b\.jpg/)).toBeDefined()
})

test('an unclear verdict asks for a better photo and draws no outline', async () => {
  const { user } = setup()
  await user.upload(screen.getByLabelText(/take or upload a photo/i), photo('a.jpg'))
  await confirmAdult(user)
  await user.click(screen.getByRole('button', { name: /send for check/i }))
  expect(await screen.findByText(/closer, well-lit photo/i)).toBeDefined()
  expect(document.querySelector('.sam')).toBeNull()
})
