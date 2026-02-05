import {generateOpenApiSpec} from '../on-generate/generate-open-api-spec.js';
import {
	defaultOptions,
	parseCommaSeparatedList,
	type PrismaOpenApiOptions,
} from '../on-generate/generator-options.js';

export type PrismaOpenApiSchemaOptions = Partial<PrismaOpenApiOptions>;

export async function generateOpenApiSchema(
	prismaSchema: string,
	options: PrismaOpenApiSchemaOptions = {},
): Promise<string> {
	if (!prismaSchema.trim()) {
		throw new Error('Prisma schema must be a non-empty string.');
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const {getDMMF} = await import('@prisma/internals');
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
		filteredModels = filteredModels.filter((model) =>
			includeModelsList.includes(model.name),
		);
	}

	if (excludeModelsList && excludeModelsList.length > 0) {
		filteredModels = filteredModels.filter(
			(model) => !excludeModelsList.includes(model.name),
		);
	}

	const openApiBuilder = generateOpenApiSpec(
		filteredModels,
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
