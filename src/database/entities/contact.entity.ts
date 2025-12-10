import { IsEmail } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('contact')
export class ContactEntity extends BaseEntity {
  @Column({
    length: 128,
  })
  public name: string;

  @Column({
    length: 255,
  })
  @IsEmail()
  public email: string;

  @Column({
    length: 128,
  })
  public subject: string;

  @Column('text')
  public message: string;
}
