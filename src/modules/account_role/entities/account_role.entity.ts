import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Account } from 'src/modules/account/entities/account.entities';
import { RoleType } from '../enums/role-type.enum';

@Entity('account_role')
export class AccountRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'role_type',
    type: 'enum',
    enum: RoleType,
    default: RoleType.CUSTOMER,
  })
  roleType: RoleType;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @OneToMany(() => Account, (account) => account.role)
  accounts: Account[];
}
