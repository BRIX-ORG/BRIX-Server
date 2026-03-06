# DTOs, Validation & API Documentation

## DTO Patterns

- **Separation**: Keep `RequestDto` and `ResponseDto` separate in the `dto/` folder.
- **Static Factory**: Response DTOs should use a `static fromEntity(entity)` method to map from domain/Prisma types. Do not perform this mapping in services.
- **Validation**: Use `class-validator` decorators on all Request DTO fields.
- **Coercion**: Use `@Type(() => Number)` on numeric query params.

## Param Validation

- Use `ParseUUIDPipe` for all UUID path parameters.
- Use `@HttpCode(HttpStatus.OK)` for POST actions that are not creating a resource (e.g. login, toggles).

## Swagger (OpenAPI)

Complete documentation is required for all controllers.

- `@ApiOperation({ summary: '...' })` on every endpoint.
- `@ApiResponse` (or specific `@ApiOkResponse`) with the DTO class specified.
- `@ApiProperty()` on **every** DTO field with `description` and `example`.
- `@ApiBearerAuth()` for protected routes.

Example for Wrapped Responses:

```ts
@ApiOkResponse({
  schema: {
    allOf: [
      { $ref: getSchemaPath(ApiResponseDto) },
      { properties: { data: { $ref: getSchemaPath(MyResponseDto) } } }
    ]
  }
})
```
