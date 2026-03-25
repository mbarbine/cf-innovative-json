import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions',
  description: 'Frequently asked questions about JSON Tree, Platphorm News integrations, APIs, and the MCP server.',
}

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <Breadcrumbs />

        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Everything you need to know about JSON Tree, our API, and Platform integrations.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">What is JSON Tree?</h3>
            <p className="text-muted-foreground">JSON Tree is a powerful visualization tool built by Platphorm News. It provides an intuitive interface for editing, formatting, validating, and interacting with JSON data in both tree and graph layouts.</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">How is this related to claws.platphormnews.com?</h3>
            <p className="text-muted-foreground">JSON Tree integrates deeply with claws.platphormnews.com to leverage advanced schema registries, AI model contexts, and robust network graphing. This allows developers to construct verified architectures seamlessly.</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">What is MCP?</h3>
            <p className="text-muted-foreground">The Model Context Protocol (MCP) server allows AI agents (like Claude or Cursor) to securely execute JSON operations, formatting, and validation directly within their context window, enabling seamless workflow automation.</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Is there a public API available?</h3>
            <p className="text-muted-foreground">Yes! Our REST API v1 supports parsing, formatting, validation, diffing, and minification. Check the API Docs for detailed endpoint documentation and usage limits.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
