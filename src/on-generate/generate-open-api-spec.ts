// Filepath: /home/nitzano/work/prisma-openapi/src/on-generate/generate-open-api-spec.ts
import type {GeneratorOptions} from '@prisma/generator-helper';
import {OpenApiBuilder, type SchemaObject} from 'openapi3-ts/oas31';
import {generatePropertiesFromModel} from './generate-properties-from-model.js';

/**
 * Generate an OpenAPI specification object from Prisma models
 */
export function generateOpenApiSpec(
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
