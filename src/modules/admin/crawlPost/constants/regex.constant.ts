/**
 * HTML Regex patterns for parsing third-party site content
 */

export const HTML_REGEX = {
    // Article/list page patterns
    ARTICLE_ITEM: /<article[^>]*class=["'][^"']*mh-loop-item[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi,
    ARTICLE_TITLE_LINK: /<h3[^>]*class=["'][^"']*entry-title[^"']*mh-loop-title[^"']*["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>/i,
    ARTICLE_THUMB_LINK: /<figure[^>]*class=["'][^"']*mh-loop-thumb[^"']*["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>/i,

    // Detail page patterns
    ENTRY_THUMBNAIL: /<figure[^>]*class=["'][^"']*entry-thumbnail[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>/i,
    ENTRY_TITLE: /<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i,
    ENTRY_CONTENT: /<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,

    // Meta patterns
    META_TAG_SECTION: /<span[^>]*class=["'][^"']*mh-meta-Tag[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    TAG_LINK: /<a[^>]*>([\s\S]*?)<\/a>/gi,
    META_DATE_UPDATED: /<span[^>]*class=["'][^"']*mh-meta-date[^"']*updated[^"']*["'][^>]*>[\s\S]*?<i[^>]*>[\s\S]*?<\/i>([\s\S]*?)<\/span>/i,
    META_DESCRIPTION: /<[^>]*class=["'][^"']*MIntroduction[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i,

    // Chapter and story patterns
    CHAPTER_PATTERN: /<p>(?!<span[^>]*id=["']more-\d+["'][^>]*>)([\s\S]*?)<\/p>\s*(<table[^>]*class=["'][^"']*mycss-td[^"']*["'][^>]*>[\s\S]*?<\/table>(\s*<table[^>]*class=["'][^"']*mycss-td[^"']*["'][^>]*>[\s\S]*?<\/table>)*)/gi,
    P_TAG: /<p[^>]*>([\s\S]*?)<\/p>/gi,
    TABLE_CONTENT: /<table[^>]*class=["'][^"']*mycss-td[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi,
    TABLE_FIRST_TD: /<td[^>]*>([\s\S]*?)<\/td>/i,
    TABLE_LINK: /<a[^>]*href=["']([^"']+)["'][^>]*>/i,

    // Date parsing
    DATE_PATTERN: /(\d{1,2})-(\d{1,2})-(\d{4})/,

    // HTML tag cleanup
    HTML_TAGS: /<[^>]+>/g,
} as const;

