import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    RestaurantsModule,
    PaymentsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}

