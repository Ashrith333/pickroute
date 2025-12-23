import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import {
  ValidateCartDto,
  LockSlotDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
  VerifyOtpDto,
  RateOrderDto,
} from './dto/order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('validate-cart')
  @UseGuards(JwtAuthGuard)
  async validateCart(@Request() req, @Body() dto: ValidateCartDto) {
    return this.ordersService.validateCart(req.user.id, dto);
  }

  @Post('lock-slot')
  @UseGuards(JwtAuthGuard)
  async lockSlot(@Request() req, @Body() dto: LockSlotDto) {
    return this.ordersService.lockSlot(req.user.id, dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get('restaurant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async getRestaurantOrders(@Request() req) {
    return this.ordersService.getRestaurantOrders(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    return this.ordersService.updateStatus(id, dto, req.user);
  }

  @Post(':id/verify-otp')
  @UseGuards(JwtAuthGuard)
  async verifyOtp(
    @Param('id') id: string,
    @Body() dto: VerifyOtpDto,
    @Request() req,
  ) {
    return this.ordersService.verifyPickupOtp(id, dto.otp, req.user);
  }

  @Post(':id/rating')
  @UseGuards(JwtAuthGuard)
  async rateOrder(
    @Param('id') id: string,
    @Body() dto: RateOrderDto,
    @Request() req,
  ) {
    return this.ordersService.rateOrder(id, dto, req.user.id);
  }
}

