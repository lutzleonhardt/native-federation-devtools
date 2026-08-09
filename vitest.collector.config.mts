import { defineConfig } from 'vitest/config';

// Collector library tests — run in node (not jsdom): the passivity harness
// evaluates the fixed probe sources in `node:vm` sandboxes that model
// inspected pages, which is exactly the trust boundary the real
// DevTools-eval crossing has.
export default defineConfig({
  test: {
    include: ['projects/collector/src/**/*.spec.ts'],
    environment: 'node',
  },
});
