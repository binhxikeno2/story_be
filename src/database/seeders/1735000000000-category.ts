import { CategoryEntity } from 'database/entities';
import { logger } from 'shared/logger/app.logger';
import { DataSource, QueryFailedError } from 'typeorm';
import { Seeder } from 'typeorm-extension';

interface CategoryData {
    name: string;
    slug: string;
    description: string;
    url3thParty: string;
    parent: string | null;
}

export class Category1735000000000 implements Seeder {
    private categories: CategoryData[] = [
        { name: '漫画', slug: 'manga', description: '漫画', url3thParty: 'https://x3dl.net/wp/category/manga', parent: null },
        { name: '一般漫画', slug: 'manga/normal-manga', description: '123', url3thParty: 'https://x3dl.net/wp/category/manga/normal-manga', parent: 'manga' },
        { name: '少女漫画', slug: 'manga/girls-manga', description: '少女漫画', url3thParty: 'https://x3dl.net/wp/category/manga/girls-manga', parent: 'manga' },
        { name: '連載漫画', slug: 'manga/rensaimanga', description: '連載漫画', url3thParty: 'https://x3dl.net/wp/category/manga/rensaimanga', parent: 'manga' },
        { name: '百合漫画', slug: 'manga/yuri', description: '百合漫画', url3thParty: 'https://x3dl.net/wp/category/manga/yuri', parent: 'manga' },
        { name: '漫画雑誌', slug: 'manga/manga-magazine', description: '漫画雑誌', url3thParty: 'https://x3dl.net/wp/category/manga/manga-magazine', parent: null },
        { name: '雑誌', slug: 'other-magazine', description: '雑誌', url3thParty: 'https://x3dl.net/wp/category/other-magazine', parent: null },
        { name: '小説', slug: 'novel', description: '小説', url3thParty: 'https://x3dl.net/wp/category/novel', parent: null },
        { name: '一般小説(ライトノベル)', slug: 'novel/light-novel', description: '一般小説(ライトノベル)', url3thParty: 'https://x3dl.net/wp/category/novel/light-novel', parent: 'novel' },
        { name: '女性向けライトノベル', slug: 'novel/women-novels', description: '女性向けライトノベル', url3thParty: 'https://x3dl.net/wp/category/novel/women-novels', parent: 'novel' },
        { name: '成年', slug: 'adult', description: '成年', url3thParty: 'https://x3dl.net/wp/category/adult', parent: null },
        { name: '成年漫画', slug: 'adult/adult-manga', description: '成年漫画', url3thParty: 'https://x3dl.net/wp/category/adult/adult-manga', parent: 'adult' },
        { name: '成年雑誌', slug: 'adult/adult-magazine', description: '成年雑誌', url3thParty: 'https://x3dl.net/wp/category/adult/adult-magazine', parent: 'adult' },
        { name: '成年小説', slug: 'adult/adult-novel', description: '成年小説', url3thParty: 'https://x3dl.net/wp/category/adult/adult-novel', parent: 'adult' },
        { name: '成年写真', slug: 'adult/adult-photo', description: '成年写真', url3thParty: 'https://x3dl.net/wp/category/adult/adult-photo', parent: 'adult' },
        { name: '日本', slug: 'adult/adult-photo/nihonp', description: '日本', url3thParty: 'https://x3dl.net/wp/category/adult/adult-photo/nihonp', parent: 'adult/adult-photo' },
        { name: '成年画集／その他', slug: 'adult/adultartbook', description: '成年画集／その他', url3thParty: 'https://x3dl.net/wp/category/adult/adultartbook', parent: 'adult' },      
        { name: 'リク応', slug: 'riku/furuisundeshuppina', description: 'リク応', url3thParty: 'https://x3dl.net/wp/category/riku/furuisundeshuppina', parent: 'adult' },
        { name: 'やおい', slug: 'yaoi', description: 'やおい', url3thParty: 'https://x3dl.net/wp/category/yaoi', parent: null },
        { name: 'やおい漫画', slug: 'yaoi/yaoi-manga', description: 'やおい漫画', url3thParty: 'https://x3dl.net/wp/category/yaoi/yaoi-manga', parent: 'yaoi' },
        { name: 'やおい雑誌', slug: 'yaoi/%e3%82%84%e3%81%8a%e3%81%84%e9%9b%91%e8%aa%8c', description: 'やおい雑誌', url3thParty: 'https://x3dl.net/wp/category/yaoi/%e3%82%84%e3%81%8a%e3%81%84%e9%9b%91%e8%aa%8c', parent: 'yaoi' },
        { name: 'やおい小説', slug: 'yaoi/yaoi-novel', description: 'やおい小説', url3thParty: 'https://x3dl.net/wp/category/yaoi/yaoi-novel', parent: 'yaoi' },
        { name: 'やおいCD(BLCD)', slug: 'yaoi/yaoi-blcd', description: 'やおいCD(BLCD)', url3thParty: 'https://x3dl.net/wp/category/yaoi/yaoi-blcd', parent: 'yaoi' },
        { name: 'その他', slug: 'etc', description: 'その他', url3thParty: 'https://x3dl.net/wp/category/etc', parent: null },
        { name: '社会／政治', slug: 'etc/shakai-seiji', description: '社会／政治', url3thParty: 'https://x3dl.net/wp/category/etc/shakai-seiji', parent: 'etc/etc2' },
        { name: '人文／思想', slug: 'etc/jinbun-shisou', description: '人文／思想', url3thParty: 'https://x3dl.net/wp/category/etc/jinbun-shisou', parent: 'etc/etc2' },
        { name: '車／乗り物', slug: 'etc/kuruma-norimono', description: '車／乗り物', url3thParty: 'https://x3dl.net/wp/category/etc/kuruma-norimono', parent: 'etc/etc2' },
        { name: '科学／医学／生物', slug: 'etc/kagaku-technology', description: '科学／医学／生物', url3thParty: 'https://x3dl.net/wp/category/etc/kagaku-technology', parent: 'etc/etc2' },
        { name: '語学', slug: 'etc/gogaku', description: '語学', url3thParty: 'https://x3dl.net/wp/category/etc/gogaku', parent: 'etc/etc2' },
        { name: '楽器／音楽', slug: 'etc/gakki-ongaku', description: '楽器／音楽', url3thParty: 'https://x3dl.net/wp/category/etc/gakki-ongaku', parent: 'etc/etc2' },
        { name: '写真集', slug: 'etc/shashinshu', description: '写真集', url3thParty: 'https://x3dl.net/wp/category/etc/shashinshu', parent: 'etc/etc2' },
        { name: '一般写真', slug: 'etc/shashinshu/jin-butsu-shashin', description: '一般写真', url3thParty: 'https://x3dl.net/wp/category/etc/shashinshu/jin-butsu-shashin', parent: 'etc/shashinshu' },
        { name: 'アート／建築／デザイン', slug: 'etc/%e3%82%a2%e3%83%bc%e3%83%88%ef%bc%8f%e5%bb%ba%e7%af%89%ef%bc%8f%e3%83%87%e3%82%b6%e3%82%b6%e3%82%a4%e3%83%b3', description: 'アート／建築／デザイン', url3thParty: 'https://x3dl.net/wp/category/etc/%e3%82%a2%e3%83%bc%e3%83%88%ef%bc%8f%e5%bb%ba%e7%af%89%ef%bc%8f%e3%83%87%e3%82%b6%e3%82%a4%e3%83%b3', parent: 'etc/etc2' },
        { name: '英語本', slug: 'etc/englishedition', description: '英語本', url3thParty: 'https://x3dl.net/wp/category/etc/englishedition', parent: 'etc/etc2' },
        { name: '暮らし／子育て', slug: 'etc/kurashi-kosodate', description: '暮らし／子育て', url3thParty: 'https://x3dl.net/wp/category/etc/kurashi-kosodate', parent: 'etc' },
        { name: '植物／園芸', slug: 'etc/kurashi-kosodate/shokubutsu-engei', description: '植物／園芸', url3thParty: 'https://x3dl.net/wp/category/etc/kurashi-kosodate/shokubutsu-engei', parent: 'etc/kurashi-kosodate' },
        { name: 'ペット', slug: 'etc/kurashi-kosodate/pet', description: 'ペット', url3thParty: 'https://x3dl.net/wp/category/etc/kurashi-kosodate/pet', parent: 'etc/kurashi-kosodate' },
        { name: '健康／美容', slug: 'etc/kurashi-kosodate/kenkou-biyou', description: '健康／美容', url3thParty: 'https://x3dl.net/wp/category/etc/kurashi-kosodate/kenkou-biyou', parent: 'etc/kurashi-kosodate' },
        { name: 'スポーツ／アウトドア', slug: 'etc/kurashi-kosodate/sports', description: 'スポーツ／アウトドア', url3thParty: 'https://x3dl.net/wp/category/etc/kurashi-kosodate/sports', parent: 'etc/kurashi-kosodate' },
        { name: '食／飲／レシピ', slug: 'etc/shoku-reshipi', description: '食／飲／レシピ', url3thParty: 'https://x3dl.net/wp/category/etc/shoku-reshipi', parent: 'etc' },
        { name: 'PC／IT／スマホ', slug: 'etc/pc-it-phone', description: 'PC／IT／スマホ', url3thParty: 'https://x3dl.net/wp/category/etc/pc-it-phone', parent: 'etc' },
        { name: '旅行／景色', slug: 'etc/ryokou-keshiki', description: '旅行／景色', url3thParty: 'https://x3dl.net/wp/category/etc/ryokou-keshiki', parent: 'etc' },
        { name: '趣味／実用／娯楽', slug: 'etc/shumi-jitsuyou', description: '趣味／実用／娯楽', url3thParty: 'https://x3dl.net/wp/category/etc/shumi-jitsuyou', parent: 'etc' },
        { name: '画集／公式書', slug: 'etc/kaisetsu-gashu', description: '画集／公式書', url3thParty: 'https://x3dl.net/wp/category/etc/kaisetsu-gashu', parent: 'etc' },
        { name: '画集', slug: 'etc/kaisetsu-gashu/gashu', description: '画集', url3thParty: 'https://x3dl.net/wp/category/etc/kaisetsu-gashu/gashu', parent: 'etc/kaisetsu-gashu' },
        { name: '解説／考察／公式書', slug: 'etc/kaisetsu-gashu/kaisetsu-kousatsu', description: '解説／考察／公式書', url3thParty: 'https://x3dl.net/wp/category/etc/kaisetsu-gashu/kaisetsu-kousatsu', parent: 'etc/kaisetsu-gashu' },
        { name: '歴史／地理', slug: 'etc/rekishi', description: '歴史／地理', url3thParty: 'https://x3dl.net/wp/category/etc/rekishi', parent: 'etc' },
        { name: '文学／評論', slug: 'etc/bungaku', description: '文学／評論', url3thParty: 'https://x3dl.net/wp/category/etc/bungaku', parent: 'etc' },
        { name: 'ビジネス／経済', slug: 'etc/business-keizai', description: 'ビジネス／経済', url3thParty: 'https://x3dl.net/wp/category/etc/business-keizai', parent: 'etc' }
      ]
      ;

    public async run(dataSource: DataSource): Promise<void> {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const repository = queryRunner.manager.getRepository(CategoryEntity);
            const categoryMap = new Map<string, CategoryEntity>();

            // First pass: Create all categories without parent
            for (const catData of this.categories) {
                const exists = await repository.findOne({ where: { slug: catData.slug } });

                if (!exists) {
                    const category = repository.create({
                        name: catData.name,
                        slug: catData.slug,
                        description: catData.description,
                        url3thParty: catData.url3thParty,
                    });

                    const saved = await repository.save(category);
                    categoryMap.set(catData.slug, saved);
                } else {
                    categoryMap.set(catData.slug, exists);
                }
            }

            // Second pass: Update parent relationships
            for (const catData of this.categories) {
                if (catData.parent) {
                    const category = categoryMap.get(catData.slug);
                    const parent = categoryMap.get(catData.parent);

                    if (category && parent) {
                        category.parentId = parent.id;
                        await repository.save(category);
                    }
                }
            }

            logger.info(`🚀 Created/Updated ${this.categories.length} categories successfully!`);
            await queryRunner.commitTransaction();
        } catch (err) {
            if (err instanceof QueryFailedError) {
                logger.error(err.message);
            }

            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}

