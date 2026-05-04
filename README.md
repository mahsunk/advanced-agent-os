# Advanced Agent OS

Advanced Agent OS is a unified multi-agent engineering platform for coordinating specialized software-development agents from one runtime.

It is designed as a TypeScript/JavaScript monorepo with:

- a Fastify API
- a React + Vite dashboard
- WebSocket live event streaming
- agent orchestration primitives
- shared memory abstractions
- tool/plugin/provider layers
- Docker and GitHub Actions support

## Project Status

Advanced Agent OS currently has a working foundation:

- API server with REST endpoints
- WebSocket live event stream
- React dashboard with live event feed
- Demo orchestration trigger
- Multi-agent role model
- Task graph orchestration primitives
- Shared memory and tool abstractions
- Provider and plugin registries
- Docker Compose setup
- GitHub Actions CI
- Public roadmap in [`ROADMAP.md`](./ROADMAP.md)

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

## Current Capabilities

- Role-based agent registry
- Task graph orchestration
- Recursive task chaining
- Shared memory store
- Tool runner abstraction
- Terminal sandbox abstraction
- GitHub tool abstraction
- LLM provider abstraction
- Provider registry
- Plugin registry
- Telemetry logger
- Fastify REST API
- WebSocket live event broadcasting
- React dashboard
- Live event feed
- Demo orchestration trigger
- GitHub Actions CI
- Docker Compose infrastructure

## Repository Layout

```txt
apps/
  api/                  Fastify API and websocket runtime
  web/                  React + Vite dashboard

packages/
  agent-core/           Agent types, runtime and registry
  agents/               Specialized role agents
  memory/               Shared memory abstractions
  tools/                Tool execution abstractions
  orchestration/        Task graph, retry, event and autonomous loop systems
  telemetry/            Structured logging
  providers/            LLM provider abstractions
  plugins/              Plugin registry
```

## Quick Start

Clone the repository:

```bash
git clone https://github.com/mahsunk/advanced-agent-os.git
cd advanced-agent-os
```

Install dependencies:

```bash
npm install
npm install --prefix apps/api
npm install --prefix apps/web
```

Start the API:

```bash
cd apps/api
npm run dev
```

The API runs on:

```txt
http://localhost:3000
```

Available endpoints:

```txt
GET  /health
GET  /agents
GET  /events
POST /run-demo
WS   /ws/events
```

Start the dashboard in a second terminal:

```bash
cd apps/web
npm run dev
```

The dashboard runs on:

```txt
http://localhost:5173
```

## Demo Flow

1. Open the dashboard.
2. Click **Run Demo Orchestration**.
3. The dashboard calls `POST /run-demo`.
4. The API creates task and agent events.
5. Events are broadcast through `/ws/events`.
6. The dashboard live feed updates in real time.

## Docker

Run with Docker Compose:

```bash
docker compose up
```

## Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Then add provider keys when real LLM adapters are implemented:

```env
OPENAI_API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379
DEFAULT_MODEL=gpt-5
NODE_ENV=development
```

## Roadmap

See the full roadmap in [`ROADMAP.md`](./ROADMAP.md).

Current planned milestones include:

- Real OpenAI/Claude/Gemini provider adapters
- Persistent vector memory
- Browser automation
- GitHub auto-patching
- Secure terminal execution sandbox
- Distributed workers
- Access control system
- Visual workflow editor
- Agent debate/voting engine
- Self-improving agent loops
- Cloud deployment templates

## License

MIT
