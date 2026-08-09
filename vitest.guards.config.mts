import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Workspace-level structural guards (privacy scan, bridge boundary) — run in
// node so they can read the tree; Angular unit tests run via `ng test`.
export default defineConfig({
  resolve: {
    // The export guard imports devtools-ui sources, which import from the
    // 'devtools-bridge' path mapping — mirror that mapping for vitest.
    alias: {
      'devtools-bridge': fileURLToPath(
        new URL('./projects/devtools-bridge/src/public-api.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['guards/**/*.spec.ts'],
    environment: 'node',
  },
});
