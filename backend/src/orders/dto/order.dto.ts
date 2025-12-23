import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../entities/order.entity';

class CartItemDto {
  @IsString()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ValidateCartDto {
  @IsString()
  restaurantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}

export class LockSlotDto {
  @IsString()
  restaurantId: string;

  @IsNumber()
  arrivalEtaMinutes: number;

  @IsNumber()
  @IsOptional()
  userLateByMinutes?: number;
}

export class CreateOrderDto {
  @IsString()
  restaurantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsNumber()
  arrivalEtaMinutes: number;

  @IsNumber()
  @IsOptional()
  userLateByMinutes?: number;

  @IsString()
  @IsOptional()
  routeId?: string;

  @IsNumber()
  @IsOptional()
  fromLat?: number;

  @IsNumber()
  @IsOptional()
  fromLng?: number;

  @IsNumber()
  @IsOptional()
  toLat?: number;

  @IsNumber()
  @IsOptional()
  toLng?: number;

  @IsNumber()
  @IsOptional()
  detourKm?: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  @IsOptional()
  delayReason?: string;
}

export class VerifyOtpDto {
  @IsString()
  otp: string;
}

export class RateOrderDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

