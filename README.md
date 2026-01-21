# BRIX Server

Backend service for the BRIX platform built with NestJS.

## Project Structure

The project follows a modular architecture for scalability and maintainability.

```text
src/
├── common/              # Global shared items (decorators, filters, guards, interceptors, etc.)
│   ├── decorators/
│   ├── dto/
│   ├── entities/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── interfaces/
│   ├── middleware/
│   └── pipes/
├── config/              # Configuration files and environment variables
├── database/            # Database module and TypeORM connection configuration
├── modules/             # Feature modules (Business Logic)
│   ├── auth/            # Authentication & Authorization (Login, Register, JWT)
│   ├── users/           # User management (Profile, Settings)
│   ├── upload/          # File handling and storage (S3, Cloudinary, Local)
│   └── bricks/          # Core business logic for 'Bricks' component
├── main.ts              # Entry point of the application
└── app.module.ts        # Root module that aggregates all features
```

## Features

- **Auth Module**: Secure authentication using JWT and Passport.
- **User Module**: CRUD operations for user profiles and account management.
- **Upload Module**: Robust file upload and management system.
- **Bricks Module**: Core domain logic specific to the BRIX platform.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (for PostgreSQL)

### Installation

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure accordingly.

### Database Setup

```bash
docker-compose up -d
```

### Running the App

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Linting and Formatting

This project uses **ESLint** and **Prettier** for high-quality code standards.

- Files are formatted automatically on save (VS Code).
- **Commitlint** is used to ensure conventional commit messages.
- **Lint-staged** runs before every commit to ensure code quality.

## License

[UNLICENSED](LICENSE)
