---
applyTo: 'src/modules/**/dto/*.ts'
---

# BRIX DTO Mapping & Formatting

## Response DTOs

- Use a **static factory method** `fromEntity()` to transform domain/internal data into DTOs.
- Avoid ad-hoc mapping inside Services or Controllers.

## Type Casting

- **Decimals**: PostgreSQL/Prisma Decimal types must be cast to `Number` in the DTO layer.
- **JSON**: Cast JSONB fields to domain interfaces.

## Standardization

- Every paginated response must match: `{ data: T[], total: number, limit: number, offset: number }`.
- All response DTO fields must have `@ApiProperty` with example values.
