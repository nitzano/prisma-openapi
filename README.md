<h1 align="center">Prisma OpenAPI</h1>
<h2 align="center">Generate OpenAPI schema from Prisma models</h2>

<div align="center">

[![npm](https://img.shields.io/npm/v/prisma-openapi)](https://www.npmjs.com/package/prisma-openapi)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
[![GitHub Repo stars](https://img.shields.io/github/stars/nitzano/prisma-openapi?style=flat)](https://github.com/nitzano/prisma-openapi/stargazers)
![GitHub License](https://img.shields.io/github/license/nitzano/prisma-openapi)
![npm](https://img.shields.io/npm/dw/prisma-openapi)

</div>

A Prisma generator that automatically creates OpenAPI specifications from your Prisma schema. Seamlessly integrate your database models with API documentation without writing any additional code.

- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
- [Examples](#examples)
  - [Basic Usage](#basic-usage)
  - [Custom Configuration](#custom-configuration)
- [Configuration Options](#configuration-options)
- [License](#license)

## Installation

```bash
# npm
npm install prisma-openapi --save-dev

# pnpm
pnpm add -D prisma-openapi

# yarn
yarn add -D prisma-openapi
```

## Features

- 🔄 **Automatic Generation**: Convert Prisma models to OpenAPI schemas with a single command
- 🔍 **Type Safety**: Maintain type consistency between your database and API documentation
- 🛠️ **Customizable**: Configure which models to include and set API metadata
- 🧩 **Relationship Support**: Properly maps Prisma relationships to OpenAPI references


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
  posts     Post[]
  profile   Profile?
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique
}
```

Running `prisma generate` will create OpenAPI specifications for these models.

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
  generateJSON  = false
  generateJSDoc  = false
}
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `output` | Output directory for OpenAPI schema | `./openapi` |
| `title` | API title in OpenAPI spec | Project name from package.json |
| `description` | API description in OpenAPI spec | Empty string |
| `includeModels` | Comma-separated list of models to include | All models |
| `excludeModels` | Comma-separated list of models to exclude | None |
| `generateYAML` | Generate YAML format | `true` |
| `generateJSON` | Generate JSON format | `false` |
| `generateJSDoc` | Include JSDoc comments in the schema | `false` |



## License

MIT
