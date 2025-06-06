import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
		globals: true,
		typecheck: {
			tsconfig: './tsconfig.test.json',
		},
	},
});
