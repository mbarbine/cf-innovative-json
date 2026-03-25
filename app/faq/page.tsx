import { Metadata } from 'next'
import { Breadcrumbs } from '@/components/breadcrumbs'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently Asked Questions about JSON Tree.',
}

export default function FAQPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Breadcrumbs items={[{ label: 'FAQ', href: '/faq' }]} />

      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">What is JSON Tree?</h3>
          <p className="text-muted-foreground">
            JSON Tree is a powerful visualization tool for JSON data. It allows you to view JSON in an interactive tree structure, format, minify, validate, and search through your data easily.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Is my data secure?</h3>
          <p className="text-muted-foreground">
            Yes. All processing is done locally in your browser. We don't send your JSON data to any servers unless you explicitly use a feature that requires it.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Does JSON Tree have an API?</h3>
          <p className="text-muted-foreground">
            Yes! We provide a REST API for formatting, validating, and manipulating JSON data programmatically. Check out our <a href="/docs" className="text-primary hover:underline">API Documentation</a> for more details.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">What is MCP?</h3>
          <p className="text-muted-foreground">
             Model Context Protocol (MCP) is an open standard that enables AI models to securely connect to local and remote data sources. Our MCP server allows AI assistants to format and validate JSON using our tools.
          </p>
        </div>
      </div>
    </div>
  )
}
