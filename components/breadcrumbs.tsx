import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs({
  items
}: {
  items: { label: string; href: string }[]
}) {
  return (
    <>
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4" />
            {index === items.length - 1 ? (
              <span className="text-foreground font-medium" aria-current="page">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [{ label: 'Home', href: '/' }, ...items].map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.label,
              item: `https://json.platphormnews.com${item.href === '/' ? '' : item.href}`,
            })),
          }),
        }}
      />
    </>
  )
}
