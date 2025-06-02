import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {getDMMF} from '@prisma/internals';
import type {GeneratorOptions} from '@prisma/generator-helper';
import {type OpenAPIObject, type SchemaObject} from 'openapi3-ts/oas31';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import yaml from 'yaml';
import {onGenerate} from '../src/on-generate/on-generate.js';

describe('Description configuration tests', () => {
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

	it('should use an empty description when no description is provided', async () => {
		// Define schema inline without description
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
				name      String?
			}
			
			enum Role {
				USER
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
		expect(generatedOpenApi).toHaveProperty('info');
		expect(generatedOpenApi.info).toHaveProperty('description', '');
	});

	it('should use the custom description when provided in generator config', async () => {
		// Define schema inline with custom description
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
				description = "Custom API description for testing"
			}
			
			model User {
				id        Int      @id @default(autoincrement())
				email     String   @unique
				name      String?
			}
			
			enum Role {
				USER
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
				config: {
					description: 'Custom API description for testing',
				},
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
		expect(generatedOpenApi).toHaveProperty('info');
		expect(generatedOpenApi.info).toHaveProperty(
			'description',
			'Custom API description for testing',
		);
	});
});
