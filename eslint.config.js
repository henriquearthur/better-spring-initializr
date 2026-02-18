import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.output/**',
      '**/dist/**',
      '**/coverage/**',
      'src/routeTree.gen.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
    },
  },
  {
    files: ['src/{app,components,features,hooks,routes}/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/server/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@/server/features/*/infra/*',
            '@/server/features/*/domain/*',
            '@/components/workspace/*',
            '@/hooks/*',
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@/routes/*',
            '@/server/features/*/infra/*',
            '@/server/features/*/domain/*',
            '@/components/workspace/*',
            '@/hooks/*',
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@/routes/*',
            '@/features/*',
            '@/app/*',
            '@/server/*',
            '@/components/workspace/*',
            '@/hooks/*',
          ],
        },
      ],
    },
  },
]
