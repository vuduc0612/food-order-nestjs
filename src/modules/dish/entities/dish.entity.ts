import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Restaurant } from 'src/modules/restaurant/entities/restaurant.entity';
import { Category } from 'src/modules/category/entities/category.entity';
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

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string;

  @Column({ type: 'boolean' })
  is_available: boolean;

  @Column({ type: 'datetime' })
  created_at: Date;
  
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.dish)
  orderDetails: OrderDetail[];
}
