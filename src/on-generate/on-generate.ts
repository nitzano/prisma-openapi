import * as fs from 'node:fs';
import * as path from 'node:path';
import {cwd} from 'node:process';
import type {GeneratorOptions} from '@prisma/generator-helper';
import logger from '../services/logger.js';
import {generateOpenApiSpec} from './generate-open-api-spec.js';
import {
	type PrismaOpenApiOptions,
	defaultOptions,
} from './generator-options.js';

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

		// Merge default options with the ones provided in the schema
		const generatorConfig = options.generator
			.config as Partial<PrismaOpenApiOptions>;
		const prismaOpenApiOptions: PrismaOpenApiOptions = {
			...defaultOptions,
			...generatorConfig,
		};

		// Generate OpenAPI specification
		const openApiBuilder = generateOpenApiSpec(
			dmmf.datamodel.models,
			dmmf.datamodel.enums,
			prismaOpenApiOptions,
		);

		// Write the OpenAPI spec to a file
		const outputDirectory =
			options.generator.output?.value ?? prismaOpenApiOptions.output ?? cwd();

		// Ensure output directory exists
		if (!fs.existsSync(outputDirectory)) {
			fs.mkdirSync(outputDirectory, {recursive: true});
			logger.debug(`Created output directory: ${outputDirectory}`);
		}

		// Write YAML file if enabled
		if (prismaOpenApiOptions.generateYaml) {
			const yamlPath = path.join(outputDirectory, 'openapi.yaml');
			const yamlContent = openApiBuilder.getSpecAsYaml();
			fs.writeFileSync(yamlPath, yamlContent);
			logger.info(`OpenAPI YAML specification written to ${yamlPath}`);
		}

		// Write JSON file if enabled
		if (prismaOpenApiOptions.generateJson) {
			const jsonPath = path.join(outputDirectory, 'openapi.json');
			const jsonContent = openApiBuilder.getSpecAsJson();
			fs.writeFileSync(jsonPath, jsonContent);
			logger.info(`OpenAPI JSON specification written to ${jsonPath}`);
		}

		logger.info('OpenAPI generation completed successfully');
	} catch (error) {
		logger.error(
			`OpenAPI generation failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
}
