# Contributing to Advanced Agent OS

Thanks for your interest in contributing to Advanced Agent OS.

This project is an early-stage multi-agent engineering platform. Contributions should prioritize safety, clarity, modularity and testability.

## Development Setup

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

Run the API:

```bash
cd apps/api
npm run dev
```

Run the web dashboard:

```bash
cd apps/web
npm run dev
```

## Contribution Guidelines

- Keep agents small and role-specific.
- Prefer typed interfaces over ad-hoc objects.
- Add new runtime behavior behind clear abstractions.
- Do not add unsafe terminal, browser or GitHub write behavior without guardrails.
- Document new packages, endpoints and runtime concepts.
- Keep dashboard features connected to real runtime events when possible.

## Pull Request Checklist

Before opening a PR:

- Explain what changed and why.
- Link the related issue when applicable.
- Keep changes focused.
- Update README or ROADMAP if the change affects architecture.
- Run the relevant install/build commands locally.

## Architecture Principles

Advanced Agent OS should remain:

- modular
- auditable
- provider-agnostic
- tool-safe
- dashboard-observable
- cloud-deployable
- easy to extend with new agents

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for current milestones.
