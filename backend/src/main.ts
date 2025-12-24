import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Starting NestJS application...');
  let app;
  
  try {
    // Create app with timeout to prevent hanging
    console.log('📦 Creating NestJS application module...');
    app = await Promise.race([
      NestFactory.create(AppModule, {
        abortOnError: false,
        logger: ['error', 'warn', 'log'],
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('App creation timeout after 10 seconds')), 10000)
      ),
    ]) as any;
  } catch (error: any) {
    console.error('❌ Failed to create app:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
  
  if (!app) {
    console.error('❌ Failed to create application');
    process.exit(1);
  }
  
  console.log('✅ Application module created successfully');
  console.log('🔧 Setting up global pipes and CORS...');
  
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
  
  console.log(`🌐 Starting server on port ${port}...`);
  
  try {
    await Promise.race([
      app.listen(port),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Server startup timeout after 10 seconds')), 10000)
      ),
    ]);
    
    console.log(`\n✅ Application is running on: http://localhost:${port}`);
    console.log(`   Also available at: http://192.168.29.201:${port}`);
    console.log(`⚠️  Note: Database connection may still be retrying in background`);
    console.log(`   Supabase Auth (OTP) will work without database\n`);
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

bootstrap();
