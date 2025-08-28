# Marketplace Server AI Agent Instructions

## Project Overview
This is a NestJS-based marketplace server implementing Domain-Driven Design (DDD) and Clean Architecture principles.

## Architecture & Structure

### Core Layers
- `src/domain/` - Core business logic and entities
  - `marketplace/enterprise/entities/` - Domain entities (e.g., `Seller`, `Product`)
  - `marketplace/application/use-cases/` - Application use cases
  - `marketplace/application/repositories/` - Repository interfaces
- `src/core/` - Shared core utilities and base classes
  - `either.ts` - Result type for error handling
  - `entities/` - Base entity and value object classes
- `src/infra/` - Infrastructure layer (HTTP, database, etc.)

### Key Patterns

1. **Error Handling**
- Uses `Either<Error, Success>` pattern for use case responses
- Domain errors extend `UseCaseError`
Example from `authenticate-seller.ts`:
```typescript
type AuthenticateSellerUseCaseResponse = Either<
  WrongCredentialsError,
  { accessToken: string }
>
```

2. **Domain Entities**
- Extend `AggregateRoot` or `Entity`
- Use Value Objects for validated properties
- Entities can be mutable, Value Objects must be immutable

3. **Use Cases**
- Use dependency injection with `@Injectable()`
- Return `Either` type for error handling
- Never expose sensitive data (use DTOs/Presenters in infra layer)

### Development Workflow

1. **Entity Creation**
   - Create entity in `domain/marketplace/enterprise/entities/`
   - Implement value objects for validated properties
   - Define repository interface in `domain/marketplace/application/repositories/`

2. **Use Case Implementation**
   - Create use case in `domain/marketplace/application/use-cases/`
   - Define request/response types with `Either`
   - Implement business logic using repositories and domain services

3. **Testing**
   - Use Vitest for testing
   - Run `vitest` for unit tests
   - Run `vitest --config vitest.config.e2e.ts` for E2E tests

### Factory Testing Best Practices
- When testing factories that return Value Objects or Entities:
  - Use `.equals()` for comparing Value Objects and Entities instead of `toBe` or deep equality, since VO/Entities may be new instances but logically equal.
  - Use `toBe` only for primitives (strings, numbers, booleans) and array length checks.
  - For arrays of VOs or Entities, iterate and compare each element with `.equals()`.
  - Avoid comparing internal IDs of Value Objects; instead, test the logical properties inside.
- Example for ProductDetailsFactory:
```typescript
const ownerProfile = sellerProfileFactory.create({ seller, avatar });
const productDetails = sut.create({ product, ownerProfile, category, attachments });
expect(productDetails.owner.equals(ownerProfile)).toBe(true); // VO equality
expect(productDetails.title).toBe(product.title);             // primitive equality
expect(productDetails.attachments[0].equals(attachments[0])).toBe(true); // array of VO/Entity
```
- This ensures that factories produce correctly composed objects without relying on object identity.

## Common Tasks

### Adding New Features
1. Define entity and value objects
2. Create repository interface
3. Implement use case with error handling
4. Add infrastructure components (controller, repository impl)
5. Add to relevant test suites

### Error Handling
- Domain errors should extend `UseCaseError`
- Use cases return `Either<Error, Success>`
- Infrastructure layer translates errors to HTTP responses

## Project Conventions

1. **Naming**
- Use cases: `[Action][Entity]UseCase` (e.g., `CreateSellerUseCase`)
- Repositories: `[Entity]Repository` (e.g., `SellersRepository`)
- Errors: `[Description]Error` (e.g., `WrongCredentialsError`)

2. **File Structure**
- One class per file
- Use feature-based organization in domain layer
- Infrastructure components organized by type

3. **Type Safety**
- Use TypeScript strict mode
- Define explicit interfaces for all data structures
- Leverage type system for error handling with `Either`

4. **Testing**
- Test different scenarios that represent real-world use cases (e.g., with/without optional properties, empty collections vs populated collections)
