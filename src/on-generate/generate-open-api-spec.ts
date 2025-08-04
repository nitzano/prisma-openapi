import type {GeneratorOptions} from '@prisma/generator-helper';
import {OpenApiBuilder, type SchemaObject} from 'openapi3-ts/oas31';
import {generatePropertiesFromModel} from './generate-properties-from-model.js';
import {type PrismaOpenApiOptions} from './generator-options.js';

/**
 * Generate an OpenAPI specification object from Prisma models
 */
export function generateOpenApiSpec(
	filteredModels: GeneratorOptions['dmmf']['datamodel']['models'],
	enums: GeneratorOptions['dmmf']['datamodel']['enums'],
	options: PrismaOpenApiOptions,
): OpenApiBuilder {
	// Create base OpenAPI specification using OpenApiBuilder with proper chaining
	const builder = OpenApiBuilder.create().addOpenApiVersion('3.1.0').addInfo({
		title: options.title,
		description: options.description,
		version: '1.0.0',
	});

	// Create schemas for all filtered models
	for (const model of filteredModels) {
		const modelSchema: SchemaObject = {
			type: 'object',
			description: model.documentation,
			properties: generatePropertiesFromModel(model, filteredModels, enums),
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
