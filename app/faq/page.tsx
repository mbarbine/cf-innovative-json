import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about JSON Tree + PlatPhorm Schema Registry, public JSON tools, schemas, MCP, auth policy, and local drafts.',
}

const faqs = [
  {
    question: 'What is JSON Tree + PlatPhorm Schema Registry?',
    answer: 'It is the public JSON utility and schema registry layer for json.platphormnews.com. Humans and agents can paste, format, minify, validate, search, explore, and download JSON while browsing public PlatPhorm schema contracts.',
  },
  {
    question: 'Is pasted JSON stored on the server?',
    answer: 'No server persistence is claimed in Phase 1. The editor stores non-sensitive local drafts in browser IndexedDB so reloads can restore your work. Do not paste secrets or store private JSON in browser drafts.',
  },
  {
    question: 'Which schema files are real?',
    answer: 'The public schema files under /schemas/json are bundled files served by the app, including the universal schema pack, core, realm, item, observability, and agent schemas.',
  },
  {
    question: 'Do public JSON tools require an API key?',
    answer: 'No. Public-safe parse, format, minify, validate, stats, schema browsing, and schema validation are open by default in Phase 1. Future protected actions use PLATPHORM_API_KEY when enforcement is enabled.',
  },
  {
    question: 'What does the MCP endpoint expose?',
    answer: 'The MCP endpoint exposes JSON-RPC 2.0 methods for public-safe JSON parsing, formatting, minification, validation, stats, schema lookup, schema pack access, JSON-LD validation, and read-only registry introspection.',
  },
  {
    question: 'How does this integrate with the wider PlatPhormNews mesh?',
    answer: 'JSON remains the JSON utility and schema registry. Trace, Docs, Sheets, Decks, Claws, Evals, BrowserOps, Sandbox, and other services are integrations that are reported as active only when real backing behavior exists, otherwise they show degraded status.',
  },
]

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <Breadcrumbs />

        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Everything you need to know about public JSON tooling, schema registry files, local drafts, MCP, and future protected actions.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question} className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
