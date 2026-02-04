import { build } from 'esbuild';

await build({
	entryPoints: ['src/lib/index.ts'],
	bundle: true,
	format: 'esm',
	platform: 'node',
	target: 'node22',
	outfile: 'dist/lib/index.js',
});
