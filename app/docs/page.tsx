import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ApiDocsClient } from './api-docs-client'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Complete API documentation for JSON Tree REST API and MCP Server',
}

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 pt-8 w-full">
        <Breadcrumbs />
        <div className="-mx-4 -mt-8">
          <ApiDocsClient />
        </div>
      </main>
      <Footer />
    </div>
  )
}
