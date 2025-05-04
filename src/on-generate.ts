import * as fs from 'node:fs';
import * as path from 'node:path';
import {cwd} from 'node:process';
import type {GeneratorOptions} from '@prisma/generator-helper';
import {
	OpenApiBuilder,
	type ReferenceObject,
	type SchemaObject,
} from 'openapi3-ts/oas31';
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

/**
 * Generate an OpenAPI specification object from Prisma models
 */
function generateOpenApiSpec(
	models: GeneratorOptions['dmmf']['datamodel']['models'],
	enums: GeneratorOptions['dmmf']['datamodel']['enums'],
): OpenApiBuilder {
	// Create base OpenAPI specification using OpenApiBuilder with proper chaining
	const builder = OpenApiBuilder.create().addOpenApiVersion('3.1.0').addInfo({
		title: 'Prisma API',
		description: 'API generated from Prisma schema',
		version: '1.0.0',
	});

	// Create schemas for all models
	for (const model of models) {
		const modelSchema: SchemaObject = {
			type: 'object',
			properties: generatePropertiesFromModel(model, models, enums),
			required: model.fields
				.filter((field) => field.isRequired)
				.map((field) => field.name),
		};
		builder.addSchema(model.name, modelSchema);
	}

	// Add enum schemas
	for (const enumType of enums) {
		const enumSchema: SchemaObject = {
			type: 'string',
			enum: enumType.values.map((v) => v.name),
		};
		builder.addSchema(enumType.name, enumSchema);
	}

	return builder;
}

/**
 * Generate OpenAPI properties from a Prisma model
 */
function generatePropertiesFromModel(
	model: GeneratorOptions['dmmf']['datamodel']['models'][0],
	allModels: GeneratorOptions['dmmf']['datamodel']['models'],
	enums: GeneratorOptions['dmmf']['datamodel']['enums'],
): Record<string, SchemaObject | ReferenceObject> {
	const properties: Record<string, SchemaObject | ReferenceObject> = {};

	for (const field of model.fields) {
		let property: SchemaObject | ReferenceObject;

		// Handle different field types
		switch (field.kind) {
			case 'scalar': {
				// Map Prisma scalar types to OpenAPI types
				const scalarProperty: SchemaObject = {};
				switch (field.type) {
					case 'String': {
						scalarProperty.type = 'string';
						break;
					}

					case 'Int': {
						scalarProperty.type = 'integer';
						scalarProperty.format = 'int32';
						break;
					}

					case 'BigInt': {
						scalarProperty.type = 'integer';
						scalarProperty.format = 'int64';
						break;
					}

					case 'Float':
					case 'Decimal': {
						scalarProperty.type = 'number';
						scalarProperty.format = 'double';
						break;
					}

					case 'Boolean': {
						scalarProperty.type = 'boolean';
						break;
					}

					case 'DateTime': {
						scalarProperty.type = 'string';
						scalarProperty.format = 'date-time';
						break;
					}

					case 'Json': {
						scalarProperty.type = 'object';
						break;
					}

					case 'unsupported': {
						scalarProperty.type = 'string';
						scalarProperty.description = 'Unsupported type';
						break;
					}

					default: {
						scalarProperty.type = 'string';
						scalarProperty.description = 'Unknown type';
						break;
					}
				}

				property = scalarProperty;
				break;
			}

			case 'enum': {
				// Reference enum schema
				const enumProperty: ReferenceObject = {
					$ref: `#/components/schemas/${field.type}`,
				};

				property = enumProperty;
				break;
			}

			case 'object': {
				// Reference to another model
				const relatedModel = allModels.find((m) => m.name === field.type);
				if (relatedModel) {
					if (field.isList) {
						const listProperty: SchemaObject = {
							type: 'array',
							items: {
								$ref: `#/components/schemas/${field.type}`,
							},
						};
						property = listProperty;
					} else {
						const referenceProperty: ReferenceObject = {
							$ref: `#/components/schemas/${field.type}`,
						};
						property = referenceProperty;
					}
				} else {
					const unknownProperty: SchemaObject = {
						type: 'object',
						description: 'Unknown related model',
					};
					property = unknownProperty;
				}

				break;
			}

			default: {
				const defaultProperty: SchemaObject = {
					type: 'string',
					description: 'Unknown field kind',
				};
				property = defaultProperty;
			}
		}

		// Add description if available
		if (field.documentation && 'description' in property) {
			property.description = field.documentation;
		}

		properties[field.name] = property;
	}

	return properties;
}
