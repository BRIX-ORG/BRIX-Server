import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities';

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ name: 'first_name', nullable: true })
    firstName: string;

    @Column({ name: 'last_name', nullable: true })
    lastName: string;

    @Column({ default: true, name: 'is_active' })
    isActive: boolean;
}
