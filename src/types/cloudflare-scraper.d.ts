declare module 'cloudflare-scraper' {
    interface Response {
        statusCode: number;
        body: string;
        headers: Record<string, string>;
    }

    function got(url: string, options?: any): Promise<Response>;
    export = got;
}

