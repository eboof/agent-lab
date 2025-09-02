# Lifecycle Management Patterns for Agent-Lab

## Overview
This document defines the standard lifecycle patterns implemented for Tools and planned for Agents and Workflows in Agent-Lab.

## Standard Lifecycle Operations

### 1. **CRUD + Clone Pattern**
Every manageable entity (Tools, Agents, Workflows) follows this pattern:

- **Create**: Generate new entity from scratch or template
- **Read**: Load entity metadata and source/configuration
- **Update**: Modify existing entity in-place  
- **Delete**: Remove entity completely
- **Clone**: Create new entity based on existing one (Save As)

### 2. **API Endpoint Structure**
Consistent REST endpoints for each entity type:

```
GET    /api/{type}/list           # List all entities
GET    /api/{type}/load/:id       # Load entity for editing
POST   /api/{type}/create         # Create new entity
PUT    /api/{type}/update/:id     # Update existing entity
DELETE /api/{type}/delete/:id     # Delete entity
POST   /api/{type}/run/:id        # Execute entity (if applicable)
```

### 3. **UI Mode Structure**
Three-tab interface pattern:

- **Test/Run Mode**: Execute and interact with entities
- **Create Mode**: Build new entities from scratch
- **Edit Mode**: Modify existing entities with clone/delete options

## Current Implementation: Tools

### API Endpoints
- ✅ `GET /api/tools/list` - List all tools
- ✅ `GET /api/tools/load/:id` - Load tool source code
- ✅ `POST /api/tools/create` - Create new tool (supports `baseToolId` for cloning)
- ✅ `PUT /api/tools/update/:id` - Update existing tool
- ✅ `DELETE /api/tools/delete/:id` - Delete tool
- ✅ `POST /api/tools/run/:id` - Execute tool

### UI Features
- ✅ Three-mode interface (Test/Create/Edit)
- ✅ Tool selection and loading
- ✅ Source code editing with metadata
- ✅ Action buttons: Update | Save As New | Delete
- ✅ Automatic tool reloading after changes
- ✅ Status feedback and error handling

### File Management
- ✅ Auto-discovery from `/tools/implementations/`
- ✅ TypeScript file generation with proper imports
- ✅ Metadata tracking in file headers
- ✅ Validation and error handling

## Planned Implementation: Agents

### API Endpoints (To Implement)
```
GET    /api/agents/list           # List all agents
GET    /api/agents/load/:filename # Load agent configuration
POST   /api/agents/create         # Create new agent
PUT    /api/agents/update/:id     # Update existing agent  
DELETE /api/agents/delete/:id     # Delete agent
POST   /api/agents/run/:id        # Execute agent
```

### Agent-Specific Features
- Agent configuration builder (name, description, system prompt, tools selection)
- Schema editor for input/output validation
- Tool selection interface with multi-select
- Agent testing with parameter forms
- Agent versioning and variant creation

### File Structure
```
agents/
├── {agent-name}.agent.ts     # Agent definition files
└── templates/                # Agent templates
    ├── basic-agent.ts
    ├── rag-agent.ts
    └── analysis-agent.ts
```

## Planned Implementation: Workflows

### API Endpoints (To Implement)
```
GET    /api/workflows/list        # List all workflows
GET    /api/workflows/load/:id    # Load workflow configuration
POST   /api/workflows/create      # Create new workflow
PUT    /api/workflows/update/:id  # Update existing workflow
DELETE /api/workflows/delete/:id  # Delete workflow
POST   /api/workflows/run/:id     # Execute workflow
```

### Workflow-Specific Features
- Visual workflow designer with drag-and-drop
- Tool and agent chaining with parameter mapping
- Conditional logic and branching
- Loop and iteration support
- Error handling and retry logic
- Execution monitoring and logging

### File Structure
```
workflows/
├── {workflow-name}.workflow.yaml # Workflow definition files
└── templates/                    # Workflow templates
    ├── data-pipeline.yaml
    ├── analysis-workflow.yaml
    └── multi-agent.yaml
```

## Common Patterns

### 1. **Entity Validation**
All entities follow consistent validation:
- ID format: lowercase, numbers, hyphens only
- Required fields: id, name, implementation
- Optional metadata: description, icon, category, tags

### 2. **File Management**
- Auto-discovery from designated directories
- Consistent file naming: `{id}.{extension}`
- Metadata in file headers with timestamps
- Automatic reloading after changes

### 3. **UI Consistency**
- Three-mode tabs: Test | Create | Edit
- Consistent form layouts and styling
- Standard action buttons with icons
- Status messages and error handling
- Responsive design for mobile

### 4. **Clone Behavior**
When cloning/saving as new:
- Prompt for new ID
- Preserve all current modifications
- Add clone metadata to file header
- Refresh entity list automatically
- Provide success/error feedback

### 5. **Delete Safety**
- Confirmation dialog with entity name
- Check for dependencies before deletion
- Remove from filesystem and memory
- Refresh entity list automatically
- Clear edit state if deleting current entity

## Implementation Benefits

### Developer Experience
- Consistent patterns across all entity types
- Predictable API structure
- Reusable UI components
- Clear file organization

### User Experience  
- Familiar interface across all features
- Safe operations with confirmations
- Easy experimentation with cloning
- Clear feedback on all actions

### Maintainability
- Single source of truth for patterns
- Easy to extend to new entity types
- Consistent error handling
- Comprehensive logging

## Next Steps

1. **Agents**: Apply this pattern to agent management
2. **Workflows**: Implement visual workflow builder
3. **Dependencies**: Add dependency tracking between entities
4. **Versioning**: Add version control for all entities
5. **Sharing**: Enable import/export of entity packages

This pattern provides a solid foundation for building a comprehensive AI development platform with consistent, intuitive management of all components.