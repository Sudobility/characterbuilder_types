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

## Layout
- `src/face` — the comprehensive **FaceSpec** schema. Each feature is exported as
  both a `readonly string[]` (for UI menus) and a `z.enum` (for validation).
- `src/specs` — saved **Character** record + create/update requests.
- `src/generation` — generate / compose requests, generation params, result
  images, generation records and statuses.
- `src/credits` — consumables re-exports, credit product catalog, purchase handoff.
- `src/me` — the `GET /me` profile + balance shape.
- `src/api` — response envelope + error codes, cursor pagination, route paths.
- `src/ids` — prefixed id helpers (`chr_`, `gen_`, `img_`).
- `src/test` — shared fixtures (`@sudobility/characterbuilder_types/test`).

## Scripts
```bash
bun install
bun run typecheck   # tsc --noEmit
bun run test:unit   # vitest
bun run build       # vite (bundle) + tsc (declarations) -> dist/
bun run lint        # eslint + prettier
```

Modeled on `screenwriter_types`. The feature catalog follows
`writings-chimps/prompts/face-variation-reference.md`.
