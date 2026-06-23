import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';

// Select the SSR adapter at build time. Cloudflare is the default; set
// DEPLOY_TARGET=node to build a standalone Node server for self-hosting.
const target = (process.env.DEPLOY_TARGET || 'cloudflare').toLowerCase();

const adapter =
  target === 'node'
    ? node({ mode: 'standalone' })
    : cloudflare({
        platformProxy: {
          enabled: true,
        },
      });

export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter,
  vite: {
    ssr: {
      // The MySQL driver and Node-only storage backend are used only by the
      // Node deployment. Keep them external so the Cloudflare worker bundle
      // never tries to resolve Node built-ins or mysql2.
      external:
        target === 'node'
          ? []
          : ['mysql2', 'mysql2/promise', 'node:fs/promises', 'node:path'],
    },
  },
});

