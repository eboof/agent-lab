# 🏛️ Architecture Decision Record
## ADR-001: Multi-Agent Orchestration Architecture

**Date**: 2025-09-01  
**Status**: Approved  
**Contributors**: Claude Code, Rob (Agent-Lab maintainer)

---

## 📝 Decision

**Adopt a Swarm-like multi-agent orchestration model** for Agent-Lab vNext, transitioning from individual tool execution to collaborative agent workflows.

## 🔍 Context

### Current State
Agent-Lab v4.0 successfully implements:
- ✅ Tools Platform with CRUD operations
- ✅ Individual agent execution
- ✅ RAG document processing
- ✅ Basic UI for tool testing

### Limitations Identified
- Tools require manual coordination
- No agent persistence or reusability
- Complex workflows need custom coding
- No agent-to-agent communication
- Limited workflow automation

### Requirements Driving Decision
1. **Scalability**: Support complex multi-step workflows
2. **Reusability**: Save and share agent configurations
3. **Simplicity**: Non-technical users create agents
4. **Flexibility**: Adapt to various use cases
5. **Maintainability**: Clean separation of concerns

## 🎯 Decision Details

### Architecture Components

#### 1. Agent Definition System
```
/agents/
├── *.agent.yaml          # Agent configurations
├── swarms/               # Multi-agent workflows
│   └── *.swarm.yaml     # Agent communication definitions
└── templates/           # Pre-built agent templates
    ├── analyst.yaml
    ├── researcher.yaml
    └── reporter.yaml
```

**Agent Schema**:
```yaml
name: string
role: string  
tools: string[]
model: "claude-3-5-sonnet" | "gpt-4o-mini"
systemPrompt: string
inputSchema: object
outputSchema: object
metadata:
  version: string
  author: string
  created: timestamp
```

#### 2. Orchestration Engine
```
/server/orchestration/
├── agent-runner.ts      # Individual agent execution
├── swarm-coordinator.ts # Multi-agent workflows
├── message-bus.ts       # Agent communication
└── execution-monitor.ts # Progress tracking
```

**Key Classes**:
- `AgentRunner`: Executes single agent with tool access
- `SwarmCoordinator`: Manages agent-to-agent communication
- `MessageBus`: Handles inter-agent message passing
- `ExecutionMonitor`: Tracks progress and handles errors

#### 3. Tool Integration (Enhanced)
```
/tools/
├── implementations/     # Individual tool files
├── tool-library.ts     # Central registry with configSchema
└── tool-types.ts       # Type definitions
```

**Enhanced Features**:
- Automatic configSchema generation for UI
- Runtime validation of tool parameters
- Tool dependency management
- Version compatibility checking

#### 4. User Interface Architecture
```
/ui/src/
├── pages/
│   ├── agents/         # Agent management
│   ├── swarms/         # Multi-agent workflows  
│   ├── tools/          # Tool playground
│   └── rag/            # Document chat
├── components/
│   ├── AgentBuilder.tsx
│   ├── SwarmDesigner.tsx
│   └── ExecutionMonitor.tsx
└── services/
    ├── agentApi.ts
    ├── swarmApi.ts
    └── executionApi.ts
```

## 🔄 Implementation Strategy

### Phase 1: Foundation (Current Sprint)
1. **Agent Schema Validation** - Define YAML/JSON structure
2. **Agent Persistence** - Save/load agent configurations
3. **Enhanced Tool Registry** - Improve configSchema system
4. **Basic Orchestration** - Single agent with multiple tools

### Phase 2: Communication
1. **Message Bus** - Agent-to-agent communication
2. **Swarm Definitions** - Multi-agent workflow configs
3. **Execution Monitoring** - Real-time progress tracking
4. **Error Recovery** - Automatic retry and failure handling

### Phase 3: Advanced Features
1. **Swarm Designer UI** - Visual workflow creation
2. **Agent Marketplace** - Share and discover agents
3. **Performance Analytics** - Execution metrics and optimization
4. **Advanced Integrations** - External APIs and services

## 🏗️ Technical Decisions

### 1. Configuration Format: YAML
**Chosen**: YAML for agent definitions  
**Alternatives**: JSON, TypeScript configs  
**Rationale**: 
- Human-readable and editable
- Comments support for documentation
- Widely adopted in DevOps tools
- Easy to validate and parse

### 2. Communication Pattern: Message Bus
**Chosen**: Centralized message bus with routing  
**Alternatives**: Direct agent-to-agent calls, Event sourcing  
**Rationale**:
- Decouples agents from each other
- Enables monitoring and debugging
- Supports complex routing patterns
- Allows for future scaling

### 3. Tool Attachment: Dynamic Discovery
**Chosen**: Runtime tool discovery and attachment  
**Alternatives**: Compile-time binding, Hard-coded tool lists  
**Rationale**:
- Enables user-created tools
- Supports tool versioning
- Allows hot-swapping of implementations
- Facilitates testing and development

### 4. State Management: Hybrid Approach
**Chosen**: File-based persistence + Runtime state  
**Alternatives**: Database-only, Memory-only  
**Rationale**:
- Git-trackable configurations
- No database dependencies
- Fast runtime access
- Easy backup and versioning

## 🎯 Expected Outcomes

### Positive Consequences
1. **Increased Productivity**: Users automate complex workflows
2. **Reduced Complexity**: Declarative vs imperative task definition
3. **Enhanced Reusability**: Agents and tools become shareable assets
4. **Improved Debugging**: Clear execution traces and error handling
5. **Ecosystem Growth**: Community contributes agents and tools

### Potential Risks & Mitigations
1. **Performance Overhead**: Multi-agent coordination latency
   - *Mitigation*: Async execution, intelligent caching
2. **Complexity Creep**: Over-engineering simple tasks
   - *Mitigation*: Keep single-agent execution simple
3. **Configuration Sprawl**: Too many YAML files
   - *Mitigation*: Templates, validation, and UI management
4. **Debugging Difficulty**: Complex agent interactions
   - *Mitigation*: Comprehensive logging and execution traces

## 🔗 Integration Points

### External Systems
- **LLM APIs**: Claude (Anthropic), GPT-4 (OpenAI)
- **Email Systems**: SMTP servers for notifications
- **Document Storage**: Local filesystem, potential cloud storage
- **Web APIs**: Yahoo Finance, future integrations

### Internal Dependencies
- **Node.js Server**: Express.js with TypeScript
- **Python RAG System**: FastAPI with LangChain
- **React UI**: Vite development server
- **Tool System**: Existing implementation library

## 📊 Comparison to Alternatives

### vs. Agency Swarm
**Similarities**: Multi-agent coordination, tool attachment  
**Differences**: 
- Agent-Lab: File-based configs, web UI focus
- Agency Swarm: Python-native, CLI-first

### vs. AutoGPT/LangChain Agents
**Similarities**: LLM-powered agent execution  
**Differences**:
- Agent-Lab: Declarative configuration, tool-focused
- AutoGPT: Code generation, autonomous operation

### vs. Custom Scripting
**Similarities**: Task automation  
**Differences**:
- Agent-Lab: No-code agent creation, reusable components
- Scripting: Full control, higher technical barrier

## 🎉 Success Definition

Agent-Lab vNext succeeds when:

1. **"Stock Report" Use Case**: User creates agent that fetches multiple stock prices, analyzes trends, and emails formatted report - all through UI configuration

2. **"Research Pipeline" Use Case**: User creates 3-agent swarm (Researcher → Analyst → Reporter) that processes documents, extracts insights, and generates summaries

3. **"Tool Ecosystem" Use Case**: Community creates and shares 20+ specialized tools and 10+ pre-built agents

4. **"Non-Technical Adoption" Use Case**: Business users create custom agents without writing code

---

*This ADR establishes the architectural foundation for Agent-Lab's evolution into a comprehensive multi-agent platform while maintaining the simplicity and power that makes it effective.*