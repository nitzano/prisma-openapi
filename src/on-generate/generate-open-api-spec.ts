import type {GeneratorOptions} from '@prisma/generator-helper';
import {OpenApiBuilder, type SchemaObject} from 'openapi3-ts/oas31';
import {generatePropertiesFromModel} from './generate-properties-from-model.js';
import {
	type PrismaOpenApiOptions,
	parseCommaSeparatedList,
} from './generator-options.js';

/**
 * Generate an OpenAPI specification object from Prisma models
 */
export function generateOpenApiSpec(
	models: GeneratorOptions['dmmf']['datamodel']['models'],
	enums: GeneratorOptions['dmmf']['datamodel']['enums'],
	options: PrismaOpenApiOptions,
): OpenApiBuilder {
	// Create base OpenAPI specification using OpenApiBuilder with proper chaining
	const builder = OpenApiBuilder.create().addOpenApiVersion('3.1.0').addInfo({
		title: options.title,
		description: options.description,
		version: '1.0.0',
	});

	// Filter models based on includeModels and excludeModels options
	let filteredModels = [...models];

	// Apply includeModels filter if provided
	const includeModelsList = parseCommaSeparatedList(options.includeModels);
	if (includeModelsList && includeModelsList.length > 0) {
		filteredModels = filteredModels.filter((model) =>
			includeModelsList.includes(model.name),
		);
	}

	// Apply excludeModels filter if provided
	const excludeModelsList = parseCommaSeparatedList(options.excludeModels);
	if (excludeModelsList && excludeModelsList.length > 0) {
		filteredModels = filteredModels.filter(
			(model) => !excludeModelsList.includes(model.name),
		);
	}

	// Create schemas for all filtered models
	for (const model of filteredModels) {
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
