import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export function AutoIdColumn(options: 'number' | 'uuid'): PropertyDecorator {
  if (options === 'uuid') {
    return PrimaryGeneratedColumn('uuid');
  }

  return PrimaryGeneratedColumn('increment', { type: 'bigint' });
}

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt: Date;
}

export abstract class AutoUUIDEntity {
  @AutoIdColumn('uuid')
  public id: string;
}
