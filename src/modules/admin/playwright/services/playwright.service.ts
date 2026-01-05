import { Injectable } from '@nestjs/common';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { logger } from 'shared/logger/app.logger';
import { RedisService } from 'shared/redis/redis.service';

interface PlaywrightSession {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    cookies: any[];
    sessionData: any;
    isVerified: boolean;
    createdAt: Date;
}

@Injectable()
export class PlaywrightService {
    private session: PlaywrightSession | null = null;
    private readonly defaultTimeout = 60000;

    private readonly SESSION_KEY = 'playwright:session';

    constructor(private readonly redisService: RedisService) { }


    async initializeSession(url: string): Promise<void> {
        try {
            logger.info('[PlaywrightService] Initializing new Playwright session...');

            if (this.session) {
                await this.closeSession();
            }

            const browser = await chromium.launch({
                headless: true,
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                ],
            });

            const context = await browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale: 'en-US',
                timezoneId: 'America/New_York',
            });

            await context.addInitScript(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                });

                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });

                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });

                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) =>
                    parameters.name === 'notifications'
                        ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
                        : originalQuery(parameters);
            });

            const page = await context.newPage();

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: this.defaultTimeout,
            });

            await page.waitForTimeout(8000);

            const finalUrl = page.url();
            const cookies = await context.cookies();
            const title = await page.title();

            const sessionData = {
                cookies,
                url: finalUrl,
                title,
                isVerified: true,
                createdAt: new Date().toISOString(),
            };

            await this.redisService.setJson(this.SESSION_KEY, sessionData, 3600);

            logger.info('✔ Cloudflare verified');
            logger.info('✔ HTML rendered');
            logger.info('✔ Cookie / Session');
            logger.info(`[PlaywrightService] Final URL: ${finalUrl}`);
            logger.info(`[PlaywrightService] Session saved to Redis`);
            logger.info('[PlaywrightService] Session initialized successfully');
        } catch (error) {
            logger.error('[PlaywrightService] Error initializing session:', error);

            if (this.session) {
                await this.closeSession();
            }

            throw error;
        }
    }

    async refreshSession(url?: string): Promise<void> {
        try {
            logger.info('[PlaywrightService] Refreshing session...');

            let targetUrl = url;

            if (!targetUrl) {
                const existingSession = await this.redisService.getJson<any>(this.SESSION_KEY);
                if (existingSession?.url) {
                    targetUrl = existingSession.url;
                    logger.info(`[PlaywrightService] Using URL from existing session: ${targetUrl}`);
                } else {
                    throw new Error('No URL provided and no existing session found');
                }
            }

            if (!targetUrl) {
                throw new Error('No URL available for refresh');
            }

            if (this.session) {
                await this.closeSession();
            }

            await this.initializeSession(targetUrl);

            logger.info('[PlaywrightService] Session refreshed successfully');
        } catch (error) {
            logger.error('[PlaywrightService] Error refreshing session:', error);
            throw error;
        }
    }

    private async closeSession(): Promise<void> {
        if (!this.session) {
            return;
        }

        this.session.page.close();
        this.session.context.close();
        this.session.browser.close();
        this.session = null;
    }
}

