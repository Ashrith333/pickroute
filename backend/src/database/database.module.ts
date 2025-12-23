import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        let databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (!databaseUrl) {
          console.warn('⚠️  DATABASE_URL not found - database features disabled');
          // Return a dummy config that won't connect
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

        // Validate URL format
        if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
          console.warn('⚠️  Invalid DATABASE_URL format - database features disabled');
          return {
            type: 'postgres',
            url: 'postgresql://localhost:5432/dummy',
            entities: [],
            synchronize: false,
            logging: false,
            autoLoadEntities: false,
          };
        }

        // Log database host
        try {
          const url = new URL(databaseUrl);
          console.log(`🔍 Database Config: ${url.hostname}:${url.port || 5432}/${url.pathname.replace('/', '')}`);
        } catch (e) {
          console.warn('⚠️  Could not parse DATABASE_URL - database features disabled');
          return {
            type: 'postgres',
            url: 'postgresql://localhost:5432/dummy',
            entities: [],
            synchronize: false,
            logging: false,
            autoLoadEntities: false,
          };
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            max: 5,
            connectionTimeoutMillis: 3000,
          },
          retryAttempts: 2,
          retryDelay: 1000,
          autoLoadEntities: true,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

