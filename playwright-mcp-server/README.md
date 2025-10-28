# Playwright MCP Server

A Model Context Protocol (MCP) server that provides Playwright browser automation tools.

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Running the Server

```bash
npm start
```

## Available Tools

- `launch_browser` - Launch a browser (chromium, firefox, webkit)
- `new_page` - Create a new page in browser
- `navigate` - Navigate to a URL
- `click` - Click an element
- `type` - Type text into an element
- `get_text` - Get text content from an element
- `screenshot` - Take a screenshot
- `wait_for_selector` - Wait for an element to appear
- `close_browser` - Close browser instance

## Usage with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["/path/to/playwright-mcp-server/dist/index.js"]
    }
  }
}
```