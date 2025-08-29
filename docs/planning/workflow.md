# Workflow – Agent-Lab v4.0

## Agent Lifecycle

1. **Create Agent**
   - User fills metadata, schemas, tools in Agent Builder UI
   - Config passed to `agent-template.ts`
   - New `.agent.ts` file written under `/agents/`
   - Registry updated automatically

2. **Run Agent**
   - API endpoint `/api/agents/run/:id` executes selected agent
   - Agent uses `BaseAgent.run()` to call configured tools
   - Output returned with structured schema

3. **RAG Workflow**
   - Documents ingested into `server/rag/`
   - Stored in ChromaDB via Python FastAPI
   - Queried via `/rag/query` endpoint
   - Results returned to agent for processing

4. **UI Workflow**
   - 3-tab interface:
     - Agents tab: Run configured agents
     - Chatbot tab: Direct LLM chat
     - RAG Chat tab: Query docs via agents/local models

5. **Tool Usage**
   - Tools implemented in `/server/tools/`
   - Registered in tool library
   - Selected via Agent Builder → injected into agent config

## Future Workflow Enhancements
- Visual workflow editor (drag-drop orchestration)
- Multi-agent orchestration via `/server/orchestration/`
- Auto-generated Markdown docs per agent for Obsidian integration
