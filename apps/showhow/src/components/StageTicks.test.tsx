import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StageTicks } from './StageTicks'

test('done stages say passed; only the running stage spins and says it is still working', () => {
  const { container } = render(<StageTicks done={['transcribed', 'topic_rules']} />)
  expect(screen.getByText('Topic rules passed')).toBeDefined()
  expect(screen.getByText('Reviewing it…')).toBeDefined()
  expect(screen.queryByText('Review passed')).toBeNull()
  expect(container.querySelectorAll('.spin').length).toBe(1)
})
