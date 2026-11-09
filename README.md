# @sudobility/characterbuilder_types

Shared TypeScript types and Zod schemas for **CharacterBuilder** — the single
source of truth imported by the backend (`characterbuilder_api`), the network
client (`characterbuilder_client`), the business logic (`characterbuilder_lib`),
and the web app (`characterbuilder_app`).

CharacterBuilder turns a structured **FaceSpec** (a comprehensive menu of facial
features — bone structure, eyes, nose, lips, skin, hair, ancestry, age, sex,
asymmetry) into a composed prompt and renders character images through
`shapeshyft_api`. This package defines that FaceSpec, the saved-Character CRUD
shapes, the generation request/response shapes, the credits/consumables shapes,
and the API envelope / routes.

This package is types + schemas only — there is no runtime, CLI, or service here.
It also ships a small amount of **pure, deterministic** logic (the casting engine
and a client-side prompt preview); everything is dependency-free apart from `zod`
and `@sudobility/types`.

## Layout
Every module is re-exported from the package root (`src/index.ts`); import from
there, never from a subpath (except the `/test` fixtures subpath).

- `src/face` — the comprehensive **FaceSpec** schema. Each feature is exported as
  both a `readonly string[]` (for UI menus) and a `z.enum` (for validation).
- `src/demographics` — demographic inputs (ancestry + free-text sub-population,
  sex, age, health, build) that **steer** the casting distribution. These are not
  facial features; they shift the odds of the features in a FaceSpec.
- `src/distribution` — the shapes the `/distributions` endpoint returns: a
  probability map per enum FaceSpec feature, which the caster samples from to fill
  any trait left unset (this is what defeats the "every AI face looks the same"
  collapse).
- `src/casting` — the **casting engine**: `Demographics → per-trait distributions
  → a complete, coherent FaceSpec`. Pure and seed-deterministic; shared by the
  backend (authoritative cast before generation) and the frontend (preview/odds).
- `src/specs` — saved **Character** record + create/update requests.
- `src/generation` — generate / compose requests, generation params, result
  images, generation records and statuses.
- `src/sheets` — the staged turnaround pipeline (head sheet → body sheet → clothed
  sheet), layered on top of single-image generation.
- `src/visual-styles` — the catalog of selectable visual looks (art styles),
  grouped for the picker. IDs are stable API values.
- `src/prompt` — pure, deterministic **client-side preview** of the composed
  prompt (`composePrompt`). The authoritative prose prompt is written server-side
  by ShapeShyft's `character-prompt` endpoint; this only approximates it so the
  editor can show something without a round-trip.
- `src/credits` — consumables re-exports, credit product catalog, purchase handoff.
- `src/me` — the `GET /me` profile + balance shape.
- `src/api` — response envelope + error codes, cursor pagination, route paths.
- `src/ids` — prefixed id helpers (`chr_`, `gen_`, `img_`).
- `src/test` — shared fixtures (`@sudobility/characterbuilder_types/test`).

## Install
`@sudobility/*` packages resolve from GitHub Packages, configured in `.npmrc`
(`@sudobility:registry=https://npm.pkg.github.com`). Authenticate to that registry
first (a GitHub token with `read:packages`), then:

```bash
bun install
```

`bun` is the package manager (`bun.lock` is committed).

## Scripts
```bash
bun run typecheck   # tsc --noEmit (type-check only, no emit)
bun run test:unit   # vitest run (one-shot); bun run test:watch to watch
bun run build       # vite build (ESM bundle) + tsc (.d.ts declarations) -> dist/
bun run lint        # eslint src
bun run format      # prettier --write src
bun run clean       # rimraf dist
```

Published to GitHub Packages by CI (`.github/workflows/ci-cd.yml`) on push to
`main`/`develop`.

Modeled on `screenwriter_types`. The feature catalog follows
`writings-chimps/prompts/face-variation-reference.md` (see also
`docs/facial-demographic-evidence.md`).
