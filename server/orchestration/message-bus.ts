// server/orchestration/message-bus.ts
// Enhanced message bus with WebSocket events and execution tracking

import { executionStore, type AgentState, type LogEntry } from './execution-store.ts';
import { WebSocketServer } from 'ws';

export interface AgentMessage {
  sender: string;
  recipient: string;
  payload: any;
  timestamp: string;
  messageId: string;
}

export interface ExecutionEvent {
  executionId: string;
  type: 'agent:start' | 'agent:done' | 'agent:error' | 'agent:awaiting_user' | 'user:decision' | 'log';
  agentId?: string;
  data?: any;
  timestamp: number;
}

export class MessageBus {
  private queue: AgentMessage[] = [];
  private messageCounter = 0;
  private wss: WebSocketServer | null = null;
  private wsClients: Map<string, Set<any>> = new Map(); // executionId -> WebSocket clients

  send(message: Omit<AgentMessage, 'timestamp' | 'messageId'>) {
    const fullMessage: AgentMessage = {
      ...message,
      timestamp: new Date().toISOString(),
      messageId: `msg_${++this.messageCounter}`
    };
    
    console.log(`📨 Message ${fullMessage.messageId} from ${message.sender} → ${message.recipient}`);
    this.queue.push(fullMessage);
    
    return fullMessage.messageId;
  }

  receive(agentId: string): AgentMessage[] {
    const messages = this.queue.filter(msg => msg.recipient === agentId);
    this.queue = this.queue.filter(msg => msg.recipient !== agentId);
    
    if (messages.length > 0) {
      console.log(`📬 ${agentId} received ${messages.length} message(s)`);
    }
    
    return messages;
  }

  peek(agentId: string): AgentMessage[] {
    return this.queue.filter(msg => msg.recipient === agentId);
  }

  clear() {
    this.queue = [];
    this.messageCounter = 0;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueueStatus(): Record<string, number> {
    const status: Record<string, number> = {};
    for (const msg of this.queue) {
      status[msg.recipient] = (status[msg.recipient] || 0) + 1;
    }
    return status;
  }

  // WebSocket Management
  initializeWebSocket(wss: WebSocketServer): void {
    this.wss = wss;
    console.log('📡 MessageBus WebSocket server initialized');
  }

  addWebSocketClient(executionId: string, ws: any): void {
    if (!this.wsClients.has(executionId)) {
      this.wsClients.set(executionId, new Set());
    }
    this.wsClients.get(executionId)!.add(ws);
    
    console.log(`📱 Client connected to execution ${executionId}`);

    // Send current execution state to new client
    const execution = executionStore.getExecution(executionId);
    if (execution) {
      this.sendToWebSocketClients(executionId, {
        type: 'execution:state',
        data: execution
      });
    }

    ws.on('close', () => {
      const clients = this.wsClients.get(executionId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          this.wsClients.delete(executionId);
        }
      }
      console.log(`📱 Client disconnected from execution ${executionId}`);
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'user:decision') {
          this.handleUserDecision(executionId, message);
        }
      } catch (error) {
        console.error('❌ Invalid WebSocket message:', error);
      }
    });
  }

  // Execution Event Emission
  emitEvent(event: ExecutionEvent): void {
    console.log(`🔔 Event: ${event.type} (execution: ${event.executionId}${event.agentId ? `, agent: ${event.agentId}` : ''})`);
    
    // Update execution store
    this.updateExecutionStore(event);

    // Send to WebSocket clients
    this.sendToWebSocketClients(event.executionId, {
      type: 'execution:event',
      data: event
    });

    // For critical state changes, also send the full updated execution state
    if (event.type === 'agent:awaiting_user' || event.type === 'agent:start' || event.type === 'agent:done' || event.type === 'agent:error') {
      const execution = executionStore.getExecution(event.executionId);
      if (execution) {
        this.sendToWebSocketClients(event.executionId, {
          type: 'execution:state',
          data: execution
        });
      }
    }
  }

  // Agent Lifecycle Events
  agentStart(executionId: string, agentId: string, input: any): void {
    this.emitEvent({
      executionId,
      type: 'agent:start',
      agentId,
      data: { input },
      timestamp: Date.now()
    });
  }

  agentDone(executionId: string, agentId: string, output: any): void {
    this.emitEvent({
      executionId,
      type: 'agent:done',
      agentId,
      data: { output },
      timestamp: Date.now()
    });
  }

  agentError(executionId: string, agentId: string, error: string | Error): void {
    this.emitEvent({
      executionId,
      type: 'agent:error',
      agentId,
      data: { error: error.toString() },
      timestamp: Date.now()
    });
  }

  agentAwaitingUser(executionId: string, agentId: string, promptData: any): void {
    this.emitEvent({
      executionId,
      type: 'agent:awaiting_user',
      agentId,
      data: promptData,
      timestamp: Date.now()
    });
  }

  logMessage(executionId: string, level: LogEntry['level'], message: string, agentId?: string): void {
    this.emitEvent({
      executionId,
      type: 'log',
      agentId,
      data: { level, message },
      timestamp: Date.now()
    });
  }

  private updateExecutionStore(event: ExecutionEvent): void {
    switch (event.type) {
      case 'agent:start':
        executionStore.updateAgentState(event.executionId, {
          agentId: event.agentId!,
          status: 'running',
          startTime: event.timestamp,
          input: event.data?.input
        });
        break;

      case 'agent:done':
        executionStore.updateAgentState(event.executionId, {
          agentId: event.agentId!,
          status: 'done',
          endTime: event.timestamp,
          output: event.data?.output
        });
        break;

      case 'agent:error':
        executionStore.updateAgentState(event.executionId, {
          agentId: event.agentId!,
          status: 'error',
          endTime: event.timestamp,
          error: event.data?.error
        });
        break;

      case 'agent:awaiting_user':
        executionStore.setAwaitingUser(event.executionId, event.agentId!, {
          outputSchema: event.data?.outputSchema,
          prompt: event.data?.prompt,
          data: event.data
        });
        break;

      case 'log':
        executionStore.addLog(
          event.executionId, 
          event.data?.level || 'info', 
          event.data?.message || '', 
          event.agentId
        );
        break;
    }
  }

  sendToWebSocketClients(executionId: string, message: any): void {
    const clients = this.wsClients.get(executionId);
    if (!clients || clients.size === 0) {
      console.log(`📤 No WebSocket clients for execution ${executionId}`);
      return;
    }

    const messageStr = JSON.stringify(message);
    console.log(`📤 Sending to ${clients.size} WebSocket client(s) for execution ${executionId}: ${message.type}`);
    clients.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(messageStr);
      } else {
        console.log(`⚠️ WebSocket client not ready (state: ${ws.readyState})`);
      }
    });
  }

  private handleUserDecision(executionId: string, message: any): void {
    if (message.agentId && message.data) {
      executionStore.resolveUserInput(executionId, message.agentId, message.data);
      
      // Emit user decision event
      this.emitEvent({
        executionId,
        type: 'user:decision',
        agentId: message.agentId,
        data: message.data,
        timestamp: Date.now()
      });

      // Send updated execution state after resolving user input
      setTimeout(() => {
        const execution = executionStore.getExecution(executionId);
        if (execution) {
          console.log(`📤 Sending updated execution state after user input for ${executionId}`);
          this.sendToWebSocketClients(executionId, {
            type: 'execution:state',
            data: execution
          });
        }
      }, 100); // Small delay to ensure state is updated
      
      console.log(`✅ User input resolved for agent ${message.agentId}. Agent should continue execution.`);
    }
  }
}

// Export singleton instance
export const messageBus = new MessageBus();

// Example usage:
// messageBus.send({ sender: "inbox-analyzer", recipient: "inbox-executor", payload: {...} });
// const msgs = messageBus.receive("inbox-executor");