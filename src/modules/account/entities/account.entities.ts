import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { AccountRole } from 'src/modules/account_role/entities/account_role.entity';
import { Restaurant } from 'src/modules/restaurant/entities/restaurant.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @OneToMany(() => AccountRole, (role) => role.account)
  roles: AccountRole[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  last_login: Date;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @OneToOne(() => Restaurant, (restaurant) => restaurant.account)
  restaurant: Restaurant;

  @OneToOne(() => User, (user) => user.account)
  user: User;
}
