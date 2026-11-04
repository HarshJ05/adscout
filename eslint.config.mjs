import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
  {
    rules: {
      // Scraper output is untyped JSON, so `any` is used on purpose in a few places.
      '@typescript-eslint/no-explicit-any': 'off',
      // Ad images come from Facebook's CDN with changing URLs; next/image would need every host allow-listed.
      '@next/next/no-img-element': 'off',
    },
  },
]);
