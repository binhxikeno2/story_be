import { CategoryEntity, CrawlProcessEntity, CrawlStatus } from 'database/entities';
import { logger } from 'shared/logger/app.logger';
import { DataSource, DeepPartial, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class CrawlProcess1765380300000 implements Seeder {
    private getRandomDate(start: Date, end: Date): Date {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    private async createCrawlProcesses(dataSource: DataSource): Promise<DeepPartial<CrawlProcessEntity>[]> {
        const categoryRepository = dataSource.getRepository(CategoryEntity);
        const categories = await categoryRepository.find();

        if (categories.length === 0) {
            logger.warn('No categories found. Please run Category seeder first.');

            return [];
        }

        const processes: DeepPartial<CrawlProcessEntity>[] = [];
        const now = new Date();
        const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Tạo 5 items với status = CRAWLED
        for (let i = 1; i <= 5; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const startedAt = this.getRandomDate(pastDate, now);
            const endedAt = new Date(startedAt.getTime() + Math.random() * (now.getTime() - startedAt.getTime()));
            const numberOfPosts = Math.floor(Math.random() * 100) + 10; // 10-110 posts

            processes.push({
                name: `Crawl Process ${i} - ${category.name}`,
                status: CrawlStatus.CRAWLED,
                startedProcessAt: startedAt,
                endedProcessAt: endedAt,
                numberOfPostCrawled: numberOfPosts,
                category,
            });
        }

        // Tạo 1 item với status = IN_PROGRESS (process đang chạy)
        const inProgressCategory = categories[Math.floor(Math.random() * categories.length)];
        const inProgressStartedAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Started within last 24 hours
        // Set endedProcessAt trong tương lai để thể hiện process chưa kết thúc
        const inProgressEndedAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        const inProgressPosts = Math.floor(Math.random() * 50) + 5; // 5-55 posts

        processes.push({
            name: `Crawl Process - ${inProgressCategory.name} (In Progress)`,
            status: CrawlStatus.IN_PROGRESS,
            startedProcessAt: inProgressStartedAt,
            endedProcessAt: inProgressEndedAt,
            numberOfPostCrawled: inProgressPosts,
            category: inProgressCategory,
        });

        return processes;
    }

    public async run(dataSource: DataSource): Promise<void> {
        const queryRunner = dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const processes = await this.createCrawlProcesses(dataSource);

            if (processes.length > 0) {
                await queryRunner.manager.save(CrawlProcessEntity, processes, { chunk: 10 });
                logger.info(`🚀 Created ${processes.length} crawl processes successfully!`);
            } else {
                logger.warn('Skipped crawl process creation due to missing categories.');
            }

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

