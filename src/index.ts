#!/usr/bin/env node

import generatorHelper from '@prisma/generator-helper';
import {onGenerate} from './on-generate/index.js';
import {onManifest} from './on-manifest.js';

const {generatorHandler} = generatorHelper;

// Initialize the generator handler with imported functions
generatorHandler({
	onManifest,
	onGenerate,
});

// Export using the same pattern
export {generatorHandler};
