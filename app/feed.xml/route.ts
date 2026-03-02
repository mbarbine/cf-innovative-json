import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://json-tree.vercel.app'

export async function GET() {
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>JSON Tree</title>
    <link>${BASE_URL}</link>
    <description>A powerful JSON visualization tool with tree view, graph view, formatting, minifying, search, and API.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>JSON Tree v1.0.0</generator>
    <webMaster>support@json-tree.vercel.app (JSON Tree)</webMaster>
    <managingEditor>support@json-tree.vercel.app (JSON Tree)</managingEditor>
    <copyright>Copyright ${new Date().getFullYear()} JSON Tree</copyright>
    <ttl>60</ttl>
    
    <item>
      <title>JSON Tree v1.0.0 Released</title>
      <link>${BASE_URL}</link>
      <guid isPermaLink="true">${BASE_URL}#v1.0.0</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>JSON Tree is a powerful JSON visualization and manipulation tool featuring tree view, graph view, formatting, minifying, search, API endpoints, and MCP server integration for AI agents.</description>
      <content:encoded><![CDATA[
        <h2>Features</h2>
        <ul>
          <li>Interactive Tree View with collapsible nodes</li>
          <li>Graph visualization for complex JSON structures</li>
          <li>JSON formatting and minification</li>
          <li>Real-time validation</li>
          <li>Search functionality</li>
          <li>REST API for programmatic access</li>
          <li>MCP Server for AI agent integration</li>
          <li>Dark/Light theme support</li>
        </ul>
      ]]></content:encoded>
      <category>Release</category>
      <category>JSON</category>
      <category>Developer Tools</category>
    </item>
    
    <item>
      <title>API Documentation Available</title>
      <link>${BASE_URL}/api/docs</link>
      <guid isPermaLink="true">${BASE_URL}/api/docs</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>Complete OpenAPI documentation for the JSON Tree REST API. Includes endpoints for parsing, formatting, minifying, validating, and comparing JSON.</description>
      <category>Documentation</category>
      <category>API</category>
    </item>
    
    <item>
      <title>MCP Server Integration</title>
      <link>${BASE_URL}/api/mcp</link>
      <guid isPermaLink="true">${BASE_URL}/api/mcp</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>JSON Tree now supports the Model Context Protocol (MCP) for seamless integration with AI agents and LLMs. Enable your AI assistants to parse, format, and analyze JSON data.</description>
      <category>MCP</category>
      <category>AI Integration</category>
    </item>
  </channel>
</rss>`

  return new NextResponse(feed, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
