# 📚 Agent-Lab Documentation Hub
## Complete Guide to Multi-Agent Orchestration Platform

**Version**: 2.0  
**Last Updated**: 2025-09-01

---

## 🚀 Quick Start

### For New Users
1. **[Product Overview](./prd.md)** - What Agent-Lab does and why it matters
2. **[UI Guide](./wireframes.md)** - How to navigate the interface
3. **[Agent Examples](./agents/AGENT_SCHEMA.md#complete-examples)** - Ready-to-use agent templates

### For Developers
1. **[Architecture Guide](./adr.md)** - System design decisions
2. **[Tool Development](./tools/TOOL_GUIDE.md)** - Create custom tools
3. **[Agent Schema](./agents/AGENT_SCHEMA.md)** - Define agent configurations

---

## 📋 Documentation Index

### 🎯 Planning & Strategy
| Document | Purpose | Audience |
|----------|---------|----------|
| **[prd.md](./prd.md)** | Product Requirements & Vision | All Users |
| **[adr.md](./adr.md)** | Architecture Decisions | Developers |
| **[wireframes.md](./wireframes.md)** | UI Design & User Flows | Designers, Users |

### 🤖 Agent System
| Document | Purpose | Audience |
|----------|---------|----------|
| **[AGENT_SCHEMA.md](./agents/AGENT_SCHEMA.md)** | Agent Definition Guide | Agent Builders |
| **[AGENT_BUILDER.md](./AGENT_BUILDER.md)** | Legacy Agent Builder | Reference |

### 🛠️ Tool System  
| Document | Purpose | Audience |
|----------|---------|----------|
| **[TOOL_GUIDE.md](./tools/TOOL_GUIDE.md)** | Tool Development Standard | Tool Developers |
| **[yahoo-finance.md](./tools/yahoo-finance.md)** | Yahoo Finance Tool Docs | Users |
| **[send-email.md](./tools/send-email.md)** | Email Tool Documentation | Users |
| **[TOOLS.md](./TOOLS.md)** | Legacy Tools Overview | Reference |

### 🏗️ Infrastructure
| Document | Purpose | Audience |
|----------|---------|----------|
| **[API.md](./API.md)** | Server API Reference | Developers |
| **[RAG.md](./RAG.md)** | Document Processing System | Users |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Production Deployment | DevOps |

---

## 🔄 Current Status (v4.0 → v5.0)

### ✅ Completed Features
- **Tools Platform**: Full CRUD operations with configSchema
- **Agent Execution**: Basic agent running with tool access
- **RAG System**: Document upload and querying
- **Email Integration**: Working SMTP with proper sender config
- **Chat Interface**: Claude and OpenAI model support

### 🔄 In Progress  
- **Agent Builder UI**: Enhanced agent creation interface
- **Multi-Agent Workflows**: Swarm coordination system
- **Execution Monitoring**: Real-time progress tracking

### 📅 Planned Features
- **Agent Library**: Browse and share agent templates
- **Swarm Designer**: Visual workflow creation tool
- **Analytics Dashboard**: Performance and usage metrics
- **Tool Marketplace**: Community tool sharing

---

## 🎯 Use Case Examples

### Business Automation
```yaml
# Daily Market Report Agent
Purpose: Fetch stock prices, analyze trends, email formatted report
Tools: yahoo-finance, send-email, web-scraper
Execution: Scheduled via cron at market close
Recipient: Investment team distribution list
```

### Research Workflows
```yaml
# Multi-Agent Research Pipeline
Agents: Web Researcher → Data Analyst → Report Writer
Input: Research topic or question
Output: Comprehensive report with sources and analysis
Tools: web-scraper, rag-query, send-email, data-processor
```

### Customer Support
```yaml
# Support Ticket Processor
Purpose: Analyze tickets, classify urgency, route to specialists
Tools: email-reader, text-classifier, slack-notify
Integration: Help desk system via API
Automation: 80% of tickets auto-classified and routed
```

## 🛠️ Development Workflow

### For Tool Creators
1. **Design**: Define tool purpose and parameters
2. **Implement**: Follow [Tool Guide](./tools/TOOL_GUIDE.md) standards
3. **Test**: Use Tools Playground for validation
4. **Document**: Add to appropriate category documentation
5. **Share**: Register in tool library for community use

### For Agent Builders  
1. **Plan**: Define agent role and required tools
2. **Configure**: Create YAML following [Agent Schema](./agents/AGENT_SCHEMA.md)
3. **Test**: Validate with sample inputs
4. **Deploy**: Save to agents directory
5. **Monitor**: Track performance and usage

### For System Integrators
1. **Architecture**: Review [ADR](./adr.md) for system design
2. **APIs**: Use [API documentation](./API.md) for integration
3. **Deployment**: Follow [deployment guide](./DEPLOYMENT.md)
4. **Monitoring**: Implement logging and analytics
5. **Scaling**: Plan for multi-user and high-volume usage

---

## 🔍 Troubleshooting Quick Reference

### Common Issues
| Problem | Solution | Documentation |
|---------|----------|---------------|
| Tool not found | Check tool-library.ts registration | [Tool Guide](./tools/TOOL_GUIDE.md) |
| Agent creation fails | Validate YAML schema | [Agent Schema](./agents/AGENT_SCHEMA.md) |
| Email not sending | Check SMTP environment variables | [Email Tool](./tools/send-email.md) |
| RAG not responding | Verify Python dependencies | [RAG Guide](./RAG.md) |
| Performance issues | Check tool rate limits and timeouts | [Analytics Dashboard] |

### Debug Commands
```bash
# Check service status
curl http://localhost:3001/health

# Test tool directly
curl -X POST http://localhost:3001/api/tools/run/yahoo-finance \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TSLA"}'

# Validate agent configuration
./validate-agent.sh agents/my-agent.yaml

# Monitor real-time logs
tail -f main-server.log rag-server.log ui-server.log
```

---

## 🌟 Contributing

### Documentation Updates
- Follow existing markdown formatting
- Include code examples for new features
- Update this index when adding new documents
- Test all code examples before submission

### Community Guidelines
- **Tool Sharing**: Submit useful tools to community library
- **Agent Templates**: Share successful agent configurations  
- **Bug Reports**: Use GitHub issues with clear reproduction steps
- **Feature Requests**: Provide detailed use cases and requirements

---

*This documentation hub provides comprehensive guidance for using, developing, and extending Agent-Lab's multi-agent orchestration capabilities.*