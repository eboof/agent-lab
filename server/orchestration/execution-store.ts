// server/orchestration/execution-store.ts
// State management for agent executions with persistent storage

export interface AgentState {
  agentId: string;
  status: "pending" | "running" | "done" | "error" | "awaiting_user";
  startTime?: number;
  endTime?: number;
  input?: any;
  output?: any;
  error?: string;
  toolCalls?: any[];
  awaitingUserData?: {
    outputSchema?: any;
    prompt?: string;
    data?: any;
    userResponse?: any;
  };
}

export interface ExecutionState {
  executionId: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed" | "paused";
  agents: AgentState[];
  logs: LogEntry[];
  metadata?: any;
}

export interface LogEntry {
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  agentId?: string;
  data?: any;
}

class ExecutionStore {
  private executions: Map<string, ExecutionState> = new Map();
  private subscribers: Map<string, Set<(state: ExecutionState) => void>> = new Map();

  createExecution(executionId: string, metadata?: any): ExecutionState {
    const execution: ExecutionState = {
      executionId,
      startTime: Date.now(),
      status: "running",
      agents: [],
      logs: [],
      metadata
    };
    
    this.executions.set(executionId, execution);
    this.subscribers.set(executionId, new Set());
    
    this.addLog(executionId, "info", `Execution ${executionId} started`);
    return execution;
  }

  getExecution(executionId: string): ExecutionState | null {
    return this.executions.get(executionId) || null;
  }

  updateAgentState(executionId: string, agentUpdate: Partial<AgentState> & { agentId: string }): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const existingIndex = execution.agents.findIndex(a => a.agentId === agentUpdate.agentId);
    
    if (existingIndex >= 0) {
      // Update existing agent
      execution.agents[existingIndex] = {
        ...execution.agents[existingIndex],
        ...agentUpdate
      };
    } else {
      // Add new agent
      const newAgent: AgentState = {
        agentId: agentUpdate.agentId,
        status: "pending",
        ...agentUpdate
      };
      execution.agents.push(newAgent);
    }

    // Update execution status based on agent states
    this.updateExecutionStatus(executionId);
    this.notifySubscribers(executionId, execution);
  }

  addLog(executionId: string, level: LogEntry['level'], message: string, agentId?: string, data?: any): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      agentId,
      data
    };

    execution.logs.push(logEntry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (execution.logs.length > 1000) {
      execution.logs = execution.logs.slice(-1000);
    }

    this.notifySubscribers(executionId, execution);
  }

  setAwaitingUser(executionId: string, agentId: string, awaitingData: AgentState['awaitingUserData']): void {
    this.updateAgentState(executionId, {
      agentId,
      status: "awaiting_user",
      awaitingUserData: awaitingData
    });
    
    this.addLog(executionId, "info", `Agent ${agentId} awaiting user input`, agentId);
  }

  resolveUserInput(executionId: string, agentId: string, userInput: any): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const agent = execution.agents.find(a => a.agentId === agentId);
    if (!agent || agent.status !== "awaiting_user") return;

    // Store user input and mark as running
    this.updateAgentState(executionId, {
      agentId,
      status: "running",
      awaitingUserData: {
        ...agent.awaitingUserData,
        userResponse: userInput
      }
    });

    this.addLog(executionId, "info", `User input received for ${agentId}`, agentId, userInput);
    
    // Force update execution status and notify subscribers
    this.updateExecutionStatus(executionId);
    this.notifySubscribers(executionId, execution);
    
    console.log(`🔄 Agent ${agentId} state updated: status=${agent.status}, hasUserResponse=${!!agent.awaitingUserData?.userResponse}`);
  }

  completeExecution(executionId: string, status: "completed" | "failed" = "completed"): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = status;
    execution.endTime = Date.now();
    
    this.addLog(executionId, "info", `Execution ${status} after ${(execution.endTime - execution.startTime) / 1000}s`);
    this.notifySubscribers(executionId, execution);
  }

  private updateExecutionStatus(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status === "completed" || execution.status === "failed") return;

    const agents = execution.agents;
    const hasErrors = agents.some(a => a.status === "error");
    const hasRunning = agents.some(a => a.status === "running");
    const hasAwaiting = agents.some(a => a.status === "awaiting_user");
    const allDone = agents.length > 0 && agents.every(a => a.status === "done");

    if (hasErrors) {
      execution.status = "failed";
    } else if (hasAwaiting) {
      execution.status = "paused";
    } else if (hasRunning) {
      execution.status = "running";
    } else if (allDone) {
      execution.status = "completed";
      execution.endTime = Date.now();
    }
  }

  subscribe(executionId: string, callback: (state: ExecutionState) => void): () => void {
    const subscribers = this.subscribers.get(executionId);
    if (subscribers) {
      subscribers.add(callback);
      
      // Send current state immediately
      const execution = this.executions.get(executionId);
      if (execution) {
        callback(execution);
      }
    }

    return () => {
      const subscribers = this.subscribers.get(executionId);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  private notifySubscribers(executionId: string, execution: ExecutionState): void {
    const subscribers = this.subscribers.get(executionId);
    if (subscribers) {
      subscribers.forEach(callback => callback(execution));
    }
  }

  // Cleanup old executions (call periodically)
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [id, execution] of this.executions.entries()) {
      if (now - execution.startTime > maxAge) {
        this.executions.delete(id);
        this.subscribers.delete(id);
      }
    }
  }

  // Get all executions (for admin/debugging)
  getAllExecutions(): ExecutionState[] {
    return Array.from(this.executions.values());
  }

  // Clear completed/failed executions
  clearInactiveExecutions(): number {
    let cleared = 0;
    for (const [id, execution] of this.executions.entries()) {
      if (execution.status === "completed" || execution.status === "failed") {
        this.executions.delete(id);
        this.subscribers.delete(id);
        cleared++;
      }
    }
    return cleared;
  }
}

// Export singleton instance
export const executionStore = new ExecutionStore();