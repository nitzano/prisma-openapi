import {generatorHandler} from '@prisma/generator-helper';
import logger from './services/logger.js';

// Initialize the generator handler with logger
generatorHandler({
	onManifest() {
		logger.info('Prisma OpenAPI generator manifest');
		return {
			name: 'prisma-openapi',
			defaultOutput: './openapi',
			prettyName: 'Prisma OpenAPI',
		};
	},
	async onGenerate(options) {
		logger.info('Starting OpenAPI generation...');
		try {
			// Implementation for OpenAPI generation would go here
			logger.info('OpenAPI generation completed successfully');
		} catch (error) {
			logger.error(
				`OpenAPI generation failed: ${error instanceof Error ? error.message : String(error)}`,
			);
			throw error;
		}
	},
});

export {generatorHandler} from '@prisma/generator-helper';
