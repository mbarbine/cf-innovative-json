import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FaqPage from '../app/faq/page'
import { vi } from 'vitest'

const mockUsePathname = vi.fn(() => '/faq')
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname()
}))

describe('FAQ Page', () => {
  it('renders FAQ heading and questions', () => {
    render(<FaqPage />)
    expect(screen.getAllByText('Frequently Asked Questions').length).toBeGreaterThan(0)
    expect(screen.getByText('What is JSON Tree + PlatPhorm Schema Registry?')).toBeDefined()
    expect(screen.getByText('Do public JSON tools require an API key?')).toBeDefined()
  })
})
