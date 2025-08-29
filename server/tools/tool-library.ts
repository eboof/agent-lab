// Tool Library - Available integrations for Agent Builder
// Defines all pre-built tools that agents can use

export interface ToolDefinition {
  id: string;
  name: string;
  category: 'api' | 'ai' | 'data' | 'communication' | 'web' | 'system';
  description: string;
  icon: string;
  configSchema: Record<string, ToolConfigField>;
  dependencies?: string[];
  environmentVars?: string[];
  exampleUsage?: string;
}

export interface ToolConfigField {
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
  placeholder?: string;
}

export const TOOL_LIBRARY: ToolDefinition[] = [
  // === API Tools ===
  {
    id: 'yahoo-finance',
    name: 'Yahoo Finance API',
    category: 'api',
    description: 'Get real-time stock prices, market data, and financial information',
    icon: '📈',
    dependencies: ['yahoo-finance2'],
    configSchema: {
      symbols: {
        type: 'string',
        label: 'Default Symbols',
        description: 'Comma-separated list of stock symbols (e.g., TSLA,NVDA)',
        required: false,
        placeholder: 'TSLA,NVDA,AAPL'
      },
      region: {
        type: 'select',
        label: 'Market Region',
        description: 'Stock market region',
        required: false,
        defaultValue: 'US',
        options: ['US', 'AU', 'UK', 'CA']
      }
    },
    exampleUsage: 'const price = await tools.yahooFinance.getQuote("TSLA");'
  },

  {
    id: 'openai-api',
    name: 'OpenAI API',
    category: 'ai',
    description: 'Access GPT models for text generation, analysis, and completion',
    icon: '🤖',
    dependencies: ['openai'],
    environmentVars: ['OPENAI_API_KEY'],
    configSchema: {
      model: {
        type: 'select',
        label: 'Default Model',
        description: 'OpenAI model to use by default',
        required: true,
        defaultValue: 'gpt-4o-mini',
        options: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        description: 'Maximum tokens in response',
        required: false,
        defaultValue: 1000
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        description: 'Creativity level (0.0-1.0)',
        required: false,
        defaultValue: 0.7
      }
    },
    exampleUsage: 'const response = await tools.openai.chat("Explain quantum computing");'
  },

  {
    id: 'anthropic-api',
    name: 'Anthropic Claude API',
    category: 'ai',
    description: 'Access Claude models for conversation, analysis, and reasoning',
    icon: '🧠',
    dependencies: ['@anthropic-ai/sdk'],
    environmentVars: ['ANTHROPIC_API_KEY'],
    configSchema: {
      model: {
        type: 'select',
        label: 'Default Model',
        description: 'Claude model to use by default',
        required: true,
        defaultValue: 'claude-sonnet-4-20250514',
        options: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        description: 'Maximum tokens in response',
        required: false,
        defaultValue: 1000
      }
    },
    exampleUsage: 'const response = await tools.claude.message("Analyze this data...");'
  },

  // === Communication Tools ===
  {
    id: 'email-sender',
    name: 'Email Sender',
    category: 'communication',
    description: 'Send emails via SMTP with attachments and HTML formatting',
    icon: '📧',
    dependencies: ['nodemailer'],
    environmentVars: ['EMAIL_USER', 'EMAIL_PASS'],
    configSchema: {
      smtpHost: {
        type: 'string',
        label: 'SMTP Host',
        description: 'SMTP server hostname',
        required: true,
        defaultValue: 'smtp.gmail.com',
        placeholder: 'smtp.gmail.com'
      },
      smtpPort: {
        type: 'number',
        label: 'SMTP Port',
        description: 'SMTP server port',
        required: true,
        defaultValue: 587
      },
      fromName: {
        type: 'string',
        label: 'From Name',
        description: 'Display name for outgoing emails',
        required: false,
        placeholder: 'Agent Lab Bot'
      }
    },
    exampleUsage: 'await tools.email.send("user@example.com", "Subject", "Hello!");'
  },

  // === Web Tools ===
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    category: 'web',
    description: 'Extract data from websites, handle dynamic content, and parse HTML',
    icon: '🌐',
    dependencies: ['puppeteer', 'cheerio'],
    configSchema: {
      userAgent: {
        type: 'string',
        label: 'User Agent',
        description: 'Browser user agent string',
        required: false,
        defaultValue: 'Mozilla/5.0 (compatible; AgentLab/1.0)'
      },
      timeout: {
        type: 'number',
        label: 'Timeout (ms)',
        description: 'Request timeout in milliseconds',
        required: false,
        defaultValue: 30000
      },
      javascript: {
        type: 'boolean',
        label: 'Enable JavaScript',
        description: 'Render JavaScript content',
        required: false,
        defaultValue: true
      }
    },
    exampleUsage: 'const data = await tools.webScraper.scrape("https://example.com");'
  },

  // === Data Tools ===
  {
    id: 'json-processor',
    name: 'JSON Processor',
    category: 'data',
    description: 'Parse, transform, validate, and manipulate JSON data structures',
    icon: '🔧',
    dependencies: [],
    configSchema: {
      prettyPrint: {
        type: 'boolean',
        label: 'Pretty Print',
        description: 'Format JSON output with indentation',
        required: false,
        defaultValue: true
      },
      validateSchema: {
        type: 'boolean',
        label: 'Schema Validation',
        description: 'Validate JSON against schemas',
        required: false,
        defaultValue: false
      }
    },
    exampleUsage: 'const cleaned = await tools.json.transform(data, schema);'
  },

  {
    id: 'csv-processor',
    name: 'CSV Processor',
    category: 'data',
    description: 'Read, write, and transform CSV files with custom delimiters',
    icon: '📊',
    dependencies: ['csv-parser', 'csv-writer'],
    configSchema: {
      delimiter: {
        type: 'select',
        label: 'Default Delimiter',
        description: 'CSV field separator',
        required: false,
        defaultValue: ',',
        options: [',', ';', '\\t', '|']
      },
      hasHeaders: {
        type: 'boolean',
        label: 'Has Headers',
        description: 'First row contains column names',
        required: false,
        defaultValue: true
      }
    },
    exampleUsage: 'const data = await tools.csv.read("data.csv");'
  },

  // === System Tools ===
  {
    id: 'file-system',
    name: 'File System',
    category: 'system',
    description: 'Read, write, and manipulate files and directories safely',
    icon: '📁',
    dependencies: [],
    configSchema: {
      basePath: {
        type: 'string',
        label: 'Base Path',
        description: 'Root directory for file operations (security)',
        required: false,
        defaultValue: './data',
        placeholder: './data'
      },
      maxFileSize: {
        type: 'number',
        label: 'Max File Size (MB)',
        description: 'Maximum file size to process',
        required: false,
        defaultValue: 10
      }
    },
    exampleUsage: 'const content = await tools.fs.readFile("report.txt");'
  },

  {
    id: 'scheduler',
    name: 'Task Scheduler',
    category: 'system',
    description: 'Schedule recurring tasks and manage cron jobs',
    icon: '⏰',
    dependencies: ['node-cron'],
    configSchema: {
      timezone: {
        type: 'string',
        label: 'Timezone',
        description: 'Default timezone for scheduled tasks',
        required: false,
        defaultValue: 'UTC',
        placeholder: 'America/New_York'
      },
      maxConcurrent: {
        type: 'number',
        label: 'Max Concurrent Tasks',
        description: 'Maximum number of concurrent scheduled tasks',
        required: false,
        defaultValue: 5
      }
    },
    exampleUsage: 'tools.scheduler.every("0 9 * * *", () => runDailyReport());'
  }
];

// Helper functions for tool management
export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return TOOL_LIBRARY.filter(tool => tool.category === category);
}

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_LIBRARY.find(tool => tool.id === id);
}

export function getAllCategories(): ToolDefinition['category'][] {
  return Array.from(new Set(TOOL_LIBRARY.map(tool => tool.category)));
}

export const CATEGORY_LABELS: Record<ToolDefinition['category'], string> = {
  'api': '🌐 API Integrations',
  'ai': '🤖 AI Models',
  'data': '📊 Data Processing',
  'communication': '📧 Communication',
  'web': '🌍 Web Tools',
  'system': '⚙️ System Tools'
};