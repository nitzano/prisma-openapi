/**
 * Type definition for Prisma OpenAPI generator options
 */
export type PrismaOpenApiOptions = {
	/**
	 * Output directory for OpenAPI schema
	 * @default "./openapi"
	 */
	output: string;

	/**
	 * API title in OpenAPI spec
	 * @default Project name from package.json
	 */
	title: string;

	/**
	 * API description in OpenAPI spec
	 * @default ""
	 */
	description: string;

	/**
	 * Comma-separated list of models to include
	 * @default undefined (all models)
	 */
	includeModels?: string;

	/**
	 * Comma-separated list of models to exclude
	 * @default undefined (none)
	 */
	excludeModels?: string;

	/**
	 * Generate YAML format
	 * @default true
	 */
	generateYaml: boolean;

	/**
	 * Generate JSON format
	 * @default false
	 */
	generateJson: boolean;

	/**
	 * Include JSDoc comments in the schema
	 * @default false
	 */
	generateJsDoc: boolean;
};

/**
 * Default options for the OpenAPI generator
 */
export const defaultOptions: PrismaOpenApiOptions = {
	output: './openapi',
	title: 'Prisma API',
	description: '',
	generateYaml: true,
	generateJson: false,
	generateJsDoc: false,
};

/**
 * Parse comma-separated list into an array of strings
 * @param list Comma-separated list of items
 * @returns Array of trimmed strings or undefined if input is undefined
 */
export function parseCommaSeparatedList(list?: string): string[] | undefined {
	if (!list) {
		return undefined;
	}

	return list.split(',').map((item) => item.trim());
}
