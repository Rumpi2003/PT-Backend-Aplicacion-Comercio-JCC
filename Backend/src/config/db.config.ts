import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

function getEnvVar(name: string): string {
  const value = process.env[name];
    if (!value) throw new Error(`Environment variable ${name} is not set`);
    return value;
}

const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: getEnvVar('DB_HOST'),
    port: Number(getEnvVar('DB_PORT')),
    username: getEnvVar('DB_USER'),
    password: getEnvVar('DB_PASSWORD'),
    database: getEnvVar('DB_NAME'),
    synchronize: true,
    logging: false,
    entities: [isProd ? 'dist/entities/**/*.js' : 'src/entities/**/*.ts'],
    migrations: ['dist/migrations/**/*.{js,ts}'],
    subscribers: []
})

