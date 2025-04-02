import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AccountRole } from 'src/modules/account_role/entities/account_role.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ManyToOne(() => AccountRole, (role) => role.accounts)
  @JoinColumn({ name: 'role_id' })
  role: AccountRole;

  @Column({ type: 'int' })
  role_id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'datetime' })
  created_at: Date;
}
