import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders)
  @JoinColumn()
  restaurant: Restaurant;

  @Column()
  restaurantId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  pickupOtp: string;

  @Column({ nullable: true })
  pickupOtpExpiresAt: Date;

  @Column({ nullable: true })
  estimatedArrivalTime: Date;

  @Column({ nullable: true })
  estimatedReadyTime: Date;

  @Column({ nullable: true })
  actualReadyTime: Date;

  @Column({ nullable: true })
  actualPickupTime: Date;

  @Column({ nullable: true })
  delayReason: string;

  @Column({ nullable: true })
  userLateByMinutes: number;

  @Column({ type: 'jsonb', nullable: true })
  routeInfo: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    detourKm: number;
    arrivalEta: number;
  };

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @Column({ nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  ratingComment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

