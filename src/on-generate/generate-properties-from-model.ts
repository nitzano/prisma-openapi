import type {GeneratorOptions} from '@prisma/generator-helper';
import {type ReferenceObject, type SchemaObject} from 'openapi3-ts/oas31';

/**
 * Generate OpenAPI properties from a Prisma model
 */
export function generatePropertiesFromModel(
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
