// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', '.angular/**', 'node_modules/**', 'coverage/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],

      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: { constructors: 'no-public' },
        },
      ],

      '@typescript-eslint/naming-convention': [
        'error',

        // Interfaces: PascalCase with mandatory I prefix
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: true },
        },

        // Classes, type aliases, enums, type params
        { selector: 'class', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
        { selector: 'typeParameter', format: ['PascalCase'] },

        // Module-level const: allow UPPER_CASE for primitive constants and camelCase/PascalCase for objects/functions
        {
          selector: 'variable',
          modifiers: ['const', 'global'],
          format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
        },
        // Other variables
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },

        // Static readonly class fields = UPPER_CASE
        {
          selector: 'classProperty',
          modifiers: ['static', 'readonly'],
          format: ['UPPER_CASE'],
        },

        // Private members get _ prefix
        {
          selector: ['classProperty', 'classMethod', 'accessor'],
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
        // Protected members no _ prefix (templates access protected fields directly)
        {
          selector: ['classProperty', 'classMethod', 'accessor'],
          modifiers: ['protected'],
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
        },
        // Public members no _ prefix
        {
          selector: ['classProperty', 'classMethod', 'accessor'],
          modifiers: ['public'],
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
        },

        // Parameters: camelCase, allow leading _ for unused
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },

        // Object literal keys: allow anything (API payloads, JSON, etc.)
        {
          selector: ['objectLiteralProperty', 'objectLiteralMethod'],
          format: null,
        },

        // Functions
        { selector: 'function', format: ['camelCase'] },
      ],

      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
