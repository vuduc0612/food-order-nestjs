import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from 'src/modules/order/entities/order.entity';
import { Dish } from 'src/modules/dish/entities/dish.entity';

@Entity('order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.orderDetails)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'int' })
  order_id: number;

  @ManyToOne(() => Dish, (dish) => dish.orderDetails)
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;

  @Column({ type: 'int' })
  dish_id: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'text', nullable: true })
  note: string;
}
