// ESLint for the whole repo. Type-aware rules use the TypeScript 6 API
// (`typescript` is aliased to @typescript/typescript6, because TypeScript 7
// has no API yet). See docs/decisions.md.
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['**/dist', '**/.mf', 'spike/**']),

  // TypeScript sources (apps and packages)
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Node scripts
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  // Must be last: turns off rules that clash with Prettier formatting.
  prettier,
])
