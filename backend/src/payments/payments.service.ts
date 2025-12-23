import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { InitiatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
  ) {}

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    const { orderId, amount, type = PaymentType.FULL } = dto;

    // Verify order exists and belongs to user
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Order cannot be paid');
    }

    // Check if already paid
    const existingPayment = await this.paymentRepository.findOne({
      where: { orderId, status: PaymentStatus.SUCCESS },
    });

    if (existingPayment) {
      throw new BadRequestException('Order already paid');
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      orderId,
      amount,
      type,
      status: PaymentStatus.PROCESSING,
    });

    await this.paymentRepository.save(payment);

    // In production, integrate with payment gateway (Razorpay, Stripe, etc.)
    const gatewayKey = this.configService.get('PAYMENT_GATEWAY_KEY');

    // Mock payment gateway response
    const gatewayTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate payment processing
    // In production, this would be an async call to payment gateway
    payment.status = PaymentStatus.SUCCESS;
    payment.gatewayTransactionId = gatewayTransactionId;
    payment.gatewayResponse = JSON.stringify({ success: true });

    await this.paymentRepository.save(payment);

    // Update order paid amount
    order.paidAmount = (order.paidAmount || 0) + amount;
    await this.orderRepository.save(order);

    return {
      success: true,
      paymentId: payment.id,
      transactionId: gatewayTransactionId,
      amount,
      status: payment.status,
    };
  }

  async handleWebhook(body: any) {
    // In production, verify webhook signature
    const { transactionId, status, orderId } = body;

    const payment = await this.paymentRepository.findOne({
      where: { gatewayTransactionId: transactionId },
      relations: ['order'],
    });

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    // Update payment status
    if (status === 'success') {
      payment.status = PaymentStatus.SUCCESS;
      if (payment.order) {
        payment.order.paidAmount = (payment.order.paidAmount || 0) + payment.amount;
        await this.orderRepository.save(payment.order);
      }
    } else if (status === 'failed') {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = body.failureReason || 'Payment failed';
    }

    await this.paymentRepository.save(payment);

    return { success: true };
  }

  async refundPayment(paymentId: string, reason?: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Can only refund successful payments');
    }

    // In production, call payment gateway refund API
    payment.status = PaymentStatus.REFUNDED;
    payment.refundTransactionId = `refund_${Date.now()}`;

    await this.paymentRepository.save(payment);

    return payment;
  }
}

