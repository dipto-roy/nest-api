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
 * 
 * Railway/Production: SSL is enabled automatically for secure connections
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
  
  // 🔒 SSL Configuration for Production (Railway, Render, etc.)
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false, // Railway requires this
  } : false,
  
  // ⚡ PERFORMANCE OPTIMIZATION - Connection Pool
  // Optimized for spike loads up to 100 concurrent users
  extra: {
    max: 30,                      // Handle spike load (was 15)
    min: 5,                       // Keep warm connections (was 3)
    idleTimeoutMillis: 30000,     // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Timeout waiting for connection (5s)
    
    // PostgreSQL specific optimizations
    statement_timeout: 10000,     // Kill queries taking longer than 10s
    query_timeout: 10000,         // Same as statement_timeout
    
    // SSL for extra config (Railway compatibility)
    ...(process.env.NODE_ENV === 'production' && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  },
  
  // Alternative way to set pool size
  poolSize: 30,  // Increased for spike load handling
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
