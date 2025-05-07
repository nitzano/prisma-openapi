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

describe('Title Configuration', () => {
	const outputDirectory = path.join(__dirname, 'title-test-output');
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

	it('uses default title when not specified in config', async () => {
		// Load the test schema file
		const schemaPath = path.join(__dirname, 'fixtures', 'simple.prisma');
		const schema = fs.readFileSync(schemaPath, 'utf8');

		// Parse the schema using Prisma's internals
		const dmmf = await getDMMF({datamodel: schema});

		// Create mock generator options required by onGenerate
		const options: GeneratorOptions = {
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
				config: {}, // Empty config means default title should be used
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: schemaPath,
			},
			otherGenerators: [],
		};

		// Generate OpenAPI spec
		await onGenerate(options);

		// Check if the file was created
		expect(fs.existsSync(outputPath)).toBe(true);

		// Read and parse the generated YAML file
		const generatedOpenApi = yaml.parse(
			fs.readFileSync(outputPath, 'utf8'),
		) as Record<string, any>;

		// Verify the default title is used
		expect(generatedOpenApi.info.title).toBe('Prisma API');
	});

	it('uses custom title when specified in config', async () => {
		const customTitle = 'My Custom API Title';

		// Load the test schema file
		const schemaPath = path.join(__dirname, 'fixtures', 'simple.prisma');
		const schema = fs.readFileSync(schemaPath, 'utf8');

		// Parse the schema using Prisma's internals
		const dmmf = await getDMMF({datamodel: schema});

		// Create mock generator options with custom title
		const options: GeneratorOptions = {
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
				config: {
					title: customTitle, // Set custom title in config
				},
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: schemaPath,
			},
			otherGenerators: [],
		};

		// Generate OpenAPI spec
		await onGenerate(options);

		// Check if the file was created
		expect(fs.existsSync(outputPath)).toBe(true);

		// Read and parse the generated YAML file
		const generatedOpenApi = yaml.parse(
			fs.readFileSync(outputPath, 'utf8'),
		) as Record<string, any>;

		// Verify the custom title is used
		expect(generatedOpenApi.info.title).toBe(customTitle);
	});
});
