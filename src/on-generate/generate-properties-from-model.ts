import type {GeneratorOptions} from '@prisma/generator-helper';
import {type ReferenceObject, type SchemaObject} from 'openapi3-ts/oas31';
import {isFieldIgnored} from './is-field-ignored.js';

/**
 * Map a Prisma scalar type to an OpenAPI schema object
 */
function mapScalarType(type: string): SchemaObject {
	switch (type) {
		case 'String': {
			return {type: 'string'};
		}

		case 'Int': {
			return {type: 'integer', format: 'int32'};
		}

		case 'BigInt': {
			return {type: 'integer', format: 'int64'};
		}

		case 'Float':
		case 'Decimal': {
			return {type: 'number', format: 'double'};
		}

		case 'Boolean': {
			return {type: 'boolean'};
		}

		case 'DateTime': {
			return {type: 'string', format: 'date-time'};
		}

		case 'Json': {
			return {type: 'object'};
		}

		case 'unsupported': {
			return {type: 'string', description: 'Unsupported type'};
		}

		default: {
			return {type: 'string', description: 'Unknown type'};
		}
	}
}

/**
 * Generate OpenAPI properties from a Prisma model
 */
export function generatePropertiesFromModel(
	model: GeneratorOptions['dmmf']['datamodel']['models'][0],
	allModels: GeneratorOptions['dmmf']['datamodel']['models'],
	enums: GeneratorOptions['dmmf']['datamodel']['enums'],
	excludeFields?: string[],
): Record<string, SchemaObject | ReferenceObject> {
	const properties: Record<string, SchemaObject | ReferenceObject> = {};

	for (const field of model.fields) {
		if (isFieldIgnored(model.name, field, excludeFields)) {
			continue;
		}

		let property: SchemaObject | ReferenceObject;

		// Handle different field types
		switch (field.kind) {
			case 'scalar': {
				const scalarProperty = mapScalarType(field.type);

				if (field.isList) {
					property = {
						type: 'array',
						items: scalarProperty,
					};
				} else {
					property = scalarProperty;
				}

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

			case 'unsupported': {
				const unsupportedProperty: SchemaObject = {
					type: 'string',
					description: 'Unsupported field kind',
				};
				property = unsupportedProperty;
				break;
			}
		}

		// Add description if available
		if (field.documentation && !('$ref' in property)) {
			// Convert literal \n to actual newlines for multiline support
			// Also trim any leading spaces after newlines
			property.description = field.documentation
				.replaceAll(String.raw`\n`, '\n')
				.replaceAll(/\n\s+/g, '\n');
		}

		properties[field.name] = property;
	}

	return properties;
}
