<h1 align="center">Prisma OpenAPI</h1>
<h2 align="center">Generate OpenAPI schema from Prisma models</h2>

<div align="center">

[![npm](https://img.shields.io/npm/v/prisma-openapi)](https://www.npmjs.com/package/prisma-openapi)
[![GitHub Repo stars](https://img.shields.io/github/stars/nitzano/prisma-openapi?style=flat)](https://github.com/nitzano/prisma-openapi/stargazers)
![npm](https://img.shields.io/npm/dw/prisma-openapi)
![GitHub License](https://img.shields.io/github/license/nitzano/prisma-openapi)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

</div>

A Prisma generator that automatically creates OpenAPI specifications from your Prisma schema. Seamlessly integrate your database models with API documentation without writing any additional code.

- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [Examples](#examples)
  - [Basic Usage](#basic-usage)
  - [Custom Configuration](#custom-configuration)
  - [JSDoc Integration](#jsdoc-integration)
  - [Prisma Comments as Descriptions](#prisma-comments-as-descriptions)
- [Configuration](#configuration)
- [License](#license)


## Features
- 🔄 **Automatic Generation**: Convert Prisma models to OpenAPI schemas with a single command
- 🔍 **Type Safety**: Maintain type consistency between your database and API documentation
- 🛠️ **Customizable**: Configure which models to include and set API metadata
- 🧩 **Relationship Support**: Properly maps Prisma relationships to OpenAPI references
- *️⃣ **Enum Support**: Full support for Prisma enums in your API documentation
- 📝 **JSDoc Generation**: Create JSDoc comments for your TypeScript types based on the Prisma schema

## Setup

```bash
npm i -D prisma-openapi
pnpm add -D prisma-openapi
yarn add -D prisma-openapi
```

## Usage

Add the generator to your `schema.prisma` file:

```prisma
generator openapi {
  provider = "prisma-openapi"
  output   = "./openapi"
}
```

Then run Prisma generate:

```bash
npx prisma generate
```

This will create OpenAPI documentation in the specified output directory.

## Examples

### Basic Usage

```prisma
// schema.prisma
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

/// Represents a user in the system
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
}

/// Represents a blog post
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
```


Running `prisma generate` will create OpenAPI specifications for these models:


```yaml
openapi: 3.1.0
info:
  title: Prisma API
  description: API generated from Prisma schema
  version: 1.0.0
components:
  schemas:
    User:
      type: object
      description: Represents a user in the system
      properties:
        id:
          type: integer
          format: int32
        email:
          type: string
        name:
          type: string
        posts:
          type: array
          items:
            $ref: '#/components/schemas/Post'
      required:
        - id
        - email
    Post:
      type: object
      description: Represents a blog post
      properties:
        id:
          type: integer
          format: int32
        title:
          type: string
        content:
          type: string
        published:
          type: boolean
        author:
          $ref: '#/components/schemas/User'
        authorId:
          type: integer
          format: int32
      required:
        - id
        - title
        - published
        - author
        - authorId
```

### Custom Configuration

```prisma
generator openapi {
  provider      = "prisma-openapi"
  output        = "./openapi"
  title         = "My API"
  description   = "API for my application"
  includeModels = "User,Post"
  excludeModels = "Passwords"
  generateYaml  = true
  generateJson  = false
  generateJsDoc = false
}
```

### JSDoc Integration

When `generateJsDoc` is enabled, prisma-openapi will generate a JavaScript file containing OpenAPI-compatible JSDoc comments. This can be integrated with tools like [swagger-jsdoc](https://www.npmjs.com/package/swagger-jsdoc) to combine your API route documentation with your Prisma model definitions.

```prisma
generator openapi {
  provider      = "prisma-openapi"
  output        = "./openapi"
  generateJsDoc = true
}
```

The generated JSDoc comments can be imported into your API documentation workflow:

```javascript
/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         posts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Post'
 *       required:
 *         - id
 *         - email
 */
```

### Prisma Comments as Descriptions

Prisma-openapi automatically converts Prisma schema comments into OpenAPI description fields. Use triple-slash comments (`///`) to add descriptions to your models and fields:

```prisma
/// User account information
model User {
  /// Primary key for the user
  id    Int    @id @default(autoincrement())
  /// User's email address for login
  email String @unique
  /// Optional display name
  name  String?
}
```

This will generate:

```yaml
User:
  type: object
  description: User account information
  properties:
    id:
      type: integer
      description: Primary key for the user
    email:
      type: string
      description: User's email address for login
    name:
      type: string
      description: Optional display name
```

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `output` | Output directory for OpenAPI schema | `./openapi` |
| `title` | API title in OpenAPI spec | "Prisma API" |
| `description` | API description in OpenAPI spec | Empty string |
| `includeModels` | Comma-separated list of models to include | All models |
| `excludeModels` | Comma-separated list of models to exclude | None |
| `generateYaml` | Generate YAML format | `true` |
| `generateJson` | Generate JSON format | `false` |
| `generateJsDoc` | Include JSDoc comments in the schema | `false` |

## License

MIT
