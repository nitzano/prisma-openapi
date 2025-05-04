import type { GeneratorOptions } from '@prisma/generator-helper';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { cwd } from 'process';
import logger from './services/logger.js';

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
		const openApiSpec = generateOpenApiSpec(dmmf.datamodel.models, dmmf.datamodel.enums);
		
		// Write the OpenAPI spec to a file
		const outputDirectory = options.generator.output?.value ?? cwd();
		const outputPath = path.join(outputDirectory, 'openapi.yaml');
		
		// Ensure output directory exists
		const outputDirectoryPath = path.dirname(outputPath);
		if (!fs.existsSync(outputDirectoryPath)) {
			fs.mkdirSync(outputDirectoryPath, { recursive: true });
			logger.debug(`Created output directory: ${outputDirectoryPath}`);
		}
		
		fs.writeFileSync(outputPath, yaml.dump(openApiSpec, { indent: 2 }));
		
		logger.info(`OpenAPI specification written to ${outputPath}`);
		logger.info('OpenAPI generation completed successfully');
	} catch (error) {
		logger.error(
			`OpenAPI generation failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
}

/**
 * Generate an OpenAPI specification object from Prisma models
 */
function generateOpenApiSpec(
	models: GeneratorOptions['dmmf']['datamodel']['models'],
	enums: GeneratorOptions['dmmf']['datamodel']['enums']
) {
	// Create base OpenAPI specification
	const openApiSpec: {
		openapi: string;
		info: {
			title: string;
			description: string;
			version: string;
		};
		components: {
			schemas: Record<string, unknown>;
		};
	} = {
		openapi: '3.1.0',
		info: {
			title: 'Prisma API',
			description: 'API generated from Prisma schema',
			version: '1.0.0',
		},
		components: {
			schemas: {} as Record<string, unknown>,
		},
	};

	// Create schemas for all models
	for (const model of models) {
		openApiSpec.components.schemas[model.name] = {
			type: 'object',
			properties: generatePropertiesFromModel(model, models, enums),
			required: model.fields
				.filter(field => field.isRequired)
				.map(field => field.name),
			};
	}
	
	// Add enum schemas
	for (const enumType of enums) {
		openApiSpec.components.schemas[enumType.name] = {
			type: 'string',
			enum: enumType.values.map(v => v.name),
		};
	}

	return openApiSpec;
}

/**
 * Generate OpenAPI properties from a Prisma model
 */
function generatePropertiesFromModel(
	model: GeneratorOptions['dmmf']['datamodel']['models'][0],
	allModels: GeneratorOptions['dmmf']['datamodel']['models'],
	enums: GeneratorOptions['dmmf']['datamodel']['enums']
) {
	const properties: Record<string, unknown> = {};

	for (const field of model.fields) {
		let property: Record<string, unknown> = {};

		// Handle different field types
		if (field.kind === 'scalar') {
			// Map Prisma scalar types to OpenAPI types
			switch (field.type as string) {
				case 'String':
					property.type = 'string';
					break;
				case 'Int':
					property.type = 'integer';
					property.format = 'int32';
					break;
				case 'BigInt':
					property.type = 'integer';
					property.format = 'int64';
					break;
				case 'Float':
				case 'Decimal':
					property.type = 'number';
					property.format = 'double';
					break;
				case 'Boolean':
					property.type = 'boolean';
					break;
				case 'DateTime':
					property.type = 'string';
					property.format = 'date-time';
					break;
				case 'Json':
					property.type = 'object';
					break;
				case 'unsupported':
					property.type = 'string';
					property.description = 'Unsupported type';
					break;
				default:
					property.type = 'string';
					property.description = 'Unknown type';
					break;
			}
		} else if (field.kind === 'enum') {
			// Reference enum schema
			property = { $ref: `#/components/schemas/${field.type}` };
		} else if (field.kind === 'object') {
			// Reference to another model
			const relatedModel = allModels.find(m => m.name === field.type);
			if (relatedModel) {
				if (field.isList) {
					property.type = 'array';
					property.items = { $ref: `#/components/schemas/${field.type}` };
				} else {
					property = { $ref: `#/components/schemas/${field.type}` };
				}
			}
		}

		// Add description if available
		if (field.documentation) {
			property.description = field.documentation;
		}

		properties[field.name] = property as Record<string, unknown>;
	}

	return properties;
}
