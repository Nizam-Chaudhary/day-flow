# AGENTS.md

## Task Completion Requirements

- All of `bun run format`, `bun run lint` must pass before considering tasks completed.
- NEVER use `bun test`. Always use `bun run test` (runs Vitest).

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

## Repository Structure

- Keep application code under `src/`.
- Use `src/components` for UI components.
- Use `src/components/ui` for shadcn and atomic reusable components.
- Use `src/lib` for core libraries, integrations, and environment/runtime helpers.
- Use `src/utils` for mostly pure utility functions.
- Use `src/hooks` for React custom hooks.
- Use `src/pages` for TanStack Router route files and page composition.
- Use `src/db` for Drizzle schema, repositories, migrations, and DB paths/bootstrap.
- Use `src/main` for Electron main-process code only.
- Use `src/stores` for Zustand stores.
- Use `src/services` for TanStack Query queries and mutations plus renderer API adapters.
- Use `src/schemas` for Zod-first contracts and derived types.
- Use `src/server` for Hono server code and routes.

- Keep nesting shallow. Avoid creating extra nesting with directories unless they remove real duplication.

## Types and Schemas

- Prefer Zod schemas for shared contracts and inputs.
- Derive TypeScript types from schemas instead of hand-writing duplicate interfaces.
- Keep type-heavy abstractions to a minimum. Prefer direct schemas and straightforward data flow.

## shadcn/ui Components

- Prefer using `shadcn/ui` components for common UI patterns instead of building them from scratch.
- First check existing components in `src/components/ui`.
- Reuse already added components whenever possible.
- If a required `shadcn/ui` component is not available, it can be added and then used.
- Keep usage consistent with the existing project patterns and styling.
- Avoid duplicating components that already exist in the project.

## Typography

- follow guide available on [Shadcn Typography](https://ui.shadcn.com/docs/components/base/typography) for typography usages

## Commit Guide Reference

- Detailed commit guidelines are available at: `docs/agents-commit.md`
- This repo uses `commitlint` for linting commit messages
- Check this file if you need examples or clarification on commit messages
- Prefer following it when unsure about commit format or types
