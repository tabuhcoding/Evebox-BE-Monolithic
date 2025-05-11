// data-source.ts

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
  username: process.env.DATABASE_USERNAME || 'your_db_username',
  password: process.env.DATABASE_PASSWORD || 'your_db_password',
  database: process.env.DATABASE_NAME || 'your_db_name',
  entities: [__dirname + '/src/**/*.orm-entity.{ts,js}'],
  migrations: [__dirname + '/src/database/migrations/*.{ts,js}'],
  synchronize: false,
  logging: true,
});
