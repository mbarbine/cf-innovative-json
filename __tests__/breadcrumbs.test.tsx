import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '../components/ui/breadcrumbs'

const mockUsePathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname()
}))

describe('Breadcrumbs Component', () => {
  it('returns null on root path', () => {
    mockUsePathname.mockReturnValue('/')
    const { container } = render(<Breadcrumbs />)
    expect(container.firstChild).toBeNull()
  })

  it('renders breadcrumbs for nested paths', () => {
    mockUsePathname.mockReturnValue('/docs/api-reference')
    render(<Breadcrumbs />)
    expect(screen.getByText('Docs')).toBeDefined()
    expect(screen.getByText('Api Reference')).toBeDefined()
  })
})
