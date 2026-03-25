const fs = require('fs');
let content = fs.readFileSync('app/docs/api-docs-client.tsx', 'utf8');

// Add faq to TabsList
if (!content.includes('value="faq"')) {
  content = content.replace(
    '<TabsTrigger value="mcp">MCP Server</TabsTrigger>',
    '<TabsTrigger value="mcp">MCP Server</TabsTrigger>\n          <TabsTrigger value="faq">FAQ</TabsTrigger>'
  );

  // Update introduction text
  content = content.replace(
    '<p className="text-muted-foreground">\n          Complete documentation for the JSON Tree REST API and MCP Server\n        </p>',
    '<p className="text-muted-foreground">\n          Complete documentation for the JSON Tree REST API and MCP Server. Now fully integrated with <a href="https://claws.platphormnews.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">claws.platphormnews.com</a>.\n        </p>'
  );

  // Add FAQ TabContent
  const faqContent = `

          <TabsContent value="faq" className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">What is JSON Tree?</h3>
                  <p className="text-muted-foreground">JSON Tree is a powerful visualization tool built by Platphorm News. It provides an intuitive interface for editing, formatting, validating, and interacting with JSON data.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">How is this related to claws.platphormnews.com?</h3>
                  <p className="text-muted-foreground">JSON Tree integrates deeply with claws.platphormnews.com to leverage advanced schema registries, AI model contexts, and robust network graphing.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">What is MCP?</h3>
                  <p className="text-muted-foreground">The Model Context Protocol (MCP) server allows AI agents (like Claude or Cursor) to securely execute JSON operations, formatting, and validation directly within their context window.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Is there an API available?</h3>
                  <p className="text-muted-foreground">Yes! Our REST API v1 supports parsing, formatting, validation, diffing, and minification. Check the REST API tab for detailed endpoint documentation.</p>
                </div>
              </div>
            </div>
          </TabsContent>`;

  content = content.replace(
    '        </TabsContent>\n      </Tabs>',
    '        </TabsContent>' + faqContent + '\n      </Tabs>'
  );

  fs.writeFileSync('app/docs/api-docs-client.tsx', content);
}
