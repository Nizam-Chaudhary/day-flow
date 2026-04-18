# AGENTS.md

## Task Completion Requirements

- All of `bun format`, `bun lint` must pass before considering tasks completed.
- NEVER run bun test. Always use bun run test (runs Vitest).

## Project Snapshot

Day flow is a minimal web GUI for Planning and Managing your Day through the calendar and integrations.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures.

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## shadcn/ui Components

- Prefer using `shadcn/ui` components for common UI patterns instead of building them from scratch
- First check existing components in `src/components/ui`
- Reuse already added components whenever possible
- If a required `shadcn/ui` component is not available, it can be added and then used
- Keep usage consistent with the existing project patterns and styling
- Avoid duplicating components that already exist in the project

## Commit Guide Reference

- Detailed commit guidelines are available at: `docs/agents-commit.md`
- This repo uses `commitlint` for linting commit messages
- Check this file if you need examples or clarification on commit messages
- Prefer following it when unsure about commit format or types
