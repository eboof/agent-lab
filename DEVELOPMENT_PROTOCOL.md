# Agent-Lab Development Protocol

## Session Summary - 2025-09-04

### What We Accomplished

**Primary Feature**: Execution Monitor with Agent Portals
- Implemented complete real-time WebSocket-based execution monitoring system
- Created agent lifecycle event tracking (start, done, error, awaiting_user) 
- Built interactive decision workflows with pause-and-resume execution
- Added Smart Inbox integration with Gmail API for email management
- Created React components for monitoring dashboard with real-time updates
- Fixed navigation redundancies and added back navigation flow

### Technical Implementation

**Backend Architecture**:
- `execution-store.ts`: Persistent execution state management with WebSocket subscriptions
- `message-bus.ts`: Enhanced event system with WebSocket client management  
- `agent-runner.ts`: Integrated lifecycle events and user input handling
- `index.ts`: WebSocket server setup with execution endpoints

**Frontend Components**:
- `ExecutionMonitor.tsx`: Main monitoring dashboard with real-time WebSocket updates
- `AgentPortal.tsx`: Individual agent status cards with interactive decision rendering
- `SmartInboxDecisionTable.tsx`: Gmail decision table with action dropdowns
- `ExecutionLauncher.tsx`: Launch interface with clear inactive executions button

### Problems Encountered & Solutions

#### 1. Module Import Errors
**Problem**: "Cannot find module execution-store.js" when importing TypeScript files
**Root Cause**: Incorrect import extensions in ES modules 
**Solution**: Use `.ts` extensions in imports, not `.js`
**Prevention**: Always check import extensions when working with TypeScript ES modules

#### 2. Missing Dependencies  
**Problem**: Server failed to start due to missing 'ws' package
**Root Cause**: New WebSocket functionality required additional dependency
**Solution**: `pnpm install ws` in project root
**Prevention**: Check package.json and install new dependencies immediately when adding new functionality

#### 3. Gmail API Parameter Mismatches
**Problem**: Agent calling tool with `max_results` but tool expected `count`  
**Root Cause**: Inconsistent parameter naming between agent prompts and tool definitions
**Solution**: Updated tool to accept both parameters and corrected agent prompts
**Prevention**: Maintain consistent parameter naming across tools and agents

#### 4. WebSocket Connection Management
**Problem**: Client disconnect/reconnect cycles causing state synchronization issues
**Root Cause**: Aggressive reconnection logic and missing connection state handling
**Solution**: Proper connection lifecycle management with graceful reconnection
**Prevention**: Always implement proper WebSocket cleanup and state persistence

#### 5. React Component Rendering Errors
**Problem**: JSX attribute warnings and incorrect style syntax
**Root Cause**: Mixing styled-jsx syntax with standard React patterns
**Solution**: Use standard `<style>` tags instead of `<style jsx>`
**Prevention**: Choose consistent styling approach (CSS modules, styled-components, or inline styles)

#### 6. Navigation State Management
**Problem**: React Router complexity for simple page navigation
**Root Cause**: Over-engineering navigation for straightforward use case
**Solution**: Implemented simple client-side routing with `useSimpleRouter()` hook
**Prevention**: Use simplest solution that meets requirements; avoid unnecessary complexity

#### 7. Server Restart Required for API Changes
**Problem**: New endpoints not available until server restart
**Root Cause**: Hot reload doesn't catch all changes, especially new route definitions
**Solution**: Always restart server after adding new API endpoints
**Prevention**: Build development workflow that accounts for server restarts

### Development Protocol

#### Before Starting New Features:
1. **Plan with TodoWrite**: Break down complex tasks into specific steps
2. **Research Codebase**: Use search tools to understand existing patterns
3. **Check Dependencies**: Verify required packages are installed
4. **Review Conventions**: Follow existing code style and patterns

#### During Implementation:
1. **Incremental Development**: Implement and test small pieces
2. **Real-time Testing**: Test each component as you build it
3. **Error Handling**: Add proper error boundaries and user feedback
4. **State Management**: Keep state simple and predictable

#### API Development:
1. **Consistent Naming**: Use same parameter names across tools and agents
2. **Error Responses**: Return structured JSON errors, never HTML
3. **Server Restarts**: Restart server after adding new endpoints
4. **Testing**: Test endpoints with curl before UI integration

#### WebSocket Development:
1. **Connection Lifecycle**: Handle connect/disconnect/reconnect gracefully
2. **Message Validation**: Validate all incoming WebSocket messages
3. **State Synchronization**: Ensure UI state matches server state
4. **Cleanup**: Always clean up WebSocket connections on unmount

#### React Component Development:
1. **Consistent Styling**: Choose one approach (inline styles, CSS modules, etc.)
2. **Error Boundaries**: Wrap components that might fail
3. **Loading States**: Always provide user feedback during async operations
4. **Prop Validation**: Use TypeScript interfaces for all props

#### Navigation:
1. **Keep Simple**: Use simplest routing solution that works
2. **State Preservation**: Maintain navigation state across page changes  
3. **Back Navigation**: Always provide way to return to previous screen
4. **URL Consistency**: Ensure URLs reflect actual application state

### File Structure Conventions

```
/server/
  orchestration/     # Core execution logic
    execution-store.ts
    message-bus.ts  
    agent-runner.ts
  api/              # REST endpoints
    agents.ts
  index.ts          # Main server setup

/ui/src/
  pages/
    execution/      # Execution monitoring UI
      ExecutionMonitor.tsx
      AgentPortal.tsx
      SmartInboxDecisionTable.tsx
    agents/         # Agent management UI
      ExecutionLauncher.tsx

/tools/implementations/ # Tool definitions
  gmail-*.ts        # Gmail integration tools

/agents/           # Agent configurations
  *.agent.yaml     # YAML agent definitions
```

### Testing Strategy
1. **Component Testing**: Test React components in isolation
2. **API Testing**: Use curl for endpoint validation
3. **Integration Testing**: Test full workflows end-to-end
4. **Error Path Testing**: Verify error handling works correctly

### Git Workflow
1. **Incremental Commits**: Commit working features frequently
2. **Descriptive Messages**: Use clear commit messages with context
3. **Branch Strategy**: Work on feature branches for complex changes
4. **Documentation**: Update docs alongside code changes

## Lessons Learned

1. **Start Simple**: Begin with minimal viable implementation
2. **Test Early**: Don't build large features without testing components
3. **Handle Errors**: Plan for failure cases upfront
4. **User Feedback**: Always provide loading states and error messages
5. **Documentation**: Write protocols during development, not after

This protocol should prevent the repetition of issues encountered and establish clear patterns for future development.