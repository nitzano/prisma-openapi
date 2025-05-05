import * as fs from 'node:fs';
import * as path from 'node:path';
import {cwd} from 'node:process';
import type {GeneratorOptions} from '@prisma/generator-helper';
import logger from '../services/logger.js';
import {generateOpenApiSpec} from './generate-open-api-spec.js';

/**
 * Handler for generating the OpenAPI spec
 */
export async function onGenerate(options: GeneratorOptions) {
	logger.info('Starting OpenAPI generation...');
	try {
		// Log all models in the Prisma schema
		const dmmf = options.dmmf;
		logger.debug(
			`Found ${dmmf.datamodel.models.length} models in Prisma schema`,
		);

		for (const model of dmmf.datamodel.models) {
			logger.debug(`Model: ${model.name}`);
		}

		// Generate OpenAPI specification
		const openApiBuilder = generateOpenApiSpec(
			dmmf.datamodel.models,
			dmmf.datamodel.enums,
		);

		// Write the OpenAPI spec to a file
		const outputDirectory = options.generator.output?.value ?? cwd();
		const outputPath = path.join(outputDirectory, 'openapi.yaml');

		// Ensure output directory exists
		const outputDirectoryPath = path.dirname(outputPath);
		if (!fs.existsSync(outputDirectoryPath)) {
			fs.mkdirSync(outputDirectoryPath, {recursive: true});
			logger.debug(`Created output directory: ${outputDirectoryPath}`);
		}

		// Get spec as YAML and write to file
		const yamlContent = openApiBuilder.getSpecAsYaml();
		fs.writeFileSync(outputPath, yamlContent);

		logger.info(`OpenAPI specification written to ${outputPath}`);
		logger.info('OpenAPI generation completed successfully');
	} catch (error) {
		logger.error(
			`OpenAPI generation failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
}
