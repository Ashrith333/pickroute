import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({})
export class OptionalTypeOrmModule {
  static forRootAsync(): DynamicModule {
    // Try to create TypeORM module, but don't fail if it doesn't work
    try {
      return TypeOrmModule.forRootAsync({
        useFactory: () => {
          let databaseUrl = process.env.DATABASE_URL;
          
          if (!databaseUrl) {
            console.warn('⚠️  DATABASE_URL not found - database features disabled');
            return {
              type: 'postgres',
              url: 'postgresql://localhost:5432/dummy',
              entities: [],
              synchronize: false,
              logging: false,
              autoLoadEntities: false,
            };
          }

          databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '');

          try {
            const url = new URL(databaseUrl);
            console.log(`🔍 Database Config: ${url.hostname}:${url.port || 5432}/${url.pathname.replace('/', '')}`);
          } catch (e) {
            console.warn('⚠️  Could not parse DATABASE_URL');
          }

          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: process.env.NODE_ENV === 'development',
            logging: process.env.NODE_ENV === 'development',
            ssl: {
              rejectUnauthorized: false,
            },
            extra: {
              max: 3,
              connectionTimeoutMillis: 500,
              idleTimeoutMillis: 30000,
            },
            retryAttempts: 0,
            autoLoadEntities: true,
          };
        },
      });
    } catch (error: any) {
      console.warn('⚠️  Failed to initialize TypeORM:', error.message);
      // Return empty module if TypeORM fails
      return {
        module: OptionalTypeOrmModule,
        imports: [],
        providers: [],
        exports: [],
      };
    }
  }
}

