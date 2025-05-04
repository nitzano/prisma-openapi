#!/usr/bin/env node

import {generatorHandler} from '@prisma/generator-helper';
import {onGenerate} from './on-generate.js';
import {onManifest} from './on-manifest.js';

generatorHandler({
	onManifest,
	onGenerate,
});
