/**
 * Main Application Module
 * 
 * Imports and configures all feature modules
 */
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // 🛡️ Rate Limiting - Prevents abuse during traffic spikes
    // Higher limits in development for load testing
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [{
        ttl: 60000,
        limit: configService.get('NODE_ENV') === 'production' ? 100 : 10000,
      }],
      inject: [ConfigService],
    }),
    
    // TypeORM database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        const isProduction = configService.get('NODE_ENV') === 'production';
        
        // Base configuration
        const baseConfig = {
          type: 'postgres' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
          
          // SSL for production
          ssl: isProduction ? {
            rejectUnauthorized: false,
          } : false,
          
          // Connection pool - reduced for Railway free tier
          extra: {
            max: 10, // Reduced from 30 for Railway free tier
            min: 2,  // Reduced from 5
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000, // Increased timeout
            statement_timeout: 30000, // Increased to 30s
            query_timeout: 30000,
            
            // SSL for extra config
            ...(isProduction && {
              ssl: {
                rejectUnauthorized: false,
              },
            }),
          },
        };
        
        // Use DATABASE_URL if available (Railway), otherwise use individual vars
        if (databaseUrl) {
          console.log('✅ Using DATABASE_URL for connection');
          return {
            ...baseConfig,
            url: databaseUrl,
          };
        } else {
          console.log('✅ Using individual DATABASE_* variables');
          return {
            ...baseConfig,
            host: configService.get('DATABASE_HOST'),
            port: configService.get('DATABASE_PORT'),
            username: configService.get('DATABASE_USERNAME'),
            password: configService.get('DATABASE_PASSWORD'),
            database: configService.get('DATABASE_NAME'),
          };
        }
      },
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    WebhooksModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // 🛡️ Apply rate limiting globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
