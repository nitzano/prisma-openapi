import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {getDMMF} from '@prisma/internals';
import type {GeneratorOptions} from '@prisma/generator-helper';
import {type OpenAPIObject, type SchemaObject} from 'openapi3-ts/oas31';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import yaml from 'yaml';
import {onGenerate} from '../src/on-generate/on-generate.js';

describe('Model description tests', () => {
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

	it('should include model documentation as description in OpenAPI schema', async () => {
		// Define schema inline with model comments
		const schema = `
			datasource db {
				provider = "postgresql"
				url      = env("DATABASE_URL")
			}
			
			generator client {
				provider = "prisma-client-js"
			}
			
			generator openapi {
				provider = "prisma-openapi"
				output   = "./openapi"
			}
			
			/// A user model that represents a person in our system
			model User {
				id        Int      @id @default(autoincrement())
				email     String   @unique
				name      String?
			}
			
			/// A blog post with content and metadata
			model Post {
				id        Int      @id @default(autoincrement())
				title     String
				content   String?
				published Boolean  @default(false)
			}
			
			model Profile {
				id     Int    @id @default(autoincrement())
				bio    String
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

		// Check that the User schema has the model description
		const userSchema = generatedOpenApi.components!.schemas!
			.User as SchemaObject;
		expect(userSchema).toHaveProperty('description');
		expect(userSchema.description).toBe(
			'A user model that represents a person in our system',
		);

		// Check that the Post schema has the model description
		const postSchema = generatedOpenApi.components!.schemas!
			.Post as SchemaObject;
		expect(postSchema).toHaveProperty('description');
		expect(postSchema.description).toBe(
			'A blog post with content and metadata',
		);

		// Check that Profile schema (no comment) has no description or undefined description
		const profileSchema = generatedOpenApi.components!.schemas!
			.Profile as SchemaObject;
		// Should either not have description property or have undefined value
		expect(profileSchema.description).toBeUndefined();
	});

	it('should handle models without documentation gracefully', async () => {
		// Define schema with no model comments
		const schema = `
			datasource db {
				provider = "postgresql"
				url      = env("DATABASE_URL")
			}
			
			generator client {
				provider = "prisma-client-js"
			}
			
			generator openapi {
				provider = "prisma-openapi"
				output   = "./openapi"
			}
			
			model User {
				id        Int      @id @default(autoincrement())
				email     String   @unique
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

		// Check that the User schema exists but has no description
		const userSchema = generatedOpenApi.components!.schemas!
			.User as SchemaObject;
		expect(userSchema).toBeDefined();
		expect(userSchema.description).toBeUndefined();
	});
});
