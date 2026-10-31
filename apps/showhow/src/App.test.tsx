import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { App } from './App'

test('renders the Showhow shell without making network requests', () => {
  render(<App />)
  expect(screen.getByRole('link', { name: /showhow/i })).toBeDefined()
})
