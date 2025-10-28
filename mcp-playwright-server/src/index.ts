#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, firefox, webkit, Browser, Page } from 'playwright';

class PlaywrightMCPServer {
  private server: Server;
  private browsers: Map<string, Browser> = new Map();
  private pages: Map<string, Page> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'playwright-mcp-server',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'launch_browser',
          description: 'Launch a browser (chromium, firefox, or webkit)',
          inputSchema: {
            type: 'object',
            properties: {
              browser: {
                type: 'string',
                enum: ['chromium', 'firefox', 'webkit'],
                description: 'Browser type to launch',
              },
              headless: {
                type: 'boolean',
                description: 'Run browser in headless mode',
                default: true,
              },
              browser_id: {
                type: 'string',
                description: 'Unique identifier for this browser instance',
                default: 'default',
              },
            },
            required: ['browser'],
          },
        },
        {
          name: 'new_page',
          description: 'Create a new page in a browser',
          inputSchema: {
            type: 'object',
            properties: {
              browser_id: {
                type: 'string',
                description: 'Browser instance ID',
                default: 'default',
              },
              page_id: {
                type: 'string',
                description: 'Unique identifier for this page',
                default: 'default',
              },
            },
          },
        },
        {
          name: 'navigate',
          description: 'Navigate to a URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to navigate to',
              },
              page_id: {
                type: 'string',
                description: 'Page ID to navigate',
                default: 'default',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'click',
          description: 'Click an element on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector or text to click',
              },
              page_id: {
                type: 'string',
                description: 'Page ID to perform action on',
                default: 'default',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'type',
          description: 'Type text into an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of input element',
              },
              text: {
                type: 'string',
                description: 'Text to type',
              },
              page_id: {
                type: 'string',
                description: 'Page ID to perform action on',
                default: 'default',
              },
            },
            required: ['selector', 'text'],
          },
        },
        {
          name: 'get_text',
          description: 'Get text content from an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of element',
              },
              page_id: {
                type: 'string',
                description: 'Page ID to get text from',
                default: 'default',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'screenshot',
          description: 'Take a screenshot of the page',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path to save screenshot',
              },
              page_id: {
                type: 'string',
                description: 'Page ID to screenshot',
                default: 'default',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'wait_for_selector',
          description: 'Wait for an element to appear',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector to wait for',
              },
              timeout: {
                type: 'number',
                description: 'Timeout in milliseconds',
                default: 30000,
              },
              page_id: {
                type: 'string',
                description: 'Page ID to wait on',
                default: 'default',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'close_browser',
          description: 'Close a browser instance',
          inputSchema: {
            type: 'object',
            properties: {
              browser_id: {
                type: 'string',
                description: 'Browser instance ID to close',
                default: 'default',
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'launch_browser':
            return await this.launchBrowser(args);
          case 'new_page':
            return await this.newPage(args);
          case 'navigate':
            return await this.navigate(args);
          case 'click':
            return await this.click(args);
          case 'type':
            return await this.type(args);
          case 'get_text':
            return await this.getText(args);
          case 'screenshot':
            return await this.screenshot(args);
          case 'wait_for_selector':
            return await this.waitForSelector(args);
          case 'close_browser':
            return await this.closeBrowser(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async launchBrowser(args: any) {
    const { browser: browserType = 'chromium', headless = true, browser_id = 'default' } = args;
    
    let browser: Browser;
    switch (browserType) {
      case 'chromium':
        browser = await chromium.launch({ headless });
        break;
      case 'firefox':
        browser = await firefox.launch({ headless });
        break;
      case 'webkit':
        browser = await webkit.launch({ headless });
        break;
      default:
        throw new Error(`Unsupported browser: ${browserType}`);
    }

    this.browsers.set(browser_id, browser);
    
    return {
      content: [
        {
          type: 'text',
          text: `${browserType} browser launched successfully with ID: ${browser_id}`,
        },
      ],
    };
  }

  private async newPage(args: any) {
    const { browser_id = 'default', page_id = 'default' } = args;
    
    const browser = this.browsers.get(browser_id);
    if (!browser) {
      throw new Error(`Browser with ID ${browser_id} not found`);
    }

    const page = await browser.newPage();
    this.pages.set(page_id, page);

    return {
      content: [
        {
          type: 'text',
          text: `New page created with ID: ${page_id}`,
        },
      ],
    };
  }

  private async navigate(args: any) {
    const { url, page_id = 'default' } = args;
    
    const page = this.pages.get(page_id);
    if (!page) {
      throw new Error(`Page with ID ${page_id} not found`);
    }

    await page.goto(url);

    return {
      content: [
        {
          type: 'text',
          text: `Navigated to ${url}`,
        },
      ],
    };
  }

  private async click(args: any) {
    const { selector, page_id = 'default' } = args;
    
    const page = this.pages.get(page_id);
    if (!page) {
      throw new Error(`Page with ID ${page_id} not found`);
    }

    await page.click(selector);

    return {
      content: [
        {
          type: 'text',
          text: `Clicked element: ${selector}`,
        },
      ],
    };
  }

  private async type(args: any) {
    const { selector, text, page_id = 'default' } = args;
    
    const page = this.pages.get(page_id);
    if (!page) {
      throw new Error(`Page with ID ${page_id} not found`);
    }

    await page.fill(selector, text);

    return {
      content: [
        {
          type: 'text',
          text: `Typed "${text}" into ${selector}`,
        },
      ],
    };
  }

  private async getText(args: any) {
    const { selector, page_id = 'default' } = args;
    
    const page = this.pages.get(page_id);
    if (!page) {
      throw new Error(`Page with ID ${page_id} not found`);
    }

    const text = await page.textContent(selector);

    return {
      content: [
        {
          type: 'text',
          text: `Text content: ${text || 'No text found'}`,
        },
      ],
    };
  }

  private async screenshot(args: any) {
    const { path, page_id = 'default' } = args;
    
    const page = this.pages.get(page_id);
    if (!page) {
      throw new Error(`Page with ID ${page_id} not found`);
    }

    await page.screenshot({ path });

    return {
      content: [
        {
          type: 'text',
          text: `Screenshot saved to ${path}`,
        },
      ],
    };
  }

  private async waitForSelector(args: any) {
    const { selector, timeout = 30000, page_id = 'default' } = args;
    
    const page = this.pages.get(page_id);
    if (!page) {
      throw new Error(`Page with ID ${page_id} not found`);
    }

    await page.waitForSelector(selector, { timeout });

    return {
      content: [
        {
          type: 'text',
          text: `Element ${selector} appeared`,
        },
      ],
    };
  }

  private async closeBrowser(args: any) {
    const { browser_id = 'default' } = args;
    
    const browser = this.browsers.get(browser_id);
    if (!browser) {
      throw new Error(`Browser with ID ${browser_id} not found`);
    }

    // Close all pages associated with this browser
    for (const [pageId, page] of this.pages.entries()) {
      if (page.context().browser() === browser) {
        await page.close();
        this.pages.delete(pageId);
      }
    }

    await browser.close();
    this.browsers.delete(browser_id);

    return {
      content: [
        {
          type: 'text',
          text: `Browser ${browser_id} closed`,
        },
      ],
    };
  }

  private async cleanup(): Promise<void> {
    for (const browser of this.browsers.values()) {
      await browser.close();
    }
    this.browsers.clear();
    this.pages.clear();
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright MCP server running on stdio');
  }
}

const server = new PlaywrightMCPServer();
server.run().catch(console.error);