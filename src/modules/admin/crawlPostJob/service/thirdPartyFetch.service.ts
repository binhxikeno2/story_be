import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from 'shared/logger/app.logger';
import { getCrawlHeaders } from 'shared/utils/crawlHeaders.util';

@Injectable()
export class ThirdPartyFetchService {
    private readonly cookieFilePath = path.resolve(process.cwd(), 'configs/cookie.txt');

    constructor(private readonly configService: ConfigService) { }

    async fetch(url: string, options: {
        referer?: string;
        secFetchSite?: 'same-origin' | 'none' | 'same-site' | 'cross-site';
    } = {}): Promise<Response> {
        const {
            referer = '',
            secFetchSite = 'same-origin',
        } = options;

        try {
            let cookies = '';

            // Read cookies from configs/cookie.txt
            if (fs.existsSync(this.cookieFilePath)) {
                const cookieContent = fs.readFileSync(this.cookieFilePath, 'utf-8').trim();
                cookies = cookieContent.replace(/\n/g, '; ').replace(/;\s*;/g, ';');
            } else {
                // Fallback to config service if file doesn't exist
                cookies = this.configService.get<string>('CRAWL_COOKIES') || '';
            }

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

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`[ThirdPartyFetch] Error fetching ${url}: ${errorMessage}`);
            throw error;
        }
    }
}

