'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

export function Breadcrumbs() {
  const pathname = usePathname()

  // Exclude root path
  if (pathname === '/') return null

  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbItems = [
    { name: 'Home', item: 'https://json.platphormnews.com/' },
    ...pathSegments.map((segment, index) => ({
      name: segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      item: `https://json.platphormnews.com/${pathSegments.slice(0, index + 1).join('/')}`,
    })),
  ]

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors flex items-center">
              <Home className="w-4 h-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {pathSegments.map((segment, index) => {
            const href = `/${pathSegments.slice(0, index + 1).join('/')}`
            const isLast = index === pathSegments.length - 1

            const label = segment
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')

            return (
              <li key={href} className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                {isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">
                    {label}
                  </span>
                ) : (
                  <Link href={href} className="hover:text-foreground transition-colors">
                    {label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              item: item.item,
            })),
          }),
        }}
      />
    </>
  )
}
