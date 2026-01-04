import { logger } from 'shared/logger/app.logger';

export function parseDetailUrlsFromHtml(html: string): string[] {
    try {
        const detailUrls: string[] = [];
        const h3TitleRegex = /<h3[^>]*class=["'][^"']*entry-title[^"']*mh-loop-title[^"']*["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>/gi;

        let match: RegExpExecArray | null;

        while ((match = h3TitleRegex.exec(html)) !== null) {
            const url = match[1];
            if (url && !detailUrls.includes(url)) {
                detailUrls.push(url);
            }
        }

        return detailUrls;
    } catch (error) {
        logger.error('[parseDetailUrlsFromHtml] Error parsing detail URLs from HTML:', error);

        return [];
    }
}

