import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dish } from 'src/modules/dish/entities/dish.entity';
import { Restaurant } from 'src/modules/restaurant/entities/restaurant.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string;

  @OneToMany(() => Dish, (dish) => dish.category)
  dishes: Dish[];

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.category)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;
}
