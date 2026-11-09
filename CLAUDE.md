# CLAUDE.md — characterbuilder_types

Shared TypeScript types + Zod schemas for **CharacterBuilder**, Layer 1 of five
(`types → api → client → lib → app`). Also holds a little **pure, deterministic**
logic (casting engine, client-side prompt preview). Allowed: pure functions,
schemas. Forbidden: I/O, clock/`Date.now()`, env, any platform code.

## Stack
TypeScript (ESM, `moduleResolution: bundler`, `strict` + `noUncheckedIndexedAccess`),
Zod 4, Vite library mode (bundle) + `tsc` (declarations), Vitest, ESLint + Prettier.
`bun` is the package manager (`bun.lock` committed). Node-only runtime deps: `zod`,
`@sudobility/types`.

## Commands (all verified)
```bash
bun run typecheck   # tsc --noEmit
bun run test:unit   # vitest run  (103 tests, 5 files)
bun run lint        # eslint src
bun run format      # prettier --write src
bun run build       # vite build THEN tsc -p tsconfig.build.json -> dist/
```
Build is two passes: `vite build` emits the ESM bundle (`index.js`, `test.js`,
externalizing `zod` + `@sudobility/types`); the separate `tsc` pass emits **only**
`.d.ts`. Don't expect `tsc` to emit JS — `tsconfig.json` has `noEmit`.

## Conventions
- **Zod first.** Define a schema, then `export type X = z.infer<typeof xSchema>`.
  Request/input shapes are schemas; pure response DTOs may be plain `interface`s.
- **ESM imports use the `.js` extension** (e.g. `from '../face/index.js'`) even in
  `.ts` source — required by `bundler` resolution + the build.
- **Import from the package root** (`@sudobility/characterbuilder_types`), never a
  deep subpath. Test fixtures come from the `/test` subpath. `src/index.ts`
  re-exports every module — add a new module's export line there.
- **Enums are exported twice:** a `readonly string[]` const (for UI menus and for
  iteration) AND a `z.enum(...)` built from that same array. Keep them in sync.
- **FaceSpec fields are all optional** and the object is `.strict()` — unknown keys
  are rejected; unset features are cast (not left to the model's attractive mean).

## Architecture notes
- **`src/casting` is the differentiator.** `Demographics → per-trait distributions
  (`src/distribution`) → a complete coherent FaceSpec`. Pure + seed-deterministic
  (`mulberry32`/`hashSeed`), so the backend's authoritative cast and the frontend's
  preview agree. Weights live in `casting/weights.ts`; ancestry blending in
  `casting/ancestry.ts`.
- **`src/prompt` (`composePrompt`) is a PREVIEW only.** The authoritative prose
  prompt is generated server-side by ShapeShyft's `character-prompt` endpoint; this
  local approximation omits "neutral" values for readability. Don't treat it as the
  real prompt.
- `src/api/routes.ts` `ROUTES` is the single source of route paths — the client
  must not hard-code its own.

## Don't
- No runtime deps beyond `zod` and `@sudobility/types`.
- Don't redefine the consumables ledger — re-export it from `@sudobility/types`
  (see `src/credits`).
- Don't add I/O or platform code (see top). Prompt *composition for generation*
  (the real pipeline) stays server-side, not here.

## Feature-catalog source of truth
`writings-chimps/prompts/face-variation-reference.md` (Parts 1–8), plus
`docs/facial-demographic-evidence.md`. Adding a feature: add its option array +
enum in `src/face`, then wire its prompt phrase (`characterbuilder_lib` / ShapeShyft)
and its form control in `characterbuilder_app`.
