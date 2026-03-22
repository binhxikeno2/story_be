import { Injectable } from '@nestjs/common';
import { TagEntity } from 'database/entities';
import { DataSource, In, IsNull } from 'typeorm';

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

    // --- normalize chuẩn tiếng Nhật ---
    const toKatakana = (str: string) =>
      str.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));

    const normalizeJa = (s: string) => toKatakana(s).normalize('NFKC').trim().toLowerCase();

    // ❗ dùng normalizeJa thay vì normalize cũ
    const normalizedNames = names.map(normalizeJa);

    // ❗ vẫn query theo name → phải normalize lại DB data khi compare
    const existingTags = await this.findBy({
      name: In(names), // giữ nguyên để match DB hiện tại
    });

    const existingTagNames = new Set(existingTags.map((tag) => normalizeJa(tag.name)));

    const newTagNames = normalizedNames.filter((name) => !existingTagNames.has(name));

    let allTags: TagEntity[] = [...existingTags];

    if (newTagNames.length > 0) {
      // ⚠️ map lại về original name (tránh lưu normalized)
      const newTags = newTagNames.map((normName, index) =>
        this.getRepository().create({
          name: names[index], // giữ original input
        }),
      );

      const savedTags = await this.bulkSave(newTags);
      allTags = [...existingTags, ...savedTags];
    }

    return allTags;
  }

  public async getTagsToSync(): Promise<TagEntity[]> {
    return this.find({
      where: {
        threeHappyGuyTagId: IsNull(),
      },
    });
  }
}
