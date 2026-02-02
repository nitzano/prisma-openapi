import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {getDMMF} from '@prisma/internals';
import type {GeneratorOptions} from '@prisma/generator-helper';
import {type OpenAPIObject, type SchemaObject} from 'openapi3-ts/oas31';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import yaml from 'yaml';
import {onGenerate} from '../src/on-generate/on-generate.js';

describe('Scalar arrays support', () => {
	let outputDirectory: string;

	// Create a temp directory before each test
	beforeEach(() => {
		// Create a unique temporary directory for each test
		outputDirectory = fs.mkdtempSync(
			path.join(os.tmpdir(), 'prisma-openapi-test-'),
		);
	});

	// Clean up after each test
	afterEach(() => {
		if (fs.existsSync(outputDirectory)) {
			fs.rmSync(outputDirectory, {recursive: true, force: true});
		}
	});

	it('should generate array types for scalar array fields', async () => {
		// Define schema with scalar array fields
		const schema = `
			datasource db {
				provider = "postgresql"
			}
			
			generator client {
				provider = "prisma-client-js"
			}
			
			generator openapi {
				provider = "prisma-openapi"
				output   = "./openapi"
			}
			
			model User {
				id           Int       @id @default(autoincrement())
				email        String    @unique
				tags         String[]  // Array of strings
				scores       Int[]     // Array of integers
				ratings      Float[]   // Array of floats
				permissions  Boolean[] // Array of booleans
			}
		`;

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
				config: {},
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: 'schema.prisma',
			},
			otherGenerators: [],
		};

		// Generate OpenAPI spec
		await onGenerate(options);

		// Verify that the YAML file was written
		const yamlPath = path.join(outputDirectory, 'openapi.yaml');
		expect(fs.existsSync(yamlPath)).toBe(true);

		// Verify the content of the YAML file
		const generatedOpenApi = yaml.parse(
			fs.readFileSync(yamlPath, 'utf8'),
		) as OpenAPIObject;

		// Check that the schemas were generated
		expect(generatedOpenApi).toHaveProperty('components');
		expect(generatedOpenApi.components).toHaveProperty('schemas');

		// Check that the User schema has the correct array field types
		const userSchema = generatedOpenApi.components!.schemas!
			.User as SchemaObject;
		expect(userSchema).toHaveProperty('properties');

		// Check tags (String[])
		const tagsProperty = userSchema.properties!.tags as SchemaObject;
		expect(tagsProperty.type).toBe('array');
		expect(tagsProperty.items).toEqual({type: 'string'});

		// Check scores (Int[])
		const scoresProperty = userSchema.properties!.scores as SchemaObject;
		expect(scoresProperty.type).toBe('array');
		expect(scoresProperty.items).toEqual({type: 'integer', format: 'int32'});

		// Check ratings (Float[])
		const ratingsProperty = userSchema.properties!.ratings as SchemaObject;
		expect(ratingsProperty.type).toBe('array');
		expect(ratingsProperty.items).toEqual({type: 'number', format: 'double'});

		// Check permissions (Boolean[])
		const permissionsProperty = userSchema.properties!
			.permissions as SchemaObject;
		expect(permissionsProperty.type).toBe('array');
		expect(permissionsProperty.items).toEqual({type: 'boolean'});
	});

	it('should handle scalar arrays with field comments', async () => {
		// Define schema with scalar array fields and comments
		const schema = `
			datasource db {
				provider = "postgresql"
			}
			
			generator client {
				provider = "prisma-client-js"
			}
			
			generator openapi {
				provider = "prisma-openapi"
				output   = "./openapi"
			}
			
			model User {
				id    Int      @id @default(autoincrement())
				email String   @unique
				/// List of user tags for categorization
				tags  String[]
			}
		`;

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
				config: {},
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: 'schema.prisma',
			},
			otherGenerators: [],
		};

		// Generate OpenAPI spec
		await onGenerate(options);

		// Verify that the YAML file was written
		const yamlPath = path.join(outputDirectory, 'openapi.yaml');
		expect(fs.existsSync(yamlPath)).toBe(true);

		// Verify the content of the YAML file
		const generatedOpenApi = yaml.parse(
			fs.readFileSync(yamlPath, 'utf8'),
		) as OpenAPIObject;

		// Check that the User schema has the correct array field with description
		const userSchema = generatedOpenApi.components!.schemas!
			.User as SchemaObject;
		const tagsProperty = userSchema.properties!.tags as SchemaObject;

		expect(tagsProperty.type).toBe('array');
		expect(tagsProperty.items).toEqual({type: 'string'});
		expect(tagsProperty.description).toBe(
			'List of user tags for categorization',
		);
	});
});
