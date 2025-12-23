/**
 * Utility to generate browser-like headers for crawling
 * These headers match successful curl command to bypass Cloudflare
 *
 * ⚠️ IMPORTANT: Headers may need updates in the future
 * ====================================================
 * The following headers may change over time and should be monitored:
 *
 * 1. Browser Version Headers (UPDATE WHEN BROWSER UPDATES):
 *    - User-Agent: Chrome version (currently 143.0.0.0)
 *    - Sec-CH-UA: Chrome version (currently "143")
 *    - Sec-CH-UA-Full-Version: Full version (currently "143.0.7499.148")
 *    - Sec-CH-UA-Full-Version-List: Full version list
 *
 * 2. Platform Headers (UPDATE IF CHANGING PLATFORM):
 *    - Sec-CH-UA-Platform: OS platform (currently "macOS")
 *    - Sec-CH-UA-Platform-Version: OS version (currently "26.2.0")
 *    - Sec-CH-UA-Arch: Architecture (currently "arm")
 *
 * 3. Stable Headers (RARELY CHANGE):
 *    - Accept, Accept-Language, Accept-Encoding
 *    - Sec-Fetch-* headers (may change with browser spec updates)
 *    - Connection, Upgrade-Insecure-Requests
 *
 * HOW TO UPDATE:
 * 1. Open Chrome DevTools (F12) → Network tab
 * 2. Make a request to the target website
 * 3. Check request headers in DevTools
 * 4. Copy the latest headers and update this file
 * 5. Or use curl command: curl -v 'URL' and check headers
 *
 * LAST UPDATED: 2024-12-24 (Chrome 143)
 */
export interface CrawlHeadersOptions {
    cookies?: string;
    referer?: string;
    secFetchSite?: 'same-origin' | 'none' | 'same-site' | 'cross-site';
}

export function getCrawlHeaders(options: CrawlHeadersOptions = {}): Record<string, string> {
    const { cookies, referer = '', secFetchSite = 'none' } = options;

    // Enhanced headers to match successful curl command exactly
    // ⚠️ NOTE: Chrome version and related headers should be updated when browser updates
    const headers: Record<string, string> = {
        // Browser identification - UPDATE when Chrome version changes
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br', // Note: zstd removed as Node.js fetch doesn't auto-decompress it
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Priority': 'u=0, i',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': secFetchSite,
        'Sec-Fetch-User': '?1',
        // Client Hints headers - UPDATE when Chrome version changes
        // Current: Chrome 143 (December 2024)
        'Sec-CH-UA': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"macOS"', // UPDATE if changing platform
        'Sec-CH-UA-Platform-Version': '"26.2.0"', // UPDATE if OS version changes
        'Sec-CH-UA-Arch': '"arm"', // UPDATE if changing architecture (x86 vs arm)
        'Sec-CH-UA-Bitness': '"64"',
        'Sec-CH-UA-Full-Version': '"143.0.7499.148"', // UPDATE when Chrome updates
        'Sec-CH-UA-Full-Version-List': '"Google Chrome";v="143.0.7499.148", "Chromium";v="143.0.7499.148", "Not A(Brand";v="24.0.0.0"',
        'Sec-CH-UA-Model': '""',
    };

    // Add referer if provided
    if (referer) {
        headers['Referer'] = referer;
    }

    // Add cookies if available - normalize cookie string
    if (cookies) {
        const normalizedCookies = cookies
            .split(';')
            .map(c => c.trim())
            .filter(c => c.length > 0)
            .join('; ');
        headers['Cookie'] = normalizedCookies;
    }

    return headers;
}

