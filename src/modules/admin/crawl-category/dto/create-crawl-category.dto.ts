import { CrawlStatus } from '../../../../shared/constants/crawl.constant';
import { CheckApiProperty } from '../../../../shared/validators/checkProperty.decorator';

export class CreateCrawlCategoryDto {
    @CheckApiProperty({ required: true })
    name: string;

    @CheckApiProperty({ required: false, type: 'number' })
    pageFrom?: number;

    @CheckApiProperty({ required: false, type: 'number' })
    pageTo?: number;

    @CheckApiProperty({ required: false, type: 'number' })
    categoryId?: number;

    @CheckApiProperty({ required: true, enum: CrawlStatus })
    status: CrawlStatus;
}

