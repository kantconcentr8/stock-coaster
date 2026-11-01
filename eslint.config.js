import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Pure-sim boundary: no Phaser outside src/render and src/app wiring.
    files: ['src/sim/**', 'src/core/**', 'src/content/**', 'src/services/**', 'src/app.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'phaser', message: 'Phaser is only allowed in src/render and src/main.ts.' },
          ],
          patterns: ['phaser/*'],
        },
      ],
    },
  },
);
