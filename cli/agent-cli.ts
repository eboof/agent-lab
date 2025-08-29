#!/usr/bin/env ts-node

// Agent-Lab CLI Tool
// Fast agent generation from command line for power users

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the agent template system from server
import { createAgentTemplate as serverCreateAgentTemplate } from '../server/agent-builder/agent-template.ts';

const createAgentTemplate = (config: any) => {
  // Use the server's full template system for consistency  
  return serverCreateAgentTemplate(config);
};

interface CliAgentConfig {
  name: string;
  description: string;
  version: string;
  prompt: string;
  tools: string[];
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

// Available tools for CLI selection
const AVAILABLE_TOOLS = [
  'yahoo-finance',
  'openai-api', 
  'anthropic-api',
  'cli-tool',
  'email-sender',
  'web-scraper',
  'json-processor',
  'file-system'
];

// CLI Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('🧪 Agent-Lab CLI - Fast Agent Generator');
  console.log('=====================================\n');

  try {
    // Collect basic info
    const name = await ask('Agent name: ');
    const description = await ask('Description: ');
    const version = (await ask('Version (0.1): ')) || '0.1';
    const prompt = await ask('System prompt: ');

    // Tool selection
    console.log('\nAvailable tools:');
    AVAILABLE_TOOLS.forEach((tool, i) => {
      console.log(`  ${i + 1}. ${tool}`);
    });
    
    const toolNumbers = await ask('\nSelect tools (comma-separated numbers, or press enter for none): ');
    const selectedTools = toolNumbers
      .split(',')
      .map(n => parseInt(n.trim()) - 1)
      .filter(i => i >= 0 && i < AVAILABLE_TOOLS.length)
      .map(i => AVAILABLE_TOOLS[i]);

    // Quick schema setup
    const inputFields = await ask('\nInput fields (comma-separated, or press enter for "query:string"): ') || 'query:string';
    const outputFields = await ask('Output fields (comma-separated, or press enter for "result:string"): ') || 'result:string';

    const inputSchema = parseSchemaFields(inputFields);
    const outputSchema = parseSchemaFields(outputFields);

    // Generate agent - convert to server format
    const serverConfig = {
      name,
      description,
      version,
      prompt,
      tools: selectedTools.map(toolId => ({ id: toolId, name: toolId, type: 'tool' })),
      inputSchema,
      outputSchema,
      dependencies: [],
      environmentVars: [],
      timeout: 0,
      retries: 0,
      memory: false
    };

    const agentCode = createAgentTemplate(serverConfig as any);
    
    // Save file
    const filename = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const agentPath = path.join(__dirname, '../agents', `${filename}.agent.ts`);
    
    fs.writeFileSync(agentPath, agentCode, 'utf-8');
    
    console.log(`\n✅ Agent generated successfully!`);
    console.log(`📁 File: ${agentPath}`);
    console.log(`🚀 Tools: ${selectedTools.length > 0 ? selectedTools.join(', ') : 'none'}`);
    console.log(`\nTo test your agent:`);
    console.log(`1. Restart the Agent-Lab server`);
    console.log(`2. Go to http://localhost:5173`);
    console.log(`3. Click Agents → ▶️ Run Agents`);
    console.log(`4. Look for "${filename}" in the agent list\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

function parseSchemaFields(fields: string): Record<string, any> {
  if (!fields.trim()) return {};
  
  return fields.split(',').reduce((schema, field) => {
    const [name, type = 'string'] = field.trim().split(':');
    if (name) {
      schema[name] = {
        type: type.toLowerCase(),
        required: true,
        description: `${name} parameter`
      };
    }
    return schema;
  }, {} as Record<string, any>);
}

// Interactive mode vs command line args
if (process.argv.length > 2) {
  // Command line mode
  const [, , name, description, ...tools] = process.argv;
  
  if (!name || !description) {
    console.log('Usage: agent-cli <name> <description> [tools...]');
    console.log('Example: agent-cli "Weather Bot" "Gets weather info" yahoo-finance openai-api');
    process.exit(1);
  }
  
  const serverConfig = {
    name,
    description,
    version: '0.1',
    prompt: `You are ${name}. ${description}`,
    tools: tools.filter(t => AVAILABLE_TOOLS.includes(t)).map(toolId => ({ id: toolId, name: toolId, type: 'tool' })),
    inputSchema: { query: { type: 'string', required: true, description: 'User query' } },
    outputSchema: { result: { type: 'string', required: true, description: 'Agent response' } },
    dependencies: [],
    environmentVars: [],
    timeout: 0,
    retries: 0,
    memory: false
  };
  
  try {
    const agentCode = createAgentTemplate(serverConfig as any);
    const filename = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const agentPath = path.join(__dirname, '../agents', `${filename}.agent.ts`);
    
    fs.writeFileSync(agentPath, agentCode, 'utf-8');
    console.log(`✅ Generated: ${filename}.agent.ts`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
} else {
  // Interactive mode
  main();
}