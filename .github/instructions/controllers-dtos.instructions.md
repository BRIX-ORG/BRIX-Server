---
applyTo: 'src/modules/**/*.controller.ts, src/modules/**/dto/*.ts'
---

# BRIX Controllers & DTOs

## Swagger (OpenAPI)

Complete documentation is mandatory for all public APIs.

- `@ApiOperation({ summary: '...' })` on every method.
- `@ApiResponse` (or specific hooks like `@ApiOkResponse`) with correct DTO class to **precisely define the contract for the frontend**.
- For wrapped responses:
    ```ts
    schema: {
        allOf: [
            { $ref: getSchemaPath(ApiResponseDto) },
            { properties: { data: { $ref: getSchemaPath(MyDto) } } },
        ];
    }
    ```
- `@ApiProperty()` on **every** DTO field (Request & Response):
    - **Description**: Describe business semantics clearly.
    - **Example**: Provide realistic, high-quality examples to enable easy frontend mocking and integration.
- Document common error responses (400, 401, 403, 404) if they carry specific meaning or data for the UI.

## Param Validation

- Use `ParseUUIDPipe` for all UUID path parameters.
- Coerce numeric query params using `@Type(() => Number)` + `@IsInt()`.

## Controller Logic

- Controllers should be thin. Defer all logic to Services.
- Use `@HttpCode(HttpStatus.OK)` for POST endpoints that don't create resources (login, toggles).
- Return raw data; `ResponseInterceptor` will wrap it.
