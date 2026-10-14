# CLAUDE.md — characterbuilder_types

Shared types + Zod schemas for CharacterBuilder. Layer 1 of five
(`types → api → client → lib → app`). Pure: no I/O, no clock, no platform code.

## Conventions (match screenwriter_types)
- **Zod first.** Define a schema, then `export type X = z.infer<typeof xSchema>`.
  Request/input shapes are schemas; pure response DTOs may be plain `interface`s.
- **ESM imports use the `.js` extension** (e.g. `from '../face/index.js'`), even
  from `.ts` source — required by `moduleResolution: bundler` + the build.
- **Import from the package root** (`@sudobility/characterbuilder_types`); test
  fixtures come from the `/test` subpath. `src/index.ts` re-exports every module.
- **Enums are exported twice:** a `readonly string[]` const (for UI menus and for
  `composePrompt` to iterate) and a `z.enum(...)` built from it. Keep them in sync.
- **FaceSpec fields are all optional** and the object is `.strict()` — unknown
  keys are rejected, unset features are left to the model.
- Build = `vite build` (bundles `index` + `test` entries, externalizing `zod` and
  `@sudobility/types`) **then** `tsc -p tsconfig.build.json` for `.d.ts` only.

## Don't
- Don't put business logic here (prompt composition lives in `characterbuilder_lib`).
- Don't add runtime dependencies beyond `zod` and `@sudobility/types`.
- Don't redefine the consumables ledger — re-export it from `@sudobility/types`.

## Source of truth for the feature catalog
`writings-chimps/prompts/face-variation-reference.md` (Parts 1–8). When adding a
feature, add its option array + enum here, then wire its prompt phrase in
`characterbuilder_lib` and its form control in `characterbuilder_app`.
