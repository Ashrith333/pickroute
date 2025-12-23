import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { MenuItem } from '../restaurants/entities/menu-item.entity';
import {
  ValidateCartDto,
  LockSlotDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
  RateOrderDto,
} from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private restaurantsService: RestaurantsService,
  ) {}

  async validateCart(userId: string, dto: ValidateCartDto) {
    const { restaurantId, items } = dto;

    const restaurant = await this.restaurantsService.findOne(restaurantId);
    if (!restaurant || !restaurant.acceptsOrders) {
      throw new BadRequestException('Restaurant not accepting orders');
    }

    // Check capacity
    if (restaurant.currentOrders >= restaurant.maxConcurrentOrders) {
      throw new BadRequestException('Restaurant at full capacity');
    }

    let totalAmount = 0;
    let maxPrepTime = 0;
    const validatedItems = [];

    for (const item of items) {
      // In production, fetch from database
      // For now, assume items exist and are available
      const price = 100; // Mock price
      const prepTime = 15; // Mock prep time

      totalAmount += price * item.quantity;
      maxPrepTime = Math.max(maxPrepTime, prepTime);

      validatedItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price,
        prepTime,
      });
    }

    return {
      valid: true,
      totalAmount,
      estimatedPrepTimeMinutes: maxPrepTime,
      items: validatedItems,
    };
  }

  async lockSlot(userId: string, dto: LockSlotDto) {
    const { restaurantId, arrivalEtaMinutes, userLateByMinutes = 0 } = dto;

    const restaurant = await this.restaurantsService.findOne(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Calculate ready time
    const readyTime = new Date();
    readyTime.setMinutes(readyTime.getMinutes() + restaurant.avgPrepTimeMinutes);

    // Calculate arrival time
    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + arrivalEtaMinutes + userLateByMinutes);

    // Calculate hold window (e.g., 15 minutes after ready)
    const holdWindowEnd = new Date(readyTime);
    holdWindowEnd.setMinutes(holdWindowEnd.getMinutes() + 15);

    return {
      locked: true,
      estimatedReadyTime: readyTime.toISOString(),
      estimatedArrivalTime: arrivalTime.toISOString(),
      holdWindowEnd: holdWindowEnd.toISOString(),
      canProceed: true,
    };
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const {
      restaurantId,
      items,
      arrivalEtaMinutes,
      userLateByMinutes = 0,
      routeId,
      fromLat,
      fromLng,
      toLat,
      toLng,
      detourKm,
    } = dto;

    // Validate cart first
    const cartValidation = await this.validateCart(userId, {
      restaurantId,
      items,
    });

    if (!cartValidation.valid) {
      throw new BadRequestException('Cart validation failed');
    }

    // Lock slot
    const slot = await this.lockSlot(userId, {
      restaurantId,
      arrivalEtaMinutes,
      userLateByMinutes,
    });

    if (!slot.canProceed) {
      throw new BadRequestException('Cannot proceed with order');
    }

    // Generate order number
    const orderNumber = `PR${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Generate OTP for pickup
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + 2); // Valid for 2 hours

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      userId,
      restaurantId,
      totalAmount: cartValidation.totalAmount,
      status: OrderStatus.PENDING,
      pickupOtp,
      pickupOtpExpiresAt: otpExpiresAt,
      estimatedArrivalTime: new Date(slot.estimatedArrivalTime),
      estimatedReadyTime: new Date(slot.estimatedReadyTime),
      routeInfo: routeId
        ? { from: { lat: fromLat, lng: fromLng }, to: { lat: toLat, lng: toLng }, detourKm }
        : null,
    });

    await this.orderRepository.save(order);

    // Create order items
    const orderItems = items.map((item) =>
      this.orderItemRepository.create({
        orderId: order.id,
        menuItemId: item.menuItemId,
        itemName: `Item ${item.menuItemId}`, // In production, fetch from menu
        price: 100, // In production, fetch from menu
        quantity: item.quantity,
        subtotal: 100 * item.quantity,
      }),
    );

    await this.orderItemRepository.save(orderItems);

    // Update restaurant order count
    // Note: In production, use a proper service method or transaction
    // For now, this is handled via the restaurant entity relationship

    return {
      ...order,
      items: orderItems,
      slot,
    };
  }

  async getUserOrders(userId: string) {
    return this.orderRepository.find({
      where: { userId },
      relations: ['restaurant', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRestaurantOrders(ownerId: string) {
    // In production, join with restaurant to filter by owner
    return this.orderRepository.find({
      where: { status: OrderStatus.PENDING },
      relations: ['user', 'items'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, user: User) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['restaurant', 'items', 'payments'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (user.role === 'user' && order.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    user: User,
  ) {
    const order = await this.findOne(id, user);

    order.status = dto.status;

    if (dto.status === OrderStatus.READY) {
      order.actualReadyTime = new Date();
    } else if (dto.status === OrderStatus.PREPARING) {
      // Update estimated ready time if needed
    }

    if (dto.delayReason) {
      order.delayReason = dto.delayReason;
    }

    await this.orderRepository.save(order);

    return order;
  }

  async verifyPickupOtp(id: string, otp: string, user: User) {
    const order = await this.findOne(id, user);

    if (order.pickupOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > order.pickupOtpExpiresAt) {
      throw new BadRequestException('OTP expired');
    }

    order.status = OrderStatus.PICKED_UP;
    order.actualPickupTime = new Date();

    await this.orderRepository.save(order);

    // Update restaurant order count
    const restaurant = await this.restaurantsService.findOne(order.restaurantId);
    if (restaurant) {
      restaurant.currentOrders = Math.max(0, restaurant.currentOrders - 1);
      await this.restaurantsService['restaurantRepository'].save(restaurant);
    }

    return { success: true, order };
  }

  async rateOrder(id: string, dto: RateOrderDto, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException('Can only rate completed orders');
    }

    order.rating = dto.rating;
    order.ratingComment = dto.comment;

    await this.orderRepository.save(order);

    return order;
  }
}

