import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'brix_user',
    password: process.env.DB_PASSWORD || 'brix_password',
    database: process.env.DB_DATABASE || 'brix_db',
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'development', // Only for development
    logging: process.env.NODE_ENV === 'development',
}));
