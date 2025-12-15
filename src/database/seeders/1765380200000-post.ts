import { ChapterEntity, PostEntity, StoryEntity } from 'database/entities';
import { logger } from 'shared/logger/app.logger';
import { DataSource, DeepPartial, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class Post1765380200000 implements Seeder {
    private categories = [
        'Technology',
        'Science',
        'Travel',
        'Food',
        'Lifestyle',
        'Business',
        'Entertainment',
        'Sports',
        'Health',
        'Education',
    ];

    private tagsList = [
        ['javascript', 'programming', 'web'],
        ['ai', 'machine-learning', 'tech'],
        ['travel', 'adventure', 'photography'],
        ['cooking', 'recipes', 'healthy'],
        ['productivity', 'tips', 'lifestyle'],
        ['startup', 'entrepreneurship', 'business'],
        ['movies', 'tv-shows', 'reviews'],
        ['fitness', 'workout', 'wellness'],
        ['nature', 'wildlife', 'conservation'],
        ['learning', 'education', 'skills'],
    ];

    private getRandomCategory(): string {
        return this.categories[Math.floor(Math.random() * this.categories.length)];
    }

    private getRandomTags(): string[] {
        const tags = this.tagsList[Math.floor(Math.random() * this.tagsList.length)];

        return tags.slice(0, Math.floor(Math.random() * tags.length) + 1);
    }

    private getRandomDate(start: Date, end: Date): Date {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    private async createPosts(): Promise<DeepPartial<PostEntity>[]> {
        const posts: DeepPartial<PostEntity>[] = [];
        const startDate = new Date('2024-01-01');
        const endDate = new Date();

        for (let i = 1; i <= 50; i++) {
            const category = this.getRandomCategory();
            const isRead = Math.random() > 0.5;
            const chaptersCount = Math.floor(Math.random() * 5) + 2; // 2-6 chapters per post

            const chapters: DeepPartial<ChapterEntity>[] = [];

            for (let j = 1; j <= chaptersCount; j++) {
                const storiesCount = Math.floor(Math.random() * 8) + 3; // 3-10 stories per chapter
                const stories: DeepPartial<StoryEntity>[] = [];

                for (let k = 1; k <= storiesCount; k++) {
                    stories.push({
                        title: `Story ${k}: The ${category} Journey - Part ${k}`,
                        media: `https://picsum.photos/seed/post${i}ch${j}st${k}/800/600`,
                    });
                }

                chapters.push({
                    title: `Chapter ${j}: Exploring ${category}`,
                    stories,
                });
            }

            posts.push({
                title: `${category} Guide #${i}: Mastering the Art`,
                description: `This is a comprehensive guide about ${category.toLowerCase()}. Learn everything you need to know in this detailed post with multiple chapters covering various aspects. Perfect for beginners and advanced users alike.`,
                tags: this.getRandomTags(),
                category,
                thumbnailUrl: `https://picsum.photos/seed/post${i}/1200/800`,
                lastUpdated: this.getRandomDate(startDate, endDate),
                isRead,
                chapters,
            });
        }

        return posts;
    }

    public async run(dataSource: DataSource): Promise<void> {
        const queryRunner = dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const posts = await this.createPosts();

            // Save posts with cascade to save chapters and stories
            await queryRunner.manager.save(PostEntity, posts, { chunk: 10 });

            logger.info(`🚀 Created 50 posts with chapters and stories successfully!`);
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
