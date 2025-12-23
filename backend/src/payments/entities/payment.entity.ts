import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentType {
  FULL = 'full',
  PARTIAL = 'partial',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn()
  order: Order;

  @Column()
  orderId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.FULL,
  })
  type: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  gatewayTransactionId: string;

  @Column({ nullable: true })
  gatewayResponse: string; // JSON string

  @Column({ nullable: true })
  refundTransactionId: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

