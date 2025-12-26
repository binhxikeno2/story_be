import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Browser, chromium, Page } from 'playwright';
import { logger } from 'shared/logger/app.logger';

export interface CookieResult {
    cf_clearance?: string;
    cookies?: string; // Full cookie string
    allCookies?: Array<{ name: string; value: string; domain: string }>;
}

@Injectable()
export class CookieFetcherService {
    private readonly cookieFilePath = path.resolve(process.cwd(), 'configs/cookie.txt');

    /**
     * Get cookies (especially cf_clearance) from target URL by bypassing Cloudflare challenge
     * 
     * Flow:
     * [1] Launch headless browser
     * [2] Open target URL
     * [3] Cloudflare challenge pass (wait for navigation)
     * [4] Extract cookies (cf_clearance)
     * [5] Close browser
     * [6] Return cookie
     * 
     * @param targetUrl - URL to fetch cookies from
     * @param timeout - Maximum time to wait for Cloudflare challenge (default: 30000ms)
     * @returns CookieResult containing cf_clearance and other cookies
     */
    async getCookies(targetUrl: string, timeout = 30000): Promise<CookieResult> {
        let browser: Browser | null = null;

        try {
            browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                ],
            });

            const context = await browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
            });

            const page: Page = await context.newPage();

            await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded',
                timeout: timeout,
            });

            try {
                await page.waitForLoadState('networkidle', { timeout: timeout });
            } catch (error) {
                // Continue even if networkidle times out
            }

            await page.waitForTimeout(2000);

            const cookies = await context.cookies();
            const cfClearanceCookie = cookies.find(cookie => cookie.name === 'cf_clearance');

            const cookieString = cookies
                .map(cookie => `${cookie.name}=${cookie.value}`)
                .join('; ');

            const result: CookieResult = {
                cf_clearance: cfClearanceCookie?.value,
                cookies: cookieString,
                allCookies: cookies.map(c => ({
                    name: c.name,
                    value: c.value,
                    domain: c.domain,
                })),
            };

            // Save cookies to configs/cookie.txt
            if (cookieString) {
                try {
                    const configsDir = path.resolve(process.cwd(), 'configs');
                    if (!fs.existsSync(configsDir)) {
                        fs.mkdirSync(configsDir, { recursive: true });
                    }

                    fs.writeFileSync(this.cookieFilePath, cookieString, 'utf-8');

                    logger.info(`[CookieFetcher] Cookies saved to ${this.cookieFilePath}`);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger.error(`[CookieFetcher] Error saving cookies to file: ${errorMessage}`);
                }
            }

            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`[CookieFetcher] Error fetching cookies from ${targetUrl}: ${errorMessage}`);
            throw new Error(`Failed to fetch cookies: ${errorMessage}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Get only cf_clearance cookie value as string
     * 
     * @param targetUrl - URL to fetch cookies from
     * @param timeout - Maximum time to wait for Cloudflare challenge (default: 30000ms)
     * @returns cf_clearance cookie value or null if not found
     */
    async getCfClearance(targetUrl: string, timeout = 30000): Promise<string | null> {
        const result = await this.getCookies(targetUrl, timeout);

        return result.cf_clearance || null;
    }

    /**
     * Get full cookie string (formatted for HTTP headers)
     * 
     * @param targetUrl - URL to fetch cookies from
     * @param timeout - Maximum time to wait for Cloudflare challenge (default: 30000ms)
     * @returns Full cookie string formatted for HTTP headers
     */
    async getCookieString(targetUrl: string, timeout = 30000): Promise<string> {
        const result = await this.getCookies(targetUrl, timeout);

        return result.cookies || '';
    }
}

