import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Dish } from 'src/modules/dish/entities/dish.entity';
import { Order } from 'src/modules/order/entities/order.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string;

  @OneToMany(() => Dish, (dish) => dish.restaurant)
  dishes: Dish[];

  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];
}
