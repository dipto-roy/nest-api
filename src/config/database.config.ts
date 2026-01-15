import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

/**
 * TypeORM Database Configuration
 * 
 * Best Practice: In production, use migrations instead of synchronize
 * synchronize: true is convenient for development but should be false in production
 * to prevent accidental schema changes
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development', // Set to false in production
  logging: process.env.NODE_ENV === 'development',
  
  // ⚡ PERFORMANCE OPTIMIZATION - Connection Pool
  // Optimized for moderate load with minimal overhead
  extra: {
    max: 15,                      // Balanced pool size
    min: 3,                       // Minimum idle connections
    idleTimeoutMillis: 30000,     // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Timeout waiting for connection (5s)
    
    // PostgreSQL specific optimizations
    statement_timeout: 10000,     // Kill queries taking longer than 10s
    query_timeout: 10000,         // Same as statement_timeout
  },
  
  // Alternative way to set pool size
  poolSize: 15,  // Reduced from 20 to minimize overhead
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
