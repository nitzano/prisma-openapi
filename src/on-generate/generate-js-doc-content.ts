import type {GeneratorOptions} from '@prisma/generator-helper';

/**
 * Generate JSDoc OpenAPI comments for Prisma models
 */
export function generateJsDocumentContent(
	models: GeneratorOptions['dmmf']['datamodel']['models'],
	filteredModels: GeneratorOptions['dmmf']['datamodel']['models'],
	enums: GeneratorOptions['dmmf']['datamodel']['enums'],
): string {
	// Create JSDoc OpenAPI content
	let jsDocumentContent = `/**
 * @openapi
 * components:
 *   schemas:
 */\n\n`;

	// Add schemas for models
	for (const model of filteredModels) {
		jsDocumentContent += `/**
 * @openapi
 * components:
 *   schemas:
 *     ${model.name}:
 *       type: object
 *       properties:
 *${generateModelProperties(model)}
 *       required:
 *${generateRequiredProperties(model)}
 */\n\n`;
	}

	// Add enum schemas
	for (const enumType of enums) {
		jsDocumentContent += `/**
 * @openapi
 * components:
 *   schemas:
 *     ${enumType.name}:
 *       type: string
 *       enum:
 *${generateEnumValues(enumType)}
 */\n\n`;
	}

	return jsDocumentContent;
}

/**
 * Generate model properties in JSDoc format
 */
function generateModelProperties(
	model: GeneratorOptions['dmmf']['datamodel']['models'][0],
): string {
	let properties = '';

	for (const field of model.fields) {
		let propertyType = '';

		// Handle different field types
		switch (field.kind) {
			case 'scalar': {
				switch (field.type) {
					case 'String': {
						propertyType = 'string';
						break;
					}

					case 'Int': {
						propertyType = 'integer';
						break;
					}

					case 'Float':
					case 'Decimal': {
						propertyType = 'number';
						break;
					}

					case 'Boolean': {
						propertyType = 'boolean';
						break;
					}

					case 'DateTime': {
						propertyType = 'string\\n *         format: date-time';
						break;
					}

					case 'Json': {
						propertyType = 'object';
						break;
					}

					default: {
						propertyType = 'string';
					}
				}

				break;
			}

			case 'enum': {
				propertyType = `\\n *         $ref: '#/components/schemas/${field.type}'`;
				break;
			}

			case 'object': {
				propertyType = field.isList
					? `array\\n *         items:\\n *           $ref: '#/components/schemas/${field.type}'`
					: `\\n *         $ref: '#/components/schemas/${field.type}'`;

				break;
			}

			default: {
				propertyType = 'string';
			}
		}

		// Add property description
		properties += ` *         ${field.name}:\\n *           type: ${propertyType}\n`;
	}

	return properties;
}

/**
 * Generate required properties in JSDoc format
 */
function generateRequiredProperties(
	model: GeneratorOptions['dmmf']['datamodel']['models'][0],
): string {
	const requiredFields = model.fields
		.filter((field) => field.isRequired)
		.map((field) => field.name);

	return requiredFields.map((field) => ` *         - ${field}`).join('\n');
}

/**
 * Generate enum values in JSDoc format
 */
function generateEnumValues(
	enumType: GeneratorOptions['dmmf']['datamodel']['enums'][0],
): string {
	return enumType.values.map((v) => ` *         - ${v.name}`).join('\n');
}
