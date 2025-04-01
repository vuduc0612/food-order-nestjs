import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Dish } from 'src/modules/dish/entities/dish.entity';

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
}
