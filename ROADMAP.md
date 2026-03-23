# JSON Tree Roadmap

Welcome to the JSON Tree roadmap! This document outlines our plans for future development, categorized by area of focus.

## Phase 1: Foundation & Discovery (Current)
*   [x] Basic tree and graph visualization
*   [x] Core formatting, minification, and validation
*   [x] Simple search and diffing capabilities
*   [x] Basic REST API and MCP server
*   [x] LLM discovery files (\`llms.txt\`, \`llms-full.txt\`, \`llms-index.json\`, \`.well-known\` integration)

## Phase 2: UI/UX & Accessibility Enhancements
*   [ ] **Accessibility First:** Improve keyboard navigation, ARIA labels, and screen reader support across all components.
*   [ ] **Advanced Editor:** Integrate a more robust code editor (e.g., Monaco Editor) with syntax highlighting, auto-completion, and error linting.
*   [ ] **Responsive Design:** Optimize the layout and interactive elements for better usability on mobile and tablet devices.
*   [ ] **Custom Themes:** Allow users to define custom syntax highlighting colors and UI themes.
*   [ ] **Interactive Graph:** Improve graph layout algorithms and add interactivity (e.g., node dragging, filtering).

## Phase 3: AI & MCP Deep Integration (Agent Experience - AX)
*   [ ] **Context-Aware Tools:** Enhance MCP tools to provide more granular data extraction (e.g., JSONPath evaluation tool).
*   [ ] **Generative AI:** Add features to generate JSON schemas, mock data, or type definitions (TypeScript, Go, Rust) directly from the visualization using AI.
*   [ ] **Semantic Search:** Implement embedding-based search to find keys/values based on semantic meaning rather than exact string matches.
*   [ ] **AX Optimization:** Ensure all UI state changes reflect clearly in the DOM for automated browser agents.

## Phase 4: Scalability & Backend Infrastructure
*   [ ] **Large File Support:** Implement virtualized rendering for the tree view to handle massive JSON files (>10MB) without performance degradation.
*   [ ] **Streaming Parsing:** Use streaming JSON parsers (like \`simdjson\` or custom web streams) to process data chunks iteratively.
*   [ ] **Authentication & Accounts:** Provide optional user accounts to save snippets, configurations, and history.
*   [ ] **Edge Deployments:** Optimize API routes and MCP server to run entirely on edge functions for globally low latency.

## Phase 5: Community & Open Source
*   [ ] **Comprehensive Test Suite:** Achieve high test coverage across unit, integration, and E2E tests.
*   [ ] **Developer Documentation:** Expand API documentation and create tutorials/guides.
*   [ ] **Plugin System:** Develop an architecture to allow community plugins for custom visualizations or export formats.
*   [ ] **Open Source Release:** Prepare the repository for public contributions with contributing guidelines, issue templates, and CI/CD pipelines.

*Note: This roadmap is subject to change based on community feedback and evolving priorities.*
