import { Injectable } from '@nestjs/common';
import { TagEntity } from 'database/entities';
import { DataSource, In } from 'typeorm';

import { BaseRepository } from './base.repository';

@Injectable()
export class TagRepository extends BaseRepository<TagEntity> {
  constructor(dataSource: DataSource) {
    super(TagEntity, dataSource);
  }

  public async getOrCreateTags(names: string[]): Promise<TagEntity[]> {
    if (!names || names.length === 0) {
      return [];
    }

    const existingTags = await this.findBy({ name: In(names) });
    const existingTagNames = new Set(existingTags.map((tag) => tag.name));
    const newTagNames = names.filter((name) => !existingTagNames.has(name));

    let allTags: TagEntity[] = [...existingTags];

    if (newTagNames.length > 0) {
      const newTags = newTagNames.map((name) => this.getRepository().create({ name }));
      const savedTags = await this.bulkSave(newTags);
      allTags = [...existingTags, ...savedTags];
    }

    return allTags;
  }
}
