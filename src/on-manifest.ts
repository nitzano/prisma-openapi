import logger from './services/logger.js';

/**
 * Handler for generating the manifest
 */
export function onManifest() {
	logger.info('Prisma OpenAPI generator manifest');
	return {
		name: 'prisma-openapi',
		defaultOutput: './openapi',
		prettyName: 'Prisma OpenAPI',
	};
}
