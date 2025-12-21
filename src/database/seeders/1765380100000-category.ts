import { CategoryEntity } from 'database/entities';
import { logger } from 'shared/logger/app.logger';
import { DataSource, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class Category1765380100000 implements Seeder {
    private categories = [
        { name: 'Technology', slug: 'technology', description: 'Latest tech news and reviews' },
        { name: 'Science', slug: 'science', description: 'Discoveries and innovations' },
        { name: 'Travel', slug: 'travel', description: 'Explore the world' },
        { name: 'Food', slug: 'food', description: 'Delicious recipes and dining' },
        { name: 'Lifestyle', slug: 'lifestyle', description: 'Living your best life' },
        { name: 'Business', slug: 'business', description: 'Market insights and trends' },
        { name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and more' },
        { name: 'Sports', slug: 'sports', description: 'Scores, teams, and athletes' },
        { name: 'Health', slug: 'health', description: 'Wellness and fitness' },
        { name: 'Education', slug: 'education', description: 'Learning and growth' },
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
