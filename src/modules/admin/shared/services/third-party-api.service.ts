import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { logger } from 'shared/logger/app.logger';

import { THIRD_PARTY_API_URL } from '../constants/third-party-api.constant';
import { ScrappeyApiRequestDto } from '../dto/scrappey-api.request';
import { ScrappeyApiResponseDto } from '../dto/scrappey-api.response';
import { ThirdPartyApiResponseDto } from '../dto/third-party-api.response';

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

  async fetchHtml(url: string): Promise<ThirdPartyApiResponseDto> {
    try {
      const params = new ScrappeyApiRequestDto({
        cmd: 'request.get',
        url: url,
        premiumProxy: true,
      });

      const response = await fetch(`${THIRD_PARTY_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: params.toJson(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[ThirdPartyApiService] API returned error status ${response.status}: ${errorText}`);

        return {
          html: '',
          currentUrl: '',
          blocked: true,
        };
      }

      const data = await response.json();
      const dataTransformed = plainToInstance(ScrappeyApiResponseDto, data);

      if (!dataTransformed?.solution?.verified) {
        throw new Error(`Third party API returned an error: ${dataTransformed?.solution?.statusCode}`);
      }

      const dataConverted = dataTransformed?.solution;
      const html = dataConverted?.response;

      if (!html) {
        throw new Error(`Third party API not found response`);
      }

      return {
        html,
        currentUrl: dataConverted?.currentUrl || '',
      };
    } catch (error) {
      logger.error(`[ThirdPartyApiService] Error fetching HTML: ${error}`);

      return {
        html: '',
        currentUrl: '',
      };
    }
  }
}
