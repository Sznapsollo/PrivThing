import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['build', 'coverage', 'node_modules'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['src/**/*.{ts,tsx,js}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: { ...globals.browser, ...globals.node }
        },
        plugins: {
            'react-hooks': reactHooks
        },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
            'no-var': 'warn',
            'prefer-const': 'warn',
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-case-declarations': 'warn',
            'no-extra-boolean-cast': 'warn'
        }
    }
);
