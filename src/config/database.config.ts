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

// Check if DATABASE_URL is provided (Railway, Heroku, etc.)
const databaseUrl = configService.get('DATABASE_URL');
const isRailwayInternal = databaseUrl?.includes('railway.internal');

// Debug logging in production to troubleshoot Railway
if (process.env.NODE_ENV === 'production') {
  console.log('🔍 Database Configuration:');
  console.log('  Using DATABASE_URL:', databaseUrl ? 'YES' : 'NO');
  if (databaseUrl) {
    // Parse and log connection details (safely)
    try {
      const url = new URL(databaseUrl);
      console.log('  Host:', url.hostname);
      console.log('  Port:', url.port);
      console.log('  Database:', url.pathname.slice(1));
      console.log('  User:', url.username);
      console.log('  Password:', url.password ? '***' + url.password.slice(-4) : 'NOT SET');
      console.log('  Railway Internal:', isRailwayInternal ? 'YES' : 'NO');
    } catch (e) {
      console.log('  DATABASE_URL parsing error:', e.message);
    }
  }
  console.log('  SSL:', !isRailwayInternal ? 'ENABLED' : 'DISABLED (Railway internal)');
}

// If DATABASE_URL exists (Railway), use it directly
let dataSourceOptions: DataSourceOptions;

if (databaseUrl) {
  // Railway provides DATABASE_URL
  dataSourceOptions = {
    type: 'postgres',
    url: databaseUrl,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    
    // 🔒 SSL Configuration - Railway internal network doesn't use SSL
    ssl: process.env.NODE_ENV === 'production' && !isRailwayInternal ? {
      rejectUnauthorized: false,
    } : false,
    
    // ⚡ PERFORMANCE OPTIMIZATION - Connection Pool
    extra: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
    },
  };
} else {
  // Local development: use individual variables
  const dbHost = configService.get('DATABASE_HOST') || 
                 configService.get('PGHOST') || 
                 'localhost';
  const dbPort = parseInt(configService.get('DATABASE_PORT') || 
                          configService.get('PGPORT') || 
                          '5432');
  const dbUser = configService.get('DATABASE_USERNAME') || 
                 configService.get('PGUSER') || 
                 'postgres';
  const dbPassword = configService.get('DATABASE_PASSWORD') || 
                     configService.get('PGPASSWORD') || 
                     '';
  const dbName = configService.get('DATABASE_NAME') || 
                 configService.get('PGDATABASE') || 
                 'nest_api_db';

  dataSourceOptions = {
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPassword,
    database: dbName,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    
    // 🔒 SSL Configuration for Production
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : false,
    
    // ⚡ PERFORMANCE OPTIMIZATION - Connection Pool
    extra: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
    },
  };
}

export { dataSourceOptions };

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
