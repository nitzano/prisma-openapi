const openapiIgnoreTag = '@openapi.ignore';

/**
 * Check if a field should be ignored in OpenAPI generation.
 * A field is ignored if:
 * 1. Its documentation contains @openapi.ignore
 * 2. It is listed in the excludeFields option (as "ModelName.fieldName")
 */
export function isFieldIgnored(
	modelName: string,
	field: {name: string; documentation?: string | undefined},
	excludeFields?: string[],
): boolean {
	if (field.documentation?.includes(openapiIgnoreTag)) {
		return true;
	}

	if (excludeFields?.includes(`${modelName}.${field.name}`)) {
		return true;
	}

	return false;
}

/**
 * Strip the @openapi.ignore tag from documentation so it doesn't leak into descriptions
 */
export function cleanDocumentation(documentation: string): string {
	return documentation.replace(openapiIgnoreTag, '').trim();
}
