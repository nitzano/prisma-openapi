import {generatorHandler} from '@prisma/generator-helper';
import {onGenerate} from './on-generate.js';
import {onManifest} from './on-manifest.js';

// Initialize the generator handler with imported functions
generatorHandler({
	onManifest,
	onGenerate,
});

export {generatorHandler} from '@prisma/generator-helper';
