import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {getDMMF} from '@prisma/internals';
import type {GeneratorOptions} from '@prisma/generator-helper';
import {type OpenAPIObject, type SchemaObject} from 'openapi3-ts/oas31';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import yaml from 'yaml';
import {onGenerate} from '../src/on-generate/on-generate.js';

describe('Comments as field descriptions tests', () => {
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

	it('should use Prisma comments as field descriptions in the OpenAPI spec', async () => {
		// Define schema inline with field comments
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
				/// The user's email address
				email     String   @unique
				/// The user's full name
				name      String?
			}
			
			/// User role for authorization
			enum Role {
				/// Regular user
				USER
				/// Administrator with full access
				ADMIN
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

		// Check that the User schema has the field descriptions
		const userSchema = generatedOpenApi.components!.schemas!
			.User as SchemaObject;
		expect(userSchema).toHaveProperty('properties');
		expect(userSchema.properties).toHaveProperty('email');
		expect((userSchema.properties!.email as SchemaObject).description).toBe(
			"The user's email address",
		);
		expect((userSchema.properties!.name as SchemaObject).description).toBe(
			"The user's full name",
		);

		// Check that the Role enum has its values properly described
		const roleSchema = generatedOpenApi.components!.schemas!
			.Role as SchemaObject;
		expect(roleSchema).toHaveProperty('enum');
	});

	it('should include field comments in JSDoc comments when generateJsDoc is true', async () => {
		// Define schema inline with field comments
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
				generateJsDoc = true
			}
			
			/// A user model that represents a person in our system
			model User {
				id        Int      @id @default(autoincrement())
				/// The user's email address
				email     String   @unique
				/// The user's full name
				name      String?
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
				config: {
					generateJsDoc: true,
				},
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: 'schema.prisma',
			},
			otherGenerators: [],
		};

		// Generate OpenAPI spec
		await onGenerate(options);

		// Verify that the JS file was written
		const jsPath = path.join(outputDirectory, 'openapi.js');
		expect(fs.existsSync(jsPath)).toBe(true);

		// Read the content of the JS file
		const jsContent = fs.readFileSync(jsPath, 'utf8');

		// Check that the field descriptions are included in the JSDoc
		expect(jsContent).toContain("description: The user's email address");
		expect(jsContent).toContain("description: The user's full name");
	});
});
