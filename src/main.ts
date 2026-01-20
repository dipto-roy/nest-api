/**
 * Application Bootstrap
 * 
 * Initializes NestJS application with CORS and validation
 * Configured for deployment on Render/Railway
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  try {
    console.log('🔄 Starting application...');
    console.log('📝 Environment:', process.env.NODE_ENV);
    console.log('🔌 PORT:', process.env.PORT);
    console.log('💾 DATABASE_URL:', process.env.DATABASE_URL ? 'SET ✅' : 'NOT SET ❌');
    
    const app = await NestFactory.create(AppModule, {
      // Enable raw body for Stripe webhook signature verification
      rawBody: true,
      logger: ['error', 'warn', 'log', 'debug'],
    });

    const configService = app.get(ConfigService);

    // Enable CORS for cross-origin requests
    const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
    ];

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });

    // Global validation pipe with whitelist to strip unknown properties
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Increase payload size limit for regular endpoints
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ extended: true, limit: '10mb' }));

    const port = configService.get<number>('PORT') || 3000;
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
    console.log(`📝 Environment: ${configService.get<string>('NODE_ENV')}`);
    console.log(`🔗 Database URL: ${configService.get<string>('DATABASE_URL') ? 'Connected via DATABASE_URL' : 'Using individual variables'}`);
    console.log(`✅ Server ready to accept connections`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

bootstrap();
