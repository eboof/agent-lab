#!/usr/bin/env ts-node

import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

config();

interface ResearchConfig {
  model: string;
  maxTokens: number;
  outputPath: string;
  previewLength: number;
}

interface CLIArgs {
  query?: string;
  output?: string;
  model?: string;
  help?: boolean;
}

class ResearchAgent {
  private anthropic: Anthropic;
  private config: ResearchConfig;

  constructor(config: Partial<ResearchConfig> = {}) {
    this.validateEnvironment();
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4000,
      outputPath: 'research-output.txt',
      previewLength: 200,
      ...config
    };
  }

  private validateEnvironment(): void {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }
  }

  private parseArgs(): CLIArgs {
    const args: CLIArgs = {};
    
    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i];
      
      if (arg === '--help' || arg === '-h') {
        args.help = true;
      } else if (arg === '--output' || arg === '-o') {
        args.output = process.argv[++i];
      } else if (arg === '--model' || arg === '-m') {
        args.model = process.argv[++i];
      } else if (!args.query) {
        args.query = arg;
      }
    }
    
    return args;
  }

  private showHelp(): void {
    console.log(`
Research Agent - AI-powered research using Anthropic Claude

Usage:
  research-agent.ts <query> [options]

Arguments:
  query                 The research query to investigate

Options:
  -o, --output <path>   Output file path (default: research-output.txt)
  -m, --model <model>   Claude model to use (default: claude-3-5-sonnet-20241022)
  -h, --help           Show this help message

Examples:
  research-agent.ts "What are the benefits of microservices?"
  research-agent.ts "Explain quantum computing" --output quantum-research.txt
  research-agent.ts "AI trends 2024" --model claude-3-haiku-20240307

Environment:
  ANTHROPIC_API_KEY    Required: Your Anthropic API key
`);
  }

  private async conductResearch(query: string): Promise<string> {
    console.log(`🔍 Researching: ${query}`);
    console.log(`📊 Using model: ${this.config.model}`);
    
    try {
      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [{
          role: 'user',
          content: query
        }]
      });

      const result = response.content[0];
      
      if (result.type !== 'text') {
        throw new Error('Received non-text response from API');
      }
      
      return result.text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw new Error('Unknown API error occurred');
    }
  }

  private saveResult(content: string, outputPath: string): void {
    const fullPath = join(process.cwd(), outputPath);
    const dir = dirname(fullPath);
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Research saved to: ${fullPath}`);
  }

  private showPreview(content: string): void {
    console.log('\n--- Result Preview ---');
    const preview = content.length > this.config.previewLength 
      ? content.substring(0, this.config.previewLength) + '...'
      : content;
    console.log(preview);
    console.log(`\n📝 Total length: ${content.length} characters`);
  }

  async run(): Promise<void> {
    try {
      const args = this.parseArgs();
      
      if (args.help) {
        this.showHelp();
        return;
      }

      if (!args.query) {
        console.error('❌ Error: Query is required');
        this.showHelp();
        process.exit(1);
      }

      if (args.model) {
        this.config.model = args.model;
      }

      if (args.output) {
        this.config.outputPath = args.output;
      }

      const result = await this.conductResearch(args.query);
      this.saveResult(result, this.config.outputPath);
      this.showPreview(result);
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }
}

async function main(): Promise<void> {
  const agent = new ResearchAgent();
  await agent.run();
}

if (require.main === module) {
  main().catch(console.error);
}% 
