import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { PaymentType } from '../entities/payment.entity';

export class InitiatePaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentType)
  @IsOptional()
  type?: PaymentType;
}

