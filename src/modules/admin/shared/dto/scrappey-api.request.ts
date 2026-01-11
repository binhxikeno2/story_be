import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';

export enum RequestType {
    BROWSER = 'browser',
    REQUEST = 'request',
}

export class CookieJarEntryDto {
    @CheckApiProperty({ type: 'string', required: true })
    name: string;

    @CheckApiProperty({ type: 'string', required: true })
    value: string;

    @CheckApiProperty({ type: 'string', required: true })
    domain: string;

    @CheckApiProperty({ type: 'string' })
    path?: string;
}

export class ScrappeyApiRequestDto {
    @CheckApiProperty({ type: 'string' })
    session?: string;

    @CheckApiProperty({ type: CookieJarEntryDto, isArray: true })
    cookiejar?: CookieJarEntryDto[];

    @CheckApiProperty({ type: 'string' })
    cookies?: string;

    @CheckApiProperty({ type: 'string' })
    proxy?: string;

    @CheckApiProperty({ type: 'string' })
    proxyCountry?: string;

    @CheckApiProperty()
    customHeaders?: Record<string, string>;

    @CheckApiProperty({ type: 'boolean' })
    includeImages?: boolean;

    @CheckApiProperty({ type: 'boolean' })
    includeLinks?: boolean;

    @CheckApiProperty({ enum: RequestType })
    requestType?: RequestType;

    @CheckApiProperty()
    localStorage?: Record<string, string>;
}

