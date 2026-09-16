# Repository Guidelines

## Project Structure & Module Organization

Factstories is a factory game built with React, TypeScript, Redux Toolkit, and Canvas, served by Vite.

- `apps/web/src/`: UI (`ui/`), game controller (`game/`), Redux controls (`store/`), and Canvas rendering (`render/`). Sprites live in `assets/`; asset registries live in `config/`.
- `packages/engine/`: browser-independent simulation, organized into `core/`, `systems/`, `models/`, `world/`, and public `api/`.
- Tests sit beside implementation files; shared deterministic fixtures live in `packages/engine/test/`.
- `docs/stabilisation.md`: simulation decisions and performance work. Root configuration coordinates both source trees.

## Build, Test, and Development Commands

Run commands from the repository root with Node 22, matching CI.

- `npm ci`: install dependencies from the lockfile.
- `npm run dev`: start Vite; use the URL printed in the terminal.
- `npm run build`: check TypeScript and generate `dist/`.
- `npm run preview`: serve the production build locally.
- `npm test` / `npm run test:watch`: run Vitest once or interactively.
- `npm run lint`: run ESLint, including React Hooks rules.
- `npm run check`: run lint, tests, and build; required before submitting code changes.
- `npm run benchmark`: run opt-in simulation/snapshot measurements; results are local references, not CI thresholds.

## Coding Style & Naming Conventions

Use strict TypeScript, explicit domain types, and type-only imports where appropriate. Prefer `@engine/` and `@web/` aliases. Name components, classes, and their files in PascalCase; functions and variables use camelCase. Follow surrounding indentation (commonly four spaces in engine code); retain local quote and semicolon conventions. ESLint is configured; no dedicated formatter is configured. Avoid unrelated formatting changes.

## Testing Guidelines

Use colocated `*.test.ts` files. Vitest defaults to Node; DOM interaction tests opt into `happy-dom`. Create a fresh fixed world per simulation scenario and use fake timers for lifecycle tests. Cover conservation, saturation, partial transfers, and network edits. For stateful changes, also run `npm test -- --sequence.shuffle --sequence.seed=42`. No numeric coverage threshold is configured.

## Simulation Invariants

Keep implicit conveyor junctions blocked: merging and splitting require explicit future entities. Preserve two-phase transfers and stable spatial priorities. Route structural world edits through engine commands so cached topology is invalidated. Keep rendering separate from simulation.

## Commit & Pull Request Guidelines

For new commit use the following pattern : type(scope): description  where type can be one of : feat, fix, hotfix, test, chore. Write understandable definition with clear explanation of any changes

When needed write also documentation in french for technical or design decision & plans