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

describe('Prisma to OpenAPI generation', () => {
	const outputDirectory = path.join(__dirname, 'output');
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

	it('generates an OpenAPI schema from a simple Prisma schema', async () => {
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
			datamodel: schema, // Add the schema content as datamodel
			version: '0.0.0', // Add a version string
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
				config: {},
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

		// Basic validation of OpenAPI spec
		expect(generatedOpenApi).toBeDefined();
		expect(generatedOpenApi.openapi).toBe('3.1.0');
		expect(generatedOpenApi.info).toBeDefined();
		expect(generatedOpenApi.info.title).toBe('Prisma API');

		// Check for our models in the components schemas section
		expect(generatedOpenApi.components?.schemas).toBeDefined();
		const schemas = generatedOpenApi.components.schemas as Record<string, any>;
		expect(schemas.User).toBeDefined();
		expect(schemas.Post).toBeDefined();
		expect(schemas.Profile).toBeDefined();
		expect(schemas.Role).toBeDefined();

		// Check specific properties of models
		const userSchema = schemas.User as Record<string, any>;
		expect(userSchema.type).toBe('object');
		expect(userSchema.properties).toBeDefined();
		expect(userSchema.properties.id).toBeDefined();
		expect(userSchema.properties.email).toBeDefined();
		expect(userSchema.properties.role.$ref).toBe('#/components/schemas/Role');

		// Check enum
		const roleSchema = schemas.Role as Record<string, any>;
		expect(roleSchema.type).toBe('string');
		expect(roleSchema.enum).toContain('USER');
		expect(roleSchema.enum).toContain('ADMIN');

		// Check relationships
		expect(userSchema.properties.posts.type).toBe('array');
		expect(userSchema.properties.posts.items.$ref).toBe(
			'#/components/schemas/Post',
		);
		expect(userSchema.properties.profile.$ref).toBe(
			'#/components/schemas/Profile',
		);
	});
});

describe('Custom output directory', () => {
	// Use test directories under the test folder to avoid permission issues
	const testBaseDirectory = path.join(__dirname, 'temp');
	const customOutputDirectory = path.join(testBaseDirectory, 'custom-output');
	const configOutputDirectory = path.join(testBaseDirectory, 'config-output');

	// Clean up directories before and after tests
	beforeAll(() => {
		// Create base test directory if it doesn't exist
		if (!fs.existsSync(testBaseDirectory)) {
			fs.mkdirSync(testBaseDirectory, {recursive: true});
		}
	});

	afterAll(() => {
		// Clean up test directories
		if (fs.existsSync(customOutputDirectory)) {
			fs.rmSync(customOutputDirectory, {recursive: true, force: true});
		}

		if (fs.existsSync(configOutputDirectory)) {
			fs.rmSync(configOutputDirectory, {recursive: true, force: true});
		}

		if (fs.existsSync(testBaseDirectory)) {
			fs.rmSync(testBaseDirectory, {recursive: true, force: true});
		}
	});

	it('supports custom output directory from options', async () => {
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
					value: customOutputDirectory,
					fromEnvVar: null,
				},
				config: {
					// Also include output in config to verify it's not used when generator.output is present
					output: configOutputDirectory,
				} satisfies Record<string, unknown>,
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: schemaPath,
			},
			otherGenerators: [],
		};

		// Generate OpenAPI spec
		await onGenerate(options);

		// Verify that the YAML file was written to the custom directory
		const expectedYamlPath = path.join(customOutputDirectory, 'openapi.yaml');
		expect(fs.existsSync(expectedYamlPath)).toBe(true);

		// Verify the content of the YAML file
		const generatedOpenApi = yaml.parse(
			fs.readFileSync(expectedYamlPath, 'utf8'),
		) as Record<string, unknown>;
		expect(generatedOpenApi).toBeDefined();
		expect(generatedOpenApi.openapi).toBe('3.1.0');

		// Verify config output directory was not used
		const configYamlPath = path.join(configOutputDirectory, 'openapi.yaml');
		expect(fs.existsSync(configYamlPath)).toBe(false);
	});

	it('falls back to config output when generator output is not provided', async () => {
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
				output: null, // No generator.output
				config: {
					output: configOutputDirectory,
				} satisfies Record<string, unknown>,
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: schemaPath,
			},
			otherGenerators: [],
		};

		// Generate OpenAPI spec
		await onGenerate(options);

		// Verify that the YAML file was written to the config directory
		const expectedYamlPath = path.join(configOutputDirectory, 'openapi.yaml');
		expect(fs.existsSync(expectedYamlPath)).toBe(true);

		// Verify the content of the YAML file
		const generatedOpenApi = yaml.parse(
			fs.readFileSync(expectedYamlPath, 'utf8'),
		) as Record<string, unknown>;
		expect(generatedOpenApi).toBeDefined();
		expect(generatedOpenApi.openapi).toBe('3.1.0');
	});
});
