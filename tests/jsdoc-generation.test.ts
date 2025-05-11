import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getDMMF} from '@prisma/internals';
import {type GeneratorOptions} from '@prisma/generator-helper';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {onGenerate} from '../src/on-generate/on-generate.js';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('JSDoc Generation', () => {
	const jsDocumentOutputDirectory = path.join(__dirname, 'jsdoc-output');
	const jsDocumentOutputPath = path.join(
		jsDocumentOutputDirectory,
		'openapi.js',
	);

	// Set up and tear down the output directory for each test run
	beforeAll(() => {
		if (!fs.existsSync(jsDocumentOutputDirectory)) {
			fs.mkdirSync(jsDocumentOutputDirectory, {recursive: true});
		}
	});

	afterAll(() => {
		// Clean up generated files
		if (fs.existsSync(jsDocumentOutputPath)) {
			fs.unlinkSync(jsDocumentOutputPath);
		}

		if (fs.existsSync(jsDocumentOutputDirectory)) {
			fs.rmSync(jsDocumentOutputDirectory, {recursive: true, force: true});
		}
	});

	it('generates JSDoc comments when generateJsDoc is true', async () => {
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
					value: jsDocumentOutputDirectory,
					fromEnvVar: null,
				},
				config: {
					generateJsDoc: true,
				} satisfies Record<string, unknown>,
				binaryTargets: [],
				previewFeatures: [],
				sourceFilePath: schemaPath,
			},
			otherGenerators: [],
		};

		// Generate OpenAPI spec
		await onGenerate(options);

		// Verify that the JSDoc file was created
		expect(fs.existsSync(jsDocumentOutputPath)).toBe(true);

		// Read the generated JS file
		const jsDocumentContent = fs.readFileSync(jsDocumentOutputPath, 'utf8');

		// Verify the JSDoc content contains expected OpenAPI annotations
		expect(jsDocumentContent).toContain('@openapi');
		expect(jsDocumentContent).toContain('components:');
		expect(jsDocumentContent).toContain('schemas:');

		// Check that all models have schema definitions in the JSDoc
		expect(jsDocumentContent).toContain('User:');
		expect(jsDocumentContent).toContain('Post:');
		expect(jsDocumentContent).toContain('Profile:');
		expect(jsDocumentContent).toContain('type: object');
		expect(jsDocumentContent).toContain('properties:');

		// Check for model properties and references
		expect(jsDocumentContent).toContain("$ref: '#/components/schemas/");
		expect(jsDocumentContent).toContain('type: string');
		expect(jsDocumentContent).toContain('type: integer');
		expect(jsDocumentContent).toContain('type: boolean');

		// Check for enum schemas
		expect(jsDocumentContent).toContain('Role:');
		expect(jsDocumentContent).toContain('enum:');
		expect(jsDocumentContent).toContain('- USER');
		expect(jsDocumentContent).toContain('- ADMIN');

		// Verify no API endpoints are included
		expect(jsDocumentContent).not.toContain('/api/');
		expect(jsDocumentContent).not.toContain('get:');
	});
});
