import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  category: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: 0 })
  prepTimeMinutes: number;

  @Column({ default: true, name: 'isVeg' })
  isVeg: boolean;

  @Column({ default: false, name: 'isFastPickup' })
  isFastPickup: boolean;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuItems)
  @JoinColumn()
  restaurant: Restaurant;

  @Column()
  restaurantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

