import { logger } from 'shared/logger/app.logger';

export interface PaginationResult {
    pageFrom: number;
    pageTo: number;
}

export function parsePaginationFromHtml(html: string): PaginationResult | null {
    try {
        const paginationRegex = /<div[^>]*class=["'][^"']*mh-loop-pagination[^"']*["'][^>]*>([\s\S]*?)<\/div>/i;
        const paginationMatch = html.match(paginationRegex);

        if (!paginationMatch) {
            return null;
        }

        const paginationHtml = paginationMatch[1];
        const pageNumberRegex = /<(?:span|a)[^>]*class=["'][^"']*page-numbers[^"']*["'][^>]*>([\d,]+)<\/(?:span|a)>/gi;

        const pageNumbers: number[] = [];
        let match: RegExpExecArray | null;

        while ((match = pageNumberRegex.exec(paginationHtml)) !== null) {
            const pageNumberStr = match[1];
            if (pageNumberStr) {
                const pageNumber = parseInt(pageNumberStr.replace(/,/g, ''), 10);
                if (!isNaN(pageNumber) && pageNumber > 0) {
                    pageNumbers.push(pageNumber);
                }
            }
        }

        if (pageNumbers.length === 0) {
            return null;
        }

        const pageFrom = Math.min(...pageNumbers);
        const pageTo = Math.max(...pageNumbers);

        return {
            pageFrom,
            pageTo,
        };
    } catch (error) {
        logger.error('[parsePaginationFromHtml] Error parsing pagination HTML:', error);

        return null;
    }
}
