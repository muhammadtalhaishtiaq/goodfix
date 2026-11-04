import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ChatPanel } from './ChatPanel'

const chatStep = vi.fn()
vi.mock('../lib/data', () => ({ chatStep: (...a: unknown[]) => chatStep(...a), listenQuestion: vi.fn() }))

const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
beforeEach(() => chatStep.mockReset())

async function say(text: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/your question/i), text)
  await user.click(screen.getByRole('button', { name: 'Send' }))
}

test('creator answer is labelled with its step; an AI tip is labelled as not from the creator', async () => {
  chatStep.mockResolvedValue({ covered: true, answer: 'Twist it left.', steps: [0], tip: 'Use a towel for grip.' })
  render(<ChatPanel guideId={ID} guideTitle="Refill" stepIdx={0} />)
  await say('which way?')
  expect(await screen.findByText('Twist it left.')).toBeDefined()
  expect(screen.getByText('From the creator · step 1')).toBeDefined()
  expect(screen.getByText('AI suggestion · not from the creator')).toBeDefined()
  expect(chatStep).toHaveBeenCalledWith(ID, 0, [{ role: 'user', text: 'which way?' }], false)
})

test('the conversation continues across steps and sends its history; Copy / Save appear', async () => {
  chatStep.mockResolvedValueOnce({ covered: true, answer: 'Twist it left.', steps: [0], tip: null })
    .mockResolvedValueOnce({ covered: false, answer: '', steps: [], tip: null })
  const { rerender } = render(<ChatPanel guideId={ID} guideTitle="Refill" stepIdx={0} />)
  await say('which way?')
  await screen.findByText('Twist it left.')
  rerender(<ChatPanel guideId={ID} guideTitle="Refill" stepIdx={1} />)
  expect(screen.getByText('Now on step 2')).toBeDefined()
  await say('and then?')
  expect(await screen.findByText('Not in this guide')).toBeDefined()
  expect(chatStep.mock.calls[1]).toEqual([ID, 1, [
    { role: 'user', text: 'which way?' }, { role: 'assistant', text: 'Twist it left.' }, { role: 'user', text: 'and then?' },
  ], false])
  expect(screen.getByRole('button', { name: 'Copy' })).toBeDefined()
  expect(screen.getByRole('button', { name: 'Save' })).toBeDefined()
})

test('an error is honest and Try again resends the same question once', async () => {
  chatStep.mockRejectedValueOnce(new Error('We couldn’t get an answer just now.')).mockResolvedValueOnce({ covered: true, answer: 'Left.', steps: [0], tip: null })
  render(<ChatPanel guideId={ID} guideTitle="Refill" stepIdx={0} />)
  await say('which way?')
  expect(await screen.findByRole('alert')).toBeDefined()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Left.')).toBeDefined()
  expect(screen.getAllByText('which way?')).toHaveLength(1)
})

test('the panel says nothing is saved', () => {
  render(<ChatPanel guideId={ID} guideTitle="Refill" stepIdx={0} />)
  expect(screen.getByText(/Nothing is saved: the chat is gone when you refresh/)).toBeDefined()
})
