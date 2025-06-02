<!-- PSST-AI-INSTRUCTIONS-START -->
## Linting

- Use xo for linting.

## Node Version

- Use the nodejs version specified in the .nvmrc file (22.15.0).

## Package Manager

- Use pnpm as the package manager.

## Prisma

- Use Prisma Client for type-safe database queries. Generate client after schema changes with `prisma generate`.
- Using PostgreSQL database. Use UUID for primary keys and leverage PostgreSQL-specific features like arrays and JSON types.
- Using multiple generators. Ensure each generator serves a specific purpose and maintain consistent configuration.
- Using Prisma relations. Use descriptive relation names and consider the impact on queries and performance.
- Using Prisma enums. Keep enum values consistent and consider migration impact when adding new values.
- Using default values in schema. Ensure defaults are appropriate for your business logic and consider using database functions.
- Using composite primary keys. Ensure the combination uniquely identifies records and consider query implications.

## Testing

- Use vitest testing framework.
<!-- PSST-AI-INSTRUCTIONS-END -->