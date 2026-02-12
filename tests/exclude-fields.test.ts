import {describe, expect, it} from 'vitest';
import {generateOpenApiSchema} from '../src/lib/index.js';

const schemaWithSensitiveFields = `
datasource db {
  provider = "postgresql"
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  name     String?
  /// @openapi.ignore
  password String
}
`;

const schemaWithAnnotationAndDescription = `
datasource db {
  provider = "postgresql"
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  /// Internal hash @openapi.ignore
  hash     String
}
`;

const schemaForConfigExclusion = `
datasource db {
  provider = "postgresql"
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  name     String?
  password String
}
`;

const schemaForCombined = `
datasource db {
  provider = "postgresql"
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  /// @openapi.ignore
  password String
  secret   String
}
`;

describe('Field exclusion', () => {
	describe('@openapi.ignore annotation', () => {
		it('should omit field with @openapi.ignore from properties', async () => {
			const result = await generateOpenApiSchema(schemaWithSensitiveFields, {
				generateJson: true,
				generateYaml: false,
			});

			const parsed = JSON.parse(result);
			const userSchema = parsed.components?.schemas?.User;
			expect(userSchema.properties).toHaveProperty('id');
			expect(userSchema.properties).toHaveProperty('email');
			expect(userSchema.properties).toHaveProperty('name');
			expect(userSchema.properties).not.toHaveProperty('password');
		});

		it('should omit field with @openapi.ignore from required array', async () => {
			const result = await generateOpenApiSchema(schemaWithSensitiveFields, {
				generateJson: true,
				generateYaml: false,
			});

			const parsed = JSON.parse(result);
			const userSchema = parsed.components?.schemas?.User;
			expect(userSchema.required).toContain('id');
			expect(userSchema.required).toContain('email');
			expect(userSchema.required).not.toContain('password');
		});

		it('should omit field when @openapi.ignore appears alongside a description', async () => {
			const result = await generateOpenApiSchema(
				schemaWithAnnotationAndDescription,
				{
					generateJson: true,
					generateYaml: false,
				},
			);

			const parsed = JSON.parse(result);
			const userSchema = parsed.components?.schemas?.User;
			expect(userSchema.properties).not.toHaveProperty('hash');
			expect(userSchema.required).not.toContain('hash');
		});
	});

	describe('excludeFields config option', () => {
		it('should omit field specified in excludeFields from properties', async () => {
			const result = await generateOpenApiSchema(schemaForConfigExclusion, {
				excludeFields: 'User.password',
				generateJson: true,
				generateYaml: false,
			});

			const parsed = JSON.parse(result);
			const userSchema = parsed.components?.schemas?.User;
			expect(userSchema.properties).toHaveProperty('id');
			expect(userSchema.properties).toHaveProperty('email');
			expect(userSchema.properties).not.toHaveProperty('password');
		});

		it('should omit field specified in excludeFields from required array', async () => {
			const result = await generateOpenApiSchema(schemaForConfigExclusion, {
				excludeFields: 'User.password',
				generateJson: true,
				generateYaml: false,
			});

			const parsed = JSON.parse(result);
			const userSchema = parsed.components?.schemas?.User;
			expect(userSchema.required).not.toContain('password');
		});
	});

	describe('combined annotation and config', () => {
		it('should omit fields from both @openapi.ignore and excludeFields', async () => {
			const result = await generateOpenApiSchema(schemaForCombined, {
				excludeFields: 'User.secret',
				generateJson: true,
				generateYaml: false,
			});

			const parsed = JSON.parse(result);
			const userSchema = parsed.components?.schemas?.User;
			expect(userSchema.properties).toHaveProperty('id');
			expect(userSchema.properties).toHaveProperty('email');
			expect(userSchema.properties).not.toHaveProperty('password');
			expect(userSchema.properties).not.toHaveProperty('secret');
		});
	});
});
