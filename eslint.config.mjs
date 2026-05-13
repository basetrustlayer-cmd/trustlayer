import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/.next/**',
      '**/next-env.d.ts',
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended
];
