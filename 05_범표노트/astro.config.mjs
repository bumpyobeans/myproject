import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bumpyobeans.shop',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
