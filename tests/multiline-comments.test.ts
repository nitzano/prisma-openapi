import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {getDMMF} from '@prisma/internals';
import type {GeneratorOptions} from '@prisma/generator-helper';
import {type OpenAPIObject, type SchemaObject} from 'openapi3-ts/oas31';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import yaml from 'yaml';
import {onGenerate} from '../src/on-generate/on-generate.js';

describe('Multiline comments support', () => {
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

	it('should convert \\n in comments to actual multiline descriptions in YAML', async () => {
		// Define schema inline with field comments containing \n
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
				/// The user's\\n first name
				firstName String
				/// The user's last name
				lastName  String?
				/// The user email address\\nThis is optional and can be null.
				email     String?
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

		// Check that the User schema has the field descriptions with proper multiline formatting
		const userSchema = generatedOpenApi.components!.schemas!
			.User as SchemaObject;
		expect(userSchema).toHaveProperty('properties');
		expect(userSchema.properties).toHaveProperty('firstName');
		expect(userSchema.properties).toHaveProperty('email');

		// Check that descriptions are properly formatted as multiline
		expect((userSchema.properties!.firstName as SchemaObject).description).toBe(
			"The user's\nfirst name",
		);
		expect((userSchema.properties!.email as SchemaObject).description).toBe(
			'The user email address\nThis is optional and can be null.',
		);
	});

	it('should convert \\n in comments to actual multiline descriptions in JSDoc', async () => {
		// Define schema inline with field comments containing \n
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
			
			model User {
				id        Int      @id @default(autoincrement())
				/// The user's\\n first name
				firstName String
				/// The user's last name
				lastName  String?
				/// The user email address\\nThis is optional and can be null.
				email     String?
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

		// Check that the field descriptions are included in the JSDoc with multiline formatting
		expect(jsContent).toContain(
			"description: |-\n *             The user's\n *             first name",
		);
		expect(jsContent).toContain(
			'description: |-\n *             The user email address\n *             This is optional and can be null.',
		);
	});
});
