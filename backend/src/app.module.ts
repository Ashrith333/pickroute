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
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not defined in environment variables');
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
        };
      },
    }),
    RedisModule,
    SmsModule,
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

