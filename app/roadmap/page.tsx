import { Metadata } from 'next'
import { Breadcrumbs } from '@/components/breadcrumbs'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'JSON Tree feature roadmap and future plans.',
}

export default function RoadmapPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Breadcrumbs items={[{ label: 'Roadmap', href: '/roadmap' }]} />

      <h1 className="text-3xl font-bold mb-8">Roadmap</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-emerald-600">Phase 1: Foundation & Discovery (Current)</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Launch JSON Tree MVP</li>
            <li>Implement basic tree and graph visualization</li>
            <li>Basic REST API for formatting and validation</li>
            <li>LLM discovery files (`llms.txt`, `llms-full.txt`, `llms-index.json`, `.well-known` integration)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-emerald-600">Phase 2: UI/UX & Accessibility Enhancements</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Accessibility First:</strong> Improve keyboard navigation, ARIA labels, and screen reader support across all components.</li>
            <li><strong>Advanced Editor:</strong> Integrate a more robust code editor (e.g., Monaco Editor) with syntax highlighting, auto-completion, and error linting.</li>
            <li><strong>Responsive Design:</strong> Optimize the layout and interactive elements for better usability on mobile and tablet devices.</li>
            <li><strong>Custom Themes:</strong> Allow users to define custom syntax highlighting colors and UI themes.</li>
            <li><strong>Interactive Graph:</strong> Improve graph layout algorithms and add interactivity (e.g., node dragging, filtering).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-emerald-600">Phase 3: AI & MCP Deep Integration (Agent Experience - AX)</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Context-Aware Tools:</strong> Enhance MCP tools to provide more granular data extraction (e.g., JSONPath evaluation tool).</li>
            <li><strong>Generative AI:</strong> Add features to generate JSON schemas, mock data, or type definitions (TypeScript, Go, Rust) directly from the visualization using AI.</li>
            <li><strong>Semantic Search:</strong> Implement embedding-based search to find keys/values based on semantic meaning rather than exact string matches.</li>
            <li><strong>AX Optimization:</strong> Ensure all UI state changes reflect clearly in the DOM for automated browser agents.</li>
            <li><strong>Claws Integration:</strong> Native integration with <a href="https://claws.platphormnews.com" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline inline-flex items-center gap-1">claws.platphormnews.com <ExternalLink className="w-3 h-3" /></a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-emerald-600">Phase 4: Scalability & Backend Infrastructure</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Large File Support:</strong> Implement virtualized rendering for the tree view to handle massive JSON files (&gt;10MB) without performance degradation.</li>
            <li><strong>Streaming Parsing:</strong> Use streaming JSON parsers (like `simdjson` or custom web streams) to process data chunks iteratively.</li>
            <li><strong>Authentication & Accounts:</strong> Provide optional user accounts to save snippets, configurations, and history.</li>
            <li><strong>Edge Deployments:</strong> Optimize API routes and MCP server to run entirely on edge functions for globally low latency.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-emerald-600">Phase 5: Community & Open Source</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Comprehensive Test Suite:</strong> Achieve high test coverage across unit, integration, and E2E tests.</li>
            <li><strong>Developer Documentation:</strong> Expand API documentation and create tutorials/guides.</li>
            <li><strong>Plugin System:</strong> Develop an architecture to allow community plugins for custom visualizations or export formats.</li>
            <li><strong>Open Source Release:</strong> Prepare the repository for public contributions with contributing guidelines, issue templates, and CI/CD pipelines.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
