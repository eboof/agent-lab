// server/orchestration/message-types.ts
// Core message interfaces for agent-to-agent communication

export interface Message {
  id: string;
  sender: string;
  recipient: string;
  type: "request" | "response" | "event" | "broadcast";
  content: any;
  timestamp: number;
  correlationId?: string; // Link responses to requests
  executionId?: string;   // Associate with execution context
}

export interface MessageHandler {
  (message: Message): Promise<void> | void;
}

export interface MessageSubscription {
  agentId: string;
  handler: MessageHandler;
}

export interface MessageBusConfig {
  persistMessages?: boolean;
  maxHistory?: number;
}