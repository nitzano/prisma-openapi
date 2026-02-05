import {generateOpenApiSpec} from '../on-generate/generate-open-api-spec.js';
import {
	defaultOptions,
	parseCommaSeparatedList,
	type PrismaOpenApiOptions,
} from '../on-generate/generator-options.js';

export type PrismaOpenApiSchemaOptions = Partial<PrismaOpenApiOptions>;

async function generateOpenApiSchema(
	prismaSchema: string,
	options: PrismaOpenApiSchemaOptions = {},
): Promise<string> {
	if (!prismaSchema.trim()) {
		throw new Error('Prisma schema must be a non-empty string.');
	}

	// Handle CJS/ESM interop - @prisma/internals is CJS, exports may be on .default

	const prismaInternals: any = await import('@prisma/internals');
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const getDMMF = prismaInternals.default?.getDMMF ?? prismaInternals.getDMMF;

	const dmmf = await getDMMF({datamodel: prismaSchema});
	const prismaOpenApiOptions: PrismaOpenApiOptions = {
		...defaultOptions,
		...options,
	};

	let filteredModels = [...dmmf.datamodel.models];
	const includeModelsList = parseCommaSeparatedList(
		prismaOpenApiOptions.includeModels,
	);
	const excludeModelsList = parseCommaSeparatedList(
		prismaOpenApiOptions.excludeModels,
	);

	if (includeModelsList && includeModelsList.length > 0) {
		filteredModels = filteredModels.filter((model: any) =>
			includeModelsList.includes(model.name as string),
		);
	}

	if (excludeModelsList && excludeModelsList.length > 0) {
		filteredModels = filteredModels.filter(
			(model: any) => !excludeModelsList.includes(model.name as string),
		);
	}

	const openApiBuilder = generateOpenApiSpec(
		filteredModels,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		dmmf.datamodel.enums,
		prismaOpenApiOptions,
	);

	if (prismaOpenApiOptions.generateJson && !prismaOpenApiOptions.generateYaml) {
		return openApiBuilder.getSpecAsJson();
	}

	if (prismaOpenApiOptions.generateYaml) {
		return openApiBuilder.getSpecAsYaml();
	}

	return openApiBuilder.getSpecAsJson();
}

// Named export for ESM consumers
export {generateOpenApiSchema};

// Default export for CJS interop - handles cases where imports resolve to .default
const libExports = {generateOpenApiSchema};
export default libExports;
