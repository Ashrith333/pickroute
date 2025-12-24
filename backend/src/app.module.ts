import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { OrdersModule } from './orders/orders.module';
import { RoutesModule } from './routes/routes.module';
import { PaymentsModule } from './payments/payments.module';
import { RedisModule } from './redis/redis.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    // Database connection - configured to not block startup
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        let databaseUrl = process.env.DATABASE_URL;
        
        if (!databaseUrl) {
          console.warn('⚠️  DATABASE_URL not found - database features disabled');
          // Return dummy config that won't block
          return {
            type: 'postgres',
            url: 'postgresql://localhost:5432/dummy',
            entities: [],
            synchronize: false,
            logging: false,
            autoLoadEntities: false,
          };
        }

        // Remove quotes if present
        databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '');

        // Log database host (for debugging)
        try {
          const url = new URL(databaseUrl);
          console.log(`🔍 Database Config (TypeORM): ${url.hostname}:${url.port || 5432}/${url.pathname.replace('/', '')}`);
          console.log(`   Note: This is for direct PostgreSQL connection (different from SUPABASE_URL)`);
        } catch (e) {
          console.warn('⚠️  Could not parse DATABASE_URL');
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: process.env.NODE_ENV === 'development',
          logging: process.env.NODE_ENV === 'development',
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            max: 3,
            connectionTimeoutMillis: 5000, // 5 seconds - more reasonable for pooler
            idleTimeoutMillis: 30000,
            // Use connection pooler settings
            statement_timeout: 5000,
            query_timeout: 5000,
          },
          retryAttempts: 0, // No retries during startup
          autoLoadEntities: true,
        };
      },
    }),
    RedisModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    OrdersModule,
    RoutesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
