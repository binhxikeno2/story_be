import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { ZenRows } from 'zenrows';
import got from 'cloudflare-scraper';
import { logger } from 'shared/logger/app.logger';
import { ZenRows } from 'zenrows';

@Injectable()
export class ThirdPartyApiService {
    private readonly zenRows: ZenRows;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('ZENROWS_API_KEY');

        if (!apiKey) {
            throw new Error('ZENROWS_API_KEY is not configured in environment variables');
        }

        this.zenRows = new ZenRows(apiKey, {
            concurrency: 5,
            retries: 1,
        });
    }

    async fetchHtmlWithZenRows(url: string) {
        try {
            const response = await this.zenRows.get(url, {
                proxy_country: "jp",
                premium_proxy: true,
                js_render: true,
            });

            const html = await response.text();
            const finalUrl = this.extractFinalUrlFromResponse(response, html) || url;

            return {
                html,
                finalUrl,
                errorMessage: '',
            }
        } catch (error) {
            logger.error(`[ThirdPartyApiService] Failed to fetch HTML from ${url}: ${error.message}`);

            return {
                html: '',
                finalUrl: url,
                errorMessage: error.message,
            }
        }
    }

    private extractFinalUrlFromResponse(response: Response, html: string): string | null {
        try {
            const locationHeader = response.headers.get('location');

            if (locationHeader && (locationHeader.startsWith('http://') || locationHeader.startsWith('https://'))) {
                return locationHeader;
            }

            if (!html) {
                return null;
            }

            const windowLocationRegex = /window\.location\s*=\s*["']([^"']+)["']/gi;
            const windowLocationHrefRegex = /window\.location\.href\s*=\s*["']([^"']+)["']/gi;
            const metaRefreshRegex = /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"';]+)["']/gi;
            const locationReplaceRegex = /location\.replace\s*\(\s*["']([^"']+)["']/gi;
            const rapidGatorUrlRegex = /https?:\/\/rapidgator\.net\/file\/[a-zA-Z0-9]+\/[^"'\s<>]+/gi;

            const patterns = [
                windowLocationRegex,
                windowLocationHrefRegex,
                metaRefreshRegex,
                locationReplaceRegex,
                rapidGatorUrlRegex,
            ];

            for (const pattern of patterns) {
                const match = html.match(pattern);

                if (match && match[0]) {
                    const urlMatch = match[0].match(/["']?([^"'\s<>]+)["']?/);

                    if (urlMatch && urlMatch[1]) {
                        const extractedUrl = urlMatch[1];

                        if (extractedUrl.startsWith('http://') || extractedUrl.startsWith('https://')) {
                            return extractedUrl;
                        }
                    }
                }
            }

            return null;
        } catch (error) {
            logger.error('[ThirdPartyApiService] Error extracting final URL from response:', error);

            return null;
        }
    }

    async fetchHtml(url: string) {
        try {
            const response = await got(url)

            return {
                html: response.body,
                errorMessage: '',
            }
        } catch (error) {
            logger.error(`[ThirdPartyApiService] Failed to fetch HTML from ${url}: ${error.message}`);

            return {
                html: '',
                errorMessage: error.message,
            }
        }
    }
}

