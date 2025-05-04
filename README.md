<h1 align="center">Prisma OpenAPI 🔄📝</h1>
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
- [Usage](#usage)
- [Examples](#examples)
  - [Basic Usage](#basic-usage)
  - [Custom Configuration](#custom-configuration)
- [Features](#features)
- [Configuration Options](#configuration-options)
- [Contributing](#contributing)
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
  version       = "1.0.0"
  description   = "API for my application"
  serverUrl     = "https://api.example.com"
  includeModels = "User,Post"
}
```

## Features

- 🔄 **Automatic Generation**: Convert Prisma models to OpenAPI schemas with a single command
- 🔍 **Type Safety**: Maintain type consistency between your database and API documentation
- 🛠️ **Customizable**: Configure which models to include and set API metadata
- 📊 **Comprehensive**: Generate complete paths, components, and schemas
- 🧩 **Relationship Support**: Properly maps Prisma relationships to OpenAPI references

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `output` | Output directory for OpenAPI schema | `./openapi` |
| `title` | API title in OpenAPI spec | Project name from package.json |
| `version` | API version in OpenAPI spec | Version from package.json |
| `description` | API description in OpenAPI spec | Empty string |
| `serverUrl` | Server URL in OpenAPI spec | `http://localhost:3000` |
| `includeModels` | Comma-separated list of models to include | All models |
| `excludeModels` | Comma-separated list of models to exclude | None |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
