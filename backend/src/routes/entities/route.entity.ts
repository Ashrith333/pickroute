import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.routes)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'point' })
  fromLocation: string; // PostGIS point

  @Column({ type: 'point' })
  toLocation: string; // PostGIS point

  @Column({ type: 'point', nullable: true })
  viaLocation: string; // PostGIS point (optional)

  @Column({ type: 'text' })
  polyline: string; // Encoded route polyline

  @Column({ nullable: true })
  transportMode: string; // 'bike' | 'car'

  @Column({ default: 5 })
  maxDetourKm: number;

  @Column({ default: 10 })
  maxWaitTimeMinutes: number;

  @Column({ nullable: true })
  arrivalFlexibilityMinutes: number;

  @Column({ nullable: true })
  scheduledStartTime: Date;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

