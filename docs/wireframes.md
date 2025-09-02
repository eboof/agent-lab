# 🎨 UI Wireframes & User Flows
## Agent-Lab vNext Interface Design

**Version**: 2.0  
**Date**: 2025-09-01  
**Status**: Design Phase

---

## 🗺️ Overall Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│ 🧪 Agent Lab - Your AI Lego Set                            │
├─────────────────────────────────────────────────────────────┤
│ [🤖 Agents] [💬 Chat] [🧠 RAG] [🛠 Tools] [📊 Analytics]    │
└─────────────────────────────────────────────────────────────┘
```

## 1️⃣ Agents Page (Enhanced)

### Main Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Agents                                [🔄 Refresh] [➕ New] │
├─────────────────────────────────────────────────────────────┤
│ [▶️ Run Agents] [🔧 Build Agent] [🌊 Swarms] [📚 Library]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ CONTENT AREA (based on active sub-tab)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tab: ▶️ Run Agents
```
┌─────────────────────────────────────────────────────────────┐
│ Quick Execute                                               │
├─────────────────────────────────────────────────────────────┤
│ Agent: [Stock Analyst ▼]  Input: [TSLA analysis    ] [Run] │
├─────────────────────────────────────────────────────────────┤
│ Recent Executions                                           │
│ ┌─ 📈 Stock Analyst • 2 min ago • Success                   │
│ │   Input: "TSLA quarterly analysis"                        │
│ │   Result: Stock price $349.60, recommendation: HOLD...   │
│ └─ [📋 Details] [🔄 Re-run] [📧 Email Results]             │
│                                                             │
│ ┌─ 🔍 Web Researcher • 5 min ago • Failed                  │
│ │   Input: "AI market trends 2025"                         │
│ │   Error: Rate limit exceeded on web-scraper tool         │
│ └─ [🔍 Debug] [🔄 Retry] [❌ Dismiss]                      │
├─────────────────────────────────────────────────────────────┤
│ Agent Status                                                │
│ 🟢 Stock Analyst (Ready) • 3 tools • Last run: 2m ago     │
│ 🟡 Email Bot (Warming up) • 2 tools • Starting...         │
│ 🔴 Web Scraper (Error) • 4 tools • Connection failed      │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tab: 🔧 Build Agent
```
┌─────────────────────────────────────────────────────────────┐
│ Agent Configuration                    [💾 Save] [👁️ Preview] │
├─────────────────────────────────────────────────────────────┤
│ Name: [My Stock Bot                                     ]  │
│ Role: [Financial analysis and reporting specialist      ]  │
│ Model: [Claude 3.5 Sonnet ▼]                              │
├─────────────────────────────────────────────────────────────┤
│ 🛠️ Tools (3 selected)                                      │
│ ┌─ 📈 Yahoo Finance     ✅ │ ┌─ 📧 Email Sender      ✅ │  │
│ │   Get stock prices       │ │   Send notifications      │  │
│ └─ [Configure]             │ └─ [Configure]              │  │
│                                                             │
│ ┌─ 🌐 Web Scraper       ❌ │ ┌─ 📄 PDF Reader        ❌ │  │
│ │   Extract web data       │ │   Process documents       │  │
│ └─ [+ Add]                 │ └─ [+ Add]                  │  │
├─────────────────────────────────────────────────────────────┤
│ 📝 System Prompt                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ You are a financial analyst specializing in stock      │ │
│ │ analysis. Use Yahoo Finance to get current prices and  │ │
│ │ market data. Provide clear, actionable insights with   │ │
│ │ risk disclaimers. Email reports in professional format.│ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🧪 Test Agent                                              │
│ Test Input: [TSLA analysis                              ]  │
│ [▶️ Test Run]                          Expected: ~30 seconds │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Tab: 🌊 Swarms
```
┌─────────────────────────────────────────────────────────────┐
│ Multi-Agent Workflows                    [➕ New Swarm]     │
├─────────────────────────────────────────────────────────────┤
│ ┌─ 📊 Research Pipeline                                     │
│ │   Agents: Web Researcher → Data Analyst → Report Writer  │
│ │   Status: 🟢 Ready • Last run: 1 hour ago               │
│ │   [▶️ Run] [✏️ Edit] [📋 Results]                        │
│ └─                                                         │
│                                                             │
│ ┌─ 💰 Trading Alert System                                 │
│ │   Agents: Price Monitor → Signal Analyzer → Alert Sender │
│ │   Status: 🔴 Error • Price Monitor failed               │
│ │   [🔍 Debug] [⚙️ Configure] [❌ Disable]                │
│ └─                                                         │
├─────────────────────────────────────────────────────────────┤
│ 🎯 Quick Actions                                           │
│ [📈 Stock Report] [📧 Daily Digest] [🔍 Research Query]   │
│ [📊 Data Analysis] [🌐 Web Monitor] [📄 Doc Summary]      │
└─────────────────────────────────────────────────────────────┘
```

## 2️⃣ Tools Page (Current + Enhanced)

### Main Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🛠 Tools                                    [🔍] [📁 Import] │
├─────────────────────────────────────────────────────────────┤
│ Categories: [All] [📈 Finance] [📧 Communication] [🌐 Web]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─ 📈 Yahoo Finance     │ ┌─ 📧 Send Email       │ ┌─ 🌐 Web │
│ │   Real-time quotes    │ │   SMTP integration   │ │   Scraper│
│ │   [▶️ Test] [✏️ Edit] │ │   [▶️ Test] [📋 Copy] │ │   [+ Add]│
│ └─ Used by: 5 agents    │ └─ Used by: 8 agents   │ └─       │
├─────────────────────────────────────────────────────────────┤
│ Tool Testing Panel                                          │
│ Selected: Yahoo Finance                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Symbol: [TSLA     ] Module: [quote ▼] Range: [1d ▼]    │ │
│ │ [▶️ Run Tool]                                           │ │
│ │                                                         │ │
│ │ Result: {"symbol":"TSLA","price":349.60,"change":-3.5} │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 3️⃣ Execution Monitor (New)

### Real-Time Execution View
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Execution: "Stock Market Analysis"                      │
├─────────────────────────────────────────────────────────────┤
│ Progress: ████████████████▓▓▓▓ 80% complete                │
├─────────────────────────────────────────────────────────────┤
│ Agent Flow:                                                 │
│ 📈 Stock Analyst    ✅ Completed (2.3s)                    │
│ ├─ Yahoo Finance    ✅ TSLA: $349.60                       │
│ ├─ Yahoo Finance    ✅ NVDA: $181.60                       │
│ └─ Data Analysis    ✅ Trend: Bearish (-2.1%)             │
│                                                             │
│ 📧 Report Sender    🔄 In Progress (8.1s)                  │
│ ├─ Format Report    ✅ Generated HTML template             │
│ └─ Send Email       ⏳ Connecting to SMTP...              │
├─────────────────────────────────────────────────────────────┤
│ Live Logs:                                                  │
│ 14:23:45 | Stock Analyst | Fetching TSLA data...          │
│ 14:23:47 | Stock Analyst | Price: $349.60, Change: -1.2%  │
│ 14:23:48 | Report Sender | Generating email template...    │
│ 14:23:50 | Report Sender | Connecting to SMTP server...   │
├─────────────────────────────────────────────────────────────┤
│ [⏸️ Pause] [⏹️ Stop] [🔄 Restart] [📋 Export Logs]        │
└─────────────────────────────────────────────────────────────┘
```

## 4️⃣ Agent Library (New)

### Browse & Discover
```
┌─────────────────────────────────────────────────────────────┐
│ 📚 Agent Library                         [🔍 Search] [🏷️ Tags] │
├─────────────────────────────────────────────────────────────┤
│ 🌟 Featured Agents                                         │
│ ┌─ 📈 Stock Analyst Pro    │ ┌─ 📧 Email Automator     │  │
│ │   4.8★ • 1.2k uses       │ │   4.9★ • 890 uses       │  │
│ │   Financial analysis     │ │   Bulk email campaigns   │  │
│ │   [📥 Install] [👁️ View] │ │   [📥 Install] [👁️ View] │  │
│ └─                         │ └─                        │  │
├─────────────────────────────────────────────────────────────┤
│ 📂 Categories                                              │
│ • 📈 Finance & Trading (12 agents)                        │
│ • 📧 Communication (8 agents)                             │
│ • 🔍 Research & Analysis (15 agents)                      │
│ • 📄 Document Processing (9 agents)                       │
│ • 🌐 Web Automation (11 agents)                           │
├─────────────────────────────────────────────────────────────┤
│ 🛠️ My Created Agents (3)                                  │
│ • Custom Stock Bot (Private)                              │
│ • Daily Report Agent (Shared)                             │
│ • Research Assistant (Private)                            │
└─────────────────────────────────────────────────────────────┘
```

## 5️⃣ Swarm Designer (New)

### Visual Workflow Creation
```
┌─────────────────────────────────────────────────────────────┐
│ 🌊 Swarm Designer: "Research Pipeline"                     │
├─────────────────────────────────────────────────────────────┤
│ Canvas:                                                     │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │🔍 Web        │ ──▶│📊 Data       │ ──▶│📧 Report     │     │
│  │  Researcher  │    │  Analyst     │    │  Sender      │     │
│  │              │    │              │    │              │     │
│  │ 3 tools      │    │ 2 tools      │    │ 1 tool       │     │
│  │ Ready ✅     │    │ Ready ✅     │    │ Ready ✅     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Properties Panel:                                           │
│ Selected: Web Researcher                                    │
│ • Input: User query (string)                               │
│ • Output: Research data (object)                           │
│ • Tools: Web Scraper, Search API, Content Extractor       │
│ • Timeout: 120 seconds                                     │
│                                                             │
│ Data Flow: Web Researcher.output → Data Analyst.input     │
├─────────────────────────────────────────────────────────────┤
│ [💾 Save Swarm] [▶️ Test Run] [📋 Export Config]           │
└─────────────────────────────────────────────────────────────┘
```

## 6️⃣ Enhanced RAG Chat

### Document-Powered Conversations
```
┌─────────────────────────────────────────────────────────────┐
│ 🧠 RAG Chat                     Model: [GPT-4o Mini ▼]     │
├─────────────────────────────────────────────────────────────┤
│ 📚 Knowledge Base (4 documents indexed)                    │
│ • financial-report-q3.pdf (24 pages)                      │
│ • market-analysis.md (3,200 words)                        │
│ • competitor-research.txt (1,800 words)                   │
│ • [📁 Add Documents] [🔄 Reindex] [🗑️ Clear]              │
├─────────────────────────────────────────────────────────────┤
│ Conversation:                                               │
│                                                             │
│ 👤 You: What were the Q3 revenue figures?                  │
│                                                             │
│ 🤖 Bot: According to the Q3 financial report, revenue was  │
│     $2.3B, representing 15% growth YoY. Key drivers were   │
│     the enterprise segment (+22%) and recurring revenue    │
│     (+18%). The consumer segment declined 3%.              │
│                                                             │
│     📚 Sources: financial-report-q3.pdf (pages 4, 12)     │
│     ⏱️ 1.2s • 🎯 Confidence: 94%                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [What about expenses?        ] [Ask] [🎙️] [📎] [🔍]       │
└─────────────────────────────────────────────────────────────┘
```

## 7️⃣ Analytics Dashboard (New)

### Performance & Usage Metrics
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Analytics                           Period: [Last 7 days ▼] │
├─────────────────────────────────────────────────────────────┤
│ 🎯 Agent Performance                                       │
│ ┌─ Top Performers           │ ┌─ Most Used               │  │
│ │ 1. Stock Analyst (4.8★)   │ │ 1. Email Sender (245×)    │  │
│ │ 2. Email Bot (4.7★)       │ │ 2. Yahoo Finance (198×)   │  │
│ │ 3. Web Scraper (4.5★)     │ │ 3. Web Scraper (156×)     │  │
│ └─                          │ └─                         │  │
├─────────────────────────────────────────────────────────────┤
│ 📈 Usage Trends                                            │
│ Agent Executions: ████████████████████▓▓ 89 (↑ 23%)       │
│ Tool Calls:       ██████████████████████ 234 (↑ 18%)      │
│ Success Rate:     ████████████████████▓▓ 92% (↓ 2%)       │
│                                                             │
│ 🔴 Common Errors:                                          │
│ • SMTP connection timeout (12 occurrences)                │
│ • Yahoo Finance rate limit (8 occurrences)                │
│ • Web scraper blocked (5 occurrences)                     │
├─────────────────────────────────────────────────────────────┤
│ 💡 Optimization Suggestions:                               │
│ • Configure SMTP connection pooling (reduce timeouts)     │
│ • Add Yahoo Finance API key (increase rate limits)        │
│ • Implement web scraper rotation (avoid blocking)         │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 UI Component Specifications

### Design System
- **Colors**: Primary blue (#2563eb), Success green (#10b981), Warning orange (#f59e0b), Error red (#ef4444)
- **Typography**: System fonts, code sections in Monaco/Menlo
- **Icons**: Emoji-based for consistency and clarity
- **Layout**: CSS Grid with responsive breakpoints

### Key Components

#### AgentCard
```typescript
interface AgentCardProps {
  agent: AgentDefinition;
  status: "ready" | "running" | "error";
  onRun: () => void;
  onEdit: () => void;
  showMetrics?: boolean;
}
```

#### ToolSelector
```typescript
interface ToolSelectorProps {
  availableTools: ToolDefinition[];
  selectedTools: string[];
  onToolToggle: (toolId: string) => void;
  showConfigs?: boolean;
}
```

#### ExecutionProgress
```typescript
interface ExecutionProgressProps {
  execution: AgentExecution;
  onPause: () => void;
  onStop: () => void;
  onExportLogs: () => void;
}
```

#### SwarmCanvas
```typescript
interface SwarmCanvasProps {
  agents: AgentDefinition[];
  connections: Connection[];
  onAgentAdd: (agent: AgentDefinition) => void;
  onConnectionCreate: (from: string, to: string) => void;
  readOnly?: boolean;
}
```

## 🔄 User Journey Maps

### Journey 1: First-Time User
1. **Discovery** → User opens Agent-Lab, sees welcome tour
2. **Exploration** → Browses agent library, finds "Stock Analyst" 
3. **Testing** → Runs pre-built agent with "TSLA"
4. **Customization** → Clones agent, modifies for their needs
5. **Integration** → Sets up daily email reports
6. **Mastery** → Creates custom swarm for complex workflows

### Journey 2: Power User
1. **Tool Creation** → Builds custom Gmail integration tool
2. **Agent Design** → Creates sophisticated research agent
3. **Swarm Building** → Designs 4-agent research pipeline
4. **Optimization** → Uses analytics to improve performance
5. **Sharing** → Publishes agent to community library
6. **Collaboration** → Helps others optimize their workflows

### Journey 3: Business User
1. **Problem Recognition** → Needs automated market reports
2. **Solution Discovery** → Finds "Daily Report" template
3. **Configuration** → Sets up stock symbols and email recipients  
4. **Deployment** → Schedules daily execution via cron
5. **Monitoring** → Checks analytics for delivery success
6. **Expansion** → Adds more report types and recipients

## 🚀 Interaction Patterns

### Progressive Disclosure
- **Beginner**: Simple run/test interfaces
- **Intermediate**: Agent building and configuration
- **Advanced**: Swarm design and analytics

### Feedback Mechanisms
- **Immediate**: Button states, loading indicators
- **Progress**: Real-time execution monitoring
- **Completion**: Success notifications, result summaries
- **Error**: Clear error messages with suggested fixes

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: WCAG AA compliance
- **Responsive Design**: Mobile and tablet support

---

*These wireframes provide the foundation for implementing Agent-Lab vNext's user interface, focusing on clarity, efficiency, and progressive complexity.*