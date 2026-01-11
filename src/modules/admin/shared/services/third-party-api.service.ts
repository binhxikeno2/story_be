import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from 'shared/logger/app.logger';

import { THIRD_PARTY_API_URL } from '../constants/third-party-api.constant';
import { ScrappeyApiRequestDto } from '../dto/scrappey-api.request';
import { ScrappeyApiResponseDto } from '../dto/scrappey-api.response';

type ThirdPartyApiResponse = {
    html: string;
    errorMessage?: string;
    currentUrl?: string;
}

type ThirdPartyApiCurrentUrlResponse = {
    currentUrl: string;
    errorMessage?: string;
}

@Injectable()
export class ThirdPartyApiService {
    private readonly apiKey: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('SCRAPPY_KEY_API');

        if (!apiKey) {
            throw new Error('SCRAPPY_KEY_API is not configured in environment variables');
        }

        this.apiKey = apiKey;
    }


    async fetchHtml(url: string, params?: ScrappeyApiRequestDto): Promise<ThirdPartyApiResponse> {
        try {
            const baseURL = `${THIRD_PARTY_API_URL}?key=${this.apiKey}`;
            const requestBody = {
                cmd: 'request.get',
                url: url,
                premiumProxy: true,
                ...params,
            };

            const response = await fetch(baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json() as ScrappeyApiResponseDto;

            if (data.solution?.statusCode !== 200) {
                throw new Error(`HTTP error! status: ${data.solution?.statusCode}`);
            }

            const html = data.solution.response || '';

            if (!html) {
                throw new Error('No HTML found');
            }

            return {
                html,
                currentUrl: data.solution.currentUrl,
            };
        } catch (error) {
            logger.error(`[ThirdPartyApiService] Failed to fetch HTML from ${url}: ${error.message}`);

            return {
                html: '',
                errorMessage: error.message,
            };
        }
    }


    async fetchCurrentUrl(url: string, params?: ScrappeyApiRequestDto): Promise<ThirdPartyApiCurrentUrlResponse> {
        try {
            const baseURL = `${THIRD_PARTY_API_URL}?key=${this.apiKey}`;
            const requestBody = {
                cmd: 'request.get',
                url: url,
                ...params,
            };

            const response = await fetch(baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });


            const data = await response.json() as ScrappeyApiResponseDto;

            if (data.solution?.statusCode !== 301) {
                throw new Error(`HTTP error! status: ${data.solution?.statusCode}`);
            }


            if (!data.solution.currentUrl) {
                throw new Error('No current URL found');
            }

            return {
                currentUrl: data.solution.currentUrl,
            };
        } catch (error) {
            logger.error(`[ThirdPartyApiService] Failed to fetch HTML from ${url}: ${error.message}`);

            return {
                currentUrl: '',
                errorMessage: error.message,
            };
        }
    }
}

