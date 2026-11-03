import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { AskPanel } from './AskPanel'

const askStep = vi.fn()
vi.mock('../lib/data', () => ({ askStep: (...a: unknown[]) => askStep(...a) }))

const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
beforeEach(() => askStep.mockReset())

async function ask(text = 'Do I rinse?') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/your question/i), text)
  await user.click(screen.getByRole('button', { name: 'Ask' }))
}

test('shows the answer labelled with the guide step it came from', async () => {
  askStep.mockResolvedValue({ covered: true, quotes: [{ step: 0, text: 'No, just scrape.', tip: null }] })
  render(<AskPanel guideId={ID} stepIdx={0} />)
  await ask()
  expect(askStep).toHaveBeenCalledWith(ID, 0, 'Do I rinse?')
  expect(await screen.findByText('“No, just scrape.”')).toBeDefined()
  expect(screen.getByText('The creator says · step 1')).toBeDefined()
})

test('Ask is disabled until a question is typed', () => {
  render(<AskPanel guideId={ID} stepIdx={0} />)
  expect((screen.getByRole('button', { name: 'Ask' }) as HTMLButtonElement).disabled).toBe(true)
})

test('an error shows the plain message and a retry that resends', async () => {
  askStep.mockRejectedValueOnce(new Error('We couldn’t get an answer just now. Please try again.'))
  askStep.mockResolvedValueOnce({ covered: false, quotes: [] })
  render(<AskPanel guideId={ID} stepIdx={2} />)
  await ask()
  expect(await screen.findByText(/couldn’t get an answer/)).toBeDefined()
  await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
  expect(await screen.findByText('Not in this guide')).toBeDefined()
  expect(askStep).toHaveBeenCalledTimes(2)
})

test('moving to another step clears the question and answer', async () => {
  askStep.mockResolvedValue({ covered: true, quotes: [{ step: 0, text: 'No, just scrape.', tip: null }] })
  const { rerender } = render(<AskPanel guideId={ID} stepIdx={0} />)
  await ask()
  await screen.findByText('“No, just scrape.”')
  rerender(<AskPanel guideId={ID} stepIdx={1} />)
  expect(screen.queryByText('“No, just scrape.”')).toBeNull()
  expect((screen.getByLabelText(/your question/i) as HTMLInputElement).value).toBe('')
})

test('says where the question goes', () => {
  render(<AskPanel guideId={ID} stepIdx={0} />)
  expect(screen.getByText(/goes to Meta Muse Spark/)).toBeDefined()
})
