import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://marcuslchong.com',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
});
