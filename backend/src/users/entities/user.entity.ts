import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Route } from '../../routes/entities/route.entity';

export enum UserRole {
  USER = 'user',
  RESTAURANT = 'restaurant',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'point', nullable: true })
  currentLocation: string; // PostGIS point

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true, name: 'supabase_user_id' })
  supabaseUserId: string; // Link to Supabase Auth user

  @Column({ nullable: true, name: 'default_role' })
  defaultRole: UserRole; // Preferred default role for login

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Route, (route) => route.user)
  routes: Route[];
}

