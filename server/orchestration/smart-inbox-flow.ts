// server/orchestration/smart-inbox-flow.ts
// Multi-agent orchestrator for Smart Inbox workflow

import { agentRunner } from './agent-runner.ts';
import { messageBus } from './message-bus.ts';

export interface SmartInboxFlowResult {
  success: boolean;
  phase: 'analysis' | 'execution' | 'completed';
  data?: any;
  error?: string;
  metadata?: {
    timestamp: string;
    executionTime: number;
    agentsUsed: string[];
  };
}

export class SmartInboxFlow {
  private startTime: number = 0;
  private agentsUsed: string[] = [];

  async run(count: number, decisions?: Record<string, string>): Promise<SmartInboxFlowResult> {
    this.startTime = Date.now();
    this.agentsUsed = [];
    
    console.log(`🔄 Starting Smart Inbox Flow - Phase: ${decisions ? 'execution' : 'analysis'}`);
    
    try {
      // Clear previous messages
      messageBus.clear();

      // Step 1: Always run the analyzer to get current email state
      console.log(`📥 Running inbox-analyzer for ${count} emails`);
      this.agentsUsed.push('inbox-analyzer');
      
      const analyzerResult = await agentRunner.run('inbox-analyzer', { count });
      
      if (!analyzerResult.success) {
        return this.createErrorResult('analysis', `Analyzer failed: ${analyzerResult.error}`);
      }

      // Parse analyzer output
      let emails;
      try {
        // The analyzer should output pure JSON array
        emails = typeof analyzerResult.output === 'string' 
          ? JSON.parse(analyzerResult.output) 
          : analyzerResult.output;
          
        if (!Array.isArray(emails)) {
          throw new Error('Analyzer output is not an array');
        }
      } catch (parseError) {
        console.error('Failed to parse analyzer output:', analyzerResult.output);
        return this.createErrorResult('analysis', `Failed to parse analyzer output: ${parseError}`);
      }

      // Send analyzer result to message bus
      messageBus.send({
        sender: 'smart-inbox-orchestrator',
        recipient: 'decision-presenter',
        payload: { emails, phase: 'analysis' }
      });

      console.log(`✅ Analyzer found ${emails.length} emails`);

      // Step 2: If no decisions provided, return analysis results
      if (!decisions || Object.keys(decisions).length === 0) {
        return {
          success: true,
          phase: 'analysis',
          data: { emails },
          metadata: this.createMetadata()
        };
      }

      // Step 3: Execute user decisions
      console.log(`⚙️ Running inbox-executor with ${Object.keys(decisions).length} decisions`);
      this.agentsUsed.push('inbox-executor');

      const executorResult = await agentRunner.run('inbox-executor', { emails, decisions });
      
      if (!executorResult.success) {
        return this.createErrorResult('execution', `Executor failed: ${executorResult.error}`);
      }

      // Parse executor output
      let actionResults;
      try {
        actionResults = typeof executorResult.output === 'string' 
          ? JSON.parse(executorResult.output) 
          : executorResult.output;
          
        if (!Array.isArray(actionResults)) {
          throw new Error('Executor output is not an array');
        }
      } catch (parseError) {
        console.error('Failed to parse executor output:', executorResult.output);
        return this.createErrorResult('execution', `Failed to parse executor output: ${parseError}`);
      }

      console.log(`✅ Executor completed ${actionResults.length} actions`);

      // Send final results to message bus
      messageBus.send({
        sender: 'smart-inbox-orchestrator',
        recipient: 'decision-presenter',
        payload: { emails, actionResults, phase: 'completed' }
      });

      return {
        success: true,
        phase: 'completed',
        data: { emails, actionResults },
        metadata: this.createMetadata()
      };

    } catch (error: any) {
      console.error(`❌ Smart Inbox Flow error:`, error);
      return this.createErrorResult('analysis', error.message);
    }
  }

  private createErrorResult(phase: 'analysis' | 'execution', error: string): SmartInboxFlowResult {
    return {
      success: false,
      phase,
      error,
      metadata: this.createMetadata()
    };
  }

  private createMetadata() {
    return {
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - this.startTime,
      agentsUsed: [...this.agentsUsed]
    };
  }

  // Get messages for a specific recipient
  getMessages(recipient: string) {
    return messageBus.receive(recipient);
  }

  // Get message bus status
  getMessageBusStatus() {
    return {
      queueSize: messageBus.getQueueSize(),
      queueStatus: messageBus.getQueueStatus()
    };
  }
}

// Export singleton instance
export const smartInboxFlow = new SmartInboxFlow();

// Convenience function for backward compatibility
export async function runSmartInboxFlow(count: number, decisions?: Record<string, string>): Promise<SmartInboxFlowResult> {
  return smartInboxFlow.run(count, decisions);
}