import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// import.meta.url (not __dirname): works under both Vite's legacy and "native" ESM config loaders.
const r = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

/**
 * Bundled library build (Rollup, via Vite's library mode) — one file per entry point, each
 * tree-shaken independently.
 *
 * Declarations are NOT generated here: `tsconfig.build.json`'s own separate `tsc
 * --emitDeclarationOnly` pass produces them (see `package.json`'s `build` script).
 */
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: r("src/index.ts"),
        test: r("src/test/index.ts"),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Real npm dependencies, never bundled into this package's own output.
      external: ["zod", "@sudobility/types"],
    },
    sourcemap: true,
    minify: false,
  },
});
