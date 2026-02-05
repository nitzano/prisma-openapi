import {describe, expect, it} from 'vitest';
import {generateOpenApiSchema} from '../src/lib/index.js';

const simplePrismaSchema = `
datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`;

describe('Library API - generateOpenApiSchema', () => {
	it('should generate YAML OpenAPI schema by default', async () => {
		const result = await generateOpenApiSchema(simplePrismaSchema);

		expect(result).toBeDefined();
		expect(result).toContain('openapi:');
		expect(result).toContain('User:');
	});

	it('should generate YAML when generateYaml is true', async () => {
		const result = await generateOpenApiSchema(simplePrismaSchema, {
			generateYaml: true,
		});

		expect(result).toBeDefined();
		expect(result).toContain('openapi:');
		expect(result).toContain('User:');
	});

	it('should generate JSON when generateJson is true', async () => {
		const result = await generateOpenApiSchema(simplePrismaSchema, {
			generateJson: true,
			generateYaml: false,
		});

		expect(result).toBeDefined();
		const parsed = JSON.parse(result);
		expect(parsed.openapi).toBe('3.1.0');
	});

	it('should throw error for empty schema', async () => {
		await expect(generateOpenApiSchema('')).rejects.toThrow(
			'Prisma schema must be a non-empty string.',
		);
	});

	it('should throw error for whitespace-only schema', async () => {
		await expect(generateOpenApiSchema('   \n  ')).rejects.toThrow(
			'Prisma schema must be a non-empty string.',
		);
	});

	it('should respect includeModels option', async () => {
		const schemaWithMultipleModels = `
datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
}

model Post {
  id    Int     @id @default(autoincrement())
  title String
}
`;
		const result = await generateOpenApiSchema(schemaWithMultipleModels, {
			includeModels: 'User',
			generateJson: true,
			generateYaml: false,
		});

		const parsed = JSON.parse(result);
		expect(parsed.components?.schemas?.User).toBeDefined();
		expect(parsed.components?.schemas?.Post).toBeUndefined();
	});

	it('should respect excludeModels option', async () => {
		const schemaWithMultipleModels = `
datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
}

model Post {
  id    Int     @id @default(autoincrement())
  title String
}
`;
		const result = await generateOpenApiSchema(schemaWithMultipleModels, {
			excludeModels: 'Post',
			generateJson: true,
			generateYaml: false,
		});

		const parsed = JSON.parse(result);
		expect(parsed.components?.schemas?.User).toBeDefined();
		expect(parsed.components?.schemas?.Post).toBeUndefined();
	});

	it('should use custom title when provided', async () => {
		const result = await generateOpenApiSchema(simplePrismaSchema, {
			title: 'My Custom API',
			generateJson: true,
			generateYaml: false,
		});

		const parsed = JSON.parse(result);
		expect(parsed.info?.title).toBe('My Custom API');
	});

	it('should use custom description when provided', async () => {
		const result = await generateOpenApiSchema(simplePrismaSchema, {
			description: 'My API description',
			generateJson: true,
			generateYaml: false,
		});

		const parsed = JSON.parse(result);
		expect(parsed.info?.description).toBe('My API description');
	});
});
