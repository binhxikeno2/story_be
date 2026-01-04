import { logger } from 'shared/logger/app.logger';

export function parseRapidGatorUrlFromHtml(html: string): string | null {
    try {
        if (!html) {
            return null;
        }

        const rapidGatorRegex = /https?:\/\/rapidgator\.net\/file\/[a-zA-Z0-9]+\/[^"'\s<>]+/gi;
        const match = html.match(rapidGatorRegex);

        if (match && match[0]) {
            return match[0];
        }

        return null;
    } catch (error) {
        logger.error('[parseRapidGatorUrlFromHtml] Error parsing rapidGator URL:', error);

        return null;
    }
}

