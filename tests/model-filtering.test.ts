import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getDMMF} from '@prisma/internals';
import {type GeneratorOptions} from '@prisma/generator-helper';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import yaml from 'yaml';
import {onGenerate} from '../src/on-generate/on-generate.js';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Model filtering configuration', () => {
	const outputDirectory = path.join(__dirname, 'model-filtering-output');
	const outputPath = path.join(outputDirectory, 'openapi.yaml');

	// Set up and tear down the output directory for each test run
	beforeAll(() => {
		if (!fs.existsSync(outputDirectory)) {
			fs.mkdirSync(outputDirectory, {recursive: true});
		}
	});

	afterAll(() => {
		// Clean up generated files
		if (fs.existsSync(outputPath)) {
			fs.unlinkSync(outputPath);
		}

		if (fs.existsSync(outputDirectory)) {
			fs.rmdirSync(outputDirectory);
		}
	});

	// Helper function to create generator options
	const createGeneratorOptions = async (
		config: Record<string, unknown>,
	): Promise<GeneratorOptions> => {
		const schemaPath = path.join(__dirname, 'fixtures', 'simple.prisma');
		const schema = fs.readFileSync(schemaPath, 'utf8');
		const dmmf = await getDMMF({datamodel: schema});

		return {
			dmmf,
			datasources: [],
			schemaPath: '',
			datamodel: schema,
			version: '0.0.0',
			generator: {
				name: 'openapi',
				provider: {
					value: 'prisma-openapi',
					fromEnvVar: null,
				},
				output: {
					value: outputDirectory,
					fromEnvVar: null,
				},
				config,
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: schemaPath,
			},
			otherGenerators: [],
		};
	};

	// Helper function to get generated schemas
	const getGeneratedSchemas = (): Record<string, any> => {
		const generatedOpenApi = yaml.parse(
			fs.readFileSync(outputPath, 'utf8'),
		) as Record<string, any>;
		return (generatedOpenApi.components?.schemas as Record<string, any>) || {};
	};

	describe('includeModels configuration', () => {
		it('should include only specified models when includeModels is set', async () => {
			const options = await createGeneratorOptions({
				includeModels: 'User,Post',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include User and Post
			expect(schemas.User).toBeDefined();
			expect(schemas.Post).toBeDefined();

			// Should not include Profile (not in includeModels)
			expect(schemas.Profile).toBeUndefined();

			// Should still include Role enum since it's referenced by User
			expect(schemas.Role).toBeDefined();
		});

		it('should include only a single model when includeModels contains one model', async () => {
			const options = await createGeneratorOptions({
				includeModels: 'User',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include only User
			expect(schemas.User).toBeDefined();

			// Should not include other models
			expect(schemas.Post).toBeUndefined();
			expect(schemas.Profile).toBeUndefined();

			// Should still include Role enum since it's referenced by User
			expect(schemas.Role).toBeDefined();
		});

		it('should handle includeModels with whitespace around model names', async () => {
			const options = await createGeneratorOptions({
				includeModels: ' User , Post ',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include User and Post despite extra whitespace
			expect(schemas.User).toBeDefined();
			expect(schemas.Post).toBeDefined();

			// Should not include Profile
			expect(schemas.Profile).toBeUndefined();
		});

		it('should handle non-existent models in includeModels gracefully', async () => {
			const options = await createGeneratorOptions({
				includeModels: 'User,NonExistentModel',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include User
			expect(schemas.User).toBeDefined();

			// Should not include other models
			expect(schemas.Post).toBeUndefined();
			expect(schemas.Profile).toBeUndefined();

			// NonExistentModel should not cause any issues
			expect(schemas.NonExistentModel).toBeUndefined();
		});

		it('should include all models when includeModels is empty string', async () => {
			const options = await createGeneratorOptions({
				includeModels: '',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include all models when empty string
			expect(schemas.User).toBeDefined();
			expect(schemas.Post).toBeDefined();
			expect(schemas.Profile).toBeDefined();
			expect(schemas.Role).toBeDefined();
		});

		it('should include all models when includeModels is undefined', async () => {
			const options = await createGeneratorOptions({
				// IncludeModels not set
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include all models when not set
			expect(schemas.User).toBeDefined();
			expect(schemas.Post).toBeDefined();
			expect(schemas.Profile).toBeDefined();
			expect(schemas.Role).toBeDefined();
		});
	});

	describe('excludeModels configuration', () => {
		it('should exclude specified models when excludeModels is set', async () => {
			const options = await createGeneratorOptions({
				excludeModels: 'Profile',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include User and Post
			expect(schemas.User).toBeDefined();
			expect(schemas.Post).toBeDefined();

			// Should exclude Profile
			expect(schemas.Profile).toBeUndefined();

			// Should include Role enum
			expect(schemas.Role).toBeDefined();
		});

		it('should exclude multiple models when excludeModels contains multiple models', async () => {
			const options = await createGeneratorOptions({
				excludeModels: 'Profile,Post',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include User
			expect(schemas.User).toBeDefined();

			// Should exclude Profile and Post
			expect(schemas.Profile).toBeUndefined();
			expect(schemas.Post).toBeUndefined();

			// Should include Role enum
			expect(schemas.Role).toBeDefined();
		});

		it('should handle excludeModels with whitespace around model names', async () => {
			const options = await createGeneratorOptions({
				excludeModels: ' Profile , Post ',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include User
			expect(schemas.User).toBeDefined();

			// Should exclude Profile and Post despite extra whitespace
			expect(schemas.Profile).toBeUndefined();
			expect(schemas.Post).toBeUndefined();
		});

		it('should handle non-existent models in excludeModels gracefully', async () => {
			const options = await createGeneratorOptions({
				excludeModels: 'NonExistentModel',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include all models since NonExistentModel doesn't exist
			expect(schemas.User).toBeDefined();
			expect(schemas.Post).toBeDefined();
			expect(schemas.Profile).toBeDefined();
			expect(schemas.Role).toBeDefined();
		});

		it('should include all models when excludeModels is empty string', async () => {
			const options = await createGeneratorOptions({
				excludeModels: '',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include all models when empty string
			expect(schemas.User).toBeDefined();
			expect(schemas.Post).toBeDefined();
			expect(schemas.Profile).toBeDefined();
			expect(schemas.Role).toBeDefined();
		});
	});

	describe('Combined includeModels and excludeModels configuration', () => {
		it('should apply includeModels first, then excludeModels', async () => {
			const options = await createGeneratorOptions({
				includeModels: 'User,Post,Profile',
				excludeModels: 'Profile',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include User and Post (from includeModels)
			expect(schemas.User).toBeDefined();
			expect(schemas.Post).toBeDefined();

			// Should exclude Profile (from excludeModels)
			expect(schemas.Profile).toBeUndefined();

			// Should include Role enum since it's referenced by User
			expect(schemas.Role).toBeDefined();
		});

		it('should handle complex filtering scenario', async () => {
			const options = await createGeneratorOptions({
				includeModels: 'User,Post',
				excludeModels: 'Post',
			});

			await onGenerate(options);

			const schemas = getGeneratedSchemas();

			// Should include only User (Post is included then excluded)
			expect(schemas.User).toBeDefined();

			// Should exclude Post and Profile
			expect(schemas.Post).toBeUndefined();
			expect(schemas.Profile).toBeUndefined();

			// Should include Role enum since it's referenced by User
			expect(schemas.Role).toBeDefined();
		});
	});
});
