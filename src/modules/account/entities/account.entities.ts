import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AccountRole } from 'src/modules/account_role/entities/account_role.entity';
import { UserRole } from 'src/modules/auth/auth.dto';

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

  @Column({ type: 'int', name: 'role_id', nullable: false })
  role_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  last_login: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  user_role: UserRole;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;
}
