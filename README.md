# Advanced Agent OS

Advanced Agent OS is a unified TypeScript monorepo for coordinating multiple software-engineering agents from one runtime.

## Agent Roles

- Project Manager Agent
- Architect Agent
- Frontend Agent
- Backend Agent
- QA Agent
- DevOps Agent
- Security Agent
- Research Agent
- Code Reviewer Agent
- Documentation Agent

## Design Goals

- One runtime for many specialized agents
- Shared memory and task context
- Tool-based execution model
- Agent-to-agent handoff
- Safe, auditable plans before code execution
- Extensible package structure

## Repository Layout

```txt
apps/
  api/
  web/
packages/
  agent-core/
  agents/
  memory/
  tools/
  orchestration/
  telemetry/
```

## Status

Initial scaffold in progress.
