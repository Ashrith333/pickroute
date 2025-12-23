import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  let app;
  
  try {
    // Create app - suppress all errors during creation
    app = await NestFactory.create(AppModule, {
      abortOnError: false,
      logger: false, // Disable logger to avoid error spam
    });
  } catch (error: any) {
    // Even if there's an error, try to create app with minimal config
    console.warn('⚠️  Initial app creation had issues, retrying...');
    try {
      app = await NestFactory.create(AppModule, {
        abortOnError: false,
        logger: false,
      });
    } catch (e: any) {
      console.error('❌ Failed to create app:', e.message);
      process.exit(1);
    }
  }
  
  if (!app) {
    console.error('❌ Failed to create application');
    process.exit(1);
  }
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  
  try {
    await app.listen(port);
    console.log(`\n✅ Application is running on: http://localhost:${port}`);
    console.log(`   Also available at: http://192.168.29.201:${port}`);
    console.log(`⚠️  Note: Database connection may still be retrying in background`);
    console.log(`   Supabase Auth (OTP) will work without database\n`);
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
