// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';
import tailwindcss from '@tailwindcss/vite';

// expressive-code must come before mdx
export default defineConfig({
  output: 'static',
  integrations: [
    expressiveCode({ themes: ['github-dark', 'github-light'] }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind-ui.js'],
      },
    },
  },
});
