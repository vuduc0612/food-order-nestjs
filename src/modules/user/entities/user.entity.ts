import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from 'src/modules/order/entities/order.entity';
import { Account } from 'src/modules/account/entities/account.entities';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'account_id' })
  account_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;
  
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
