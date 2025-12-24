import { CategoryEntity } from 'database/entities';
import { logger } from 'shared/logger/app.logger';
import { DataSource, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class Category1765380100000 implements Seeder {
    private categories = [
        {
            name: '一般漫画',
            slug: 'ippan-manga',
            description: 'Manga thông thường',
            url3thParty: 'https://x3dl.net/wp/category/manga/normal-manga',
        },
        {
            name: '少女漫画',
            slug: 'shoujo-manga',
            description: 'Manga dành cho thiếu nữ',
            url3thParty: 'https://x3dl.net/wp/category/shoujo-manga/',
        },
        {
            name: 'ライトノベル',
            slug: 'light-novel',
            description: 'Light Novel',
            url3thParty: 'https://x3dl.net/wp/category/light-novel/',
        },
        {
            name: '成年漫画',
            slug: 'seinen-manga',
            description: 'Manga dành cho người lớn',
            url3thParty: 'https://x3dl.net/wp/category/seinen-manga/',
        },
        {
            name: 'やおい漫画',
            slug: 'yaoi-manga',
            description: 'Yaoi Manga',
            url3thParty: 'https://x3dl.net/wp/category/yaoi-manga/',
        },
    ];

    public async run(dataSource: DataSource): Promise<void> {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const repository = queryRunner.manager.getRepository(CategoryEntity);

            for (const cat of this.categories) {
                const exists = await repository.findOne({ where: { slug: cat.slug } });
                if (!exists) {
                    await repository.save(repository.create({
                        ...cat,
                        thumbnailUrl: `https://picsum.photos/seed/${cat.slug}/800/600`,
                    }));
                }
            }

            logger.info(`🚀 Created categories successfully!`);
            await queryRunner.commitTransaction();
        } catch (err) {
            if (err instanceof QueryFailedError) {
                logger.error(err.message);
            }

            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    }
}
