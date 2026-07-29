import { defineConfig } from 'vitest/config';

// Workspace-level structural guards (privacy scan, bridge boundary) — run in
// node so they can read the tree; Angular unit tests run via `ng test`.
export default defineConfig({
  test: {
    include: ['guards/**/*.spec.ts'],
    environment: 'node',
  },
});
