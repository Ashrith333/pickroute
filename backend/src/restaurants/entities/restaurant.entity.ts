import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'point' })
  location: string; // PostGIS point

  @Column()
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'simple-array', nullable: true })
  cuisines: string[];

  @Column({ default: 0 })
  avgPrepTimeMinutes: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  acceptsOrders: boolean;

  @Column({ default: 10 })
  maxConcurrentOrders: number;

  @Column({ default: 0 })
  currentOrders: number;

  @Column({ nullable: true })
  parkingAvailable: boolean;

  @Column({ nullable: true })
  sameSideOfRoad: boolean;

  @Column({ type: 'jsonb', nullable: true })
  operatingHours: Record<string, { open: string; close: string; breaks?: { start: string; end: string }[] }>;

  // Onboarding fields
  @Column({ nullable: true, name: 'legalName' })
  legalName: string;

  @Column({ nullable: true, name: 'displayName' })
  displayName: string;

  @Column({ nullable: true, name: 'fssaiNumber' })
  fssaiNumber: string;

  @Column({ nullable: true, name: 'primaryContactName' })
  primaryContactName: string;

  @Column({
    type: 'varchar',
    default: 'draft',
  })
  status: 'draft' | 'pending_approval' | 'live' | 'paused' | 'suspended';

  @Column({ nullable: true, name: 'entryPickupPoint', type: 'text' })
  entryPickupPoint: string;

  @Column({ nullable: true })
  landmark: string;

  // Prep & Capacity
  @Column({ default: 15, name: 'defaultPrepTimeMinutes' })
  defaultPrepTimeMinutes: number;

  @Column({ default: 5, name: 'maxOrdersPer15Min' })
  maxOrdersPer15Min: number;

  @Column({ default: 10, name: 'maxOrdersPer30Min' })
  maxOrdersPer30Min: number;

  @Column({ default: 10, name: 'holdTimeAfterReadyMinutes' })
  holdTimeAfterReadyMinutes: number;

  @Column({ default: 5, name: 'peakHourBufferMinutes' })
  peakHourBufferMinutes: number;

  @Column({ default: false, name: 'autoAcceptOrders' })
  autoAcceptOrders: boolean;

  // Bank details
  @Column({ nullable: true, name: 'bankAccountNumber' })
  bankAccountNumber: string;

  @Column({ nullable: true, name: 'bankIfscCode' })
  bankIfscCode: string;

  @Column({ nullable: true, name: 'bankAccountName' })
  bankAccountName: string;

  @Column({ nullable: true, name: 'pickupInstructions', type: 'text' })
  pickupInstructions: string;

  @OneToOne(() => User)
  @JoinColumn()
  owner: User;

  @Column({ nullable: true })
  ownerId: string;

  @OneToMany(() => MenuItem, (item) => item.restaurant)
  menuItems: MenuItem[];

  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

