import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from 'shared/logger/app.logger';
import { getCrawlHeaders } from 'shared/utils/crawlHeaders.util';

@Injectable()
export class ThirdPartyFetchService {
    constructor(private readonly configService: ConfigService) { }

    async fetch(url: string, options: {
        referer?: string;
        secFetchSite?: 'same-origin' | 'none' | 'same-site' | 'cross-site';
    } = {}): Promise<Response> {
        const {
            referer = '',
            secFetchSite = 'none',
        } = options;

        try {
            const cookies = this.configService.get<string>('CRAWL_COOKIES') || '';
            const headers = getCrawlHeaders({
                cookies,
                referer,
                secFetchSite,
            });

            const response = await fetch(url, {
                headers,
                method: 'GET',
                redirect: 'follow',
                credentials: 'include',
            });

            console.log('response---', response);

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`[ThirdPartyFetch] Error fetching ${url}: ${errorMessage}`);
            throw error;
        }
    }
}

