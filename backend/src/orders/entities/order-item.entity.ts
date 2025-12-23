import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { MenuItem } from '../../restaurants/entities/menu-item.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn()
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => MenuItem)
  @JoinColumn()
  menuItem: MenuItem;

  @Column()
  menuItemId: string;

  @Column()
  itemName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn()
  createdAt: Date;
}

