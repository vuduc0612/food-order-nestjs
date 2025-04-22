import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Category } from '../../category/entities/category.entity';
import { OrderDetail } from 'src/modules/order_detail/entities/order_detail.entity';

@Entity('dishes')
export class Dish {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Category, (category) => category.dishes)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'int' })
  category_id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.dishes)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'int' })
  restaurant_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnail: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.dish)
  orderDetails: OrderDetail[];
}