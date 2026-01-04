import { logger } from 'shared/logger/app.logger';

export interface PostInfo {
    title: string;
    description: string;
    tags: string[];
    thumbnailUrl: string;
    lastUpdated: Date | null;
    isRead: boolean;
    chapters?: ChapterInfo[];
}

export interface StoryInfo {
    name: string;
    media: string;
    rapidGatorUrl: null;
}

export interface ChapterInfo {
    title: string;
    stories: StoryInfo[];
}

const HTML_TAG_REGEX = /<[^>]+>/g;
const CONTENT_LABEL = '作品内容:';

const REGEX_PATTERNS = {
    TITLE: /<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i,
    DESCRIPTION: /<div[^>]*class=["']MIntroduction[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    TAGS: /<span[^>]*class=["'][^"']*mh-meta-Tag[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    TAG_LINK: /<a[^>]*href=["'][^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
    THUMBNAIL: /<figure[^>]*class=["'][^"']*entry-thumbnail[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>/i,
    LAST_UPDATED: /<span[^>]*class=["'][^"']*mh-meta-date[^"']*updated[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    DATE_FORMAT: /(\d{1,2})-(\d{1,2})-(\d{4})/,
    BR_TAG: /<br\s*\/?>/i,
    CHAPTER: /<p[^>]*>([\s\S]*?)<\/p>/gi,
    RAPIDGATOR_ROW: /<tr[^>]*>[\s\S]*?<td[^>]*>([^<]*RapidGator[^<]*)<\/td>[\s\S]*?<td[^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/td>[\s\S]*?<\/tr>/gi,
    RAPIDGATOR_LINK: /RapidGator[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
};

function removeHtmlTags(text: string): string {
    return text.replace(HTML_TAG_REGEX, '').trim();
}

function parseTitle(html: string): string {
    const match = html.match(REGEX_PATTERNS.TITLE);

    return match ? removeHtmlTags(match[1]) : '';
}

function parseDescription(html: string): string {
    const match = html.match(REGEX_PATTERNS.DESCRIPTION);
    if (!match) {
        return '';
    }

    const rawContent = match[1];
    const hasContentLabel = rawContent.includes(CONTENT_LABEL);

    if (!hasContentLabel) {
        return removeHtmlTags(rawContent);
    }

    const parts = rawContent.split(REGEX_PATTERNS.BR_TAG);
    const hasEnoughBrTags = parts.length >= 3;

    if (hasEnoughBrTags) {
        return removeHtmlTags(parts[2]);
    }

    const cleanContent = removeHtmlTags(rawContent);

    return cleanContent.replace(/作品内容:\s*/i, '');
}

function parseTags(html: string): string[] {
    const match = html.match(REGEX_PATTERNS.TAGS);
    if (!match) {
        return [];
    }

    const tagContent = match[1];
    const tags: string[] = [];
    let tagMatch: RegExpExecArray | null;

    while ((tagMatch = REGEX_PATTERNS.TAG_LINK.exec(tagContent)) !== null) {
        const tagText = removeHtmlTags(tagMatch[1]);
        if (tagText && !tags.includes(tagText)) {
            tags.push(tagText);
        }
    }

    return tags;
}

function normalizeUrl(url: string): string {
    if (!url) {
        return '';
    }

    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    if (url.startsWith('/')) {
        return '';
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return '';
    }

    if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }

    return url;
}

function parseThumbnailUrl(html: string): string {
    const match = html.match(REGEX_PATTERNS.THUMBNAIL);

    return match ? normalizeUrl(match[1]) : '';
}

function parseDateFromMMDDYYYY(dateText: string): Date | null {
    const dateParts = dateText.match(REGEX_PATTERNS.DATE_FORMAT);
    if (!dateParts) {
        return null;
    }

    const [, month, day, year] = dateParts;
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
}

function parseLastUpdated(html: string): Date | null {
    const match = html.match(REGEX_PATTERNS.LAST_UPDATED);
    if (!match) {
        return null;
    }

    const dateText = removeHtmlTags(match[1]);
    if (!dateText) {
        return null;
    }

    const parsedDate = parseDateFromMMDDYYYY(dateText);
    if (parsedDate) {
        return parsedDate;
    }

    const fallbackDate = new Date(dateText);
    if (isNaN(fallbackDate.getTime())) {
        return null;
    }

    return fallbackDate;
}

export function parsePostInfoFromHtml(html: string): PostInfo | null {
    try {
        if (!html) {
            return null;
        }

        return {
            title: parseTitle(html),
            description: parseDescription(html),
            tags: parseTags(html),
            thumbnailUrl: parseThumbnailUrl(html),
            lastUpdated: parseLastUpdated(html),
            isRead: false,
            chapters: parseChaptersAndStoriesFromHtml(html),
        };
    } catch (error) {
        logger.error('[parsePostInfoFromHtml] Error parsing post info from HTML:', error);

        return null;
    }
}

export function parseChaptersAndStoriesFromHtml(html: string): ChapterInfo[] {
    try {
        if (!html) {
            return [];
        }

        const entryContentRegex = /<div[^>]*class=["'][^"']*entry-content[^"']*clearfix[^"']*["'][^>]*>([\s\S]*?)<\/div>/i;
        const contentMatch = html.match(entryContentRegex);

        if (!contentMatch || contentMatch.index === undefined) {
            return [];
        }

        const entryContentHtml = contentMatch[1];
        const entryContentStartInHtml = contentMatch.index + contentMatch[0].indexOf('>') + 1;
        const entryContentEndInHtml = contentMatch.index + contentMatch[0].lastIndexOf('</div>');

        const tableTtndRegex = /<table[^>]*class=["'][^"']*mycss-td[^"']*ttnd[^"']*["'][^>]*>[\s\S]*?<\/table>/i;
        const tableTtndMatch = entryContentHtml.match(tableTtndRegex);

        if (!tableTtndMatch || tableTtndMatch.index === undefined) {
            return [];
        }

        const tableTtndEndInContent = tableTtndMatch.index + tableTtndMatch[0].length;
        const contentStartInHtml = entryContentStartInHtml + tableTtndEndInContent;
        const contentHtml = entryContentHtml.substring(tableTtndEndInContent);

        const chapters: ChapterInfo[] = [];
        const chapterMatches: Array<{ title: string; startIndex: number; endIndex: number }> = [];

        REGEX_PATTERNS.CHAPTER.lastIndex = 0;
        let chapterMatch: RegExpExecArray | null;
        while ((chapterMatch = REGEX_PATTERNS.CHAPTER.exec(contentHtml)) !== null) {
            const rawTitle = chapterMatch[1];
            if (rawTitle) {
                const cleanText = removeHtmlTags(rawTitle).trim();

                if (!cleanText || cleanText.length === 0) {
                    continue;
                }

                const isOnlyComment = /^[\s\n]*<!--[\s\S]*?-->[\s\n]*$/.test(rawTitle);
                const isMoreTag = /<span[^>]*id=["']more-[\d]+["'][^>]*>[\s\S]*?<\/span>/.test(rawTitle);
                const isOnlyBrAndWhitespace = /^[\s\n]*(?:<br\s*\/?>[\s\n]*)*&nbsp;?[\s\n]*(?:<br\s*\/?>[\s\n]*)*$/.test(rawTitle);
                const isOnlyMoreComment = /^[\s\n]*<!--more-->[\s\n]*(?:<br\s*\/?>[\s\n]*)*&nbsp;?[\s\n]*(?:<br\s*\/?>[\s\n]*)*$/.test(rawTitle);

                if (!isOnlyComment && !isMoreTag && !isOnlyBrAndWhitespace && !isOnlyMoreComment && cleanText) {
                    chapterMatches.push({
                        title: cleanText || '',
                        startIndex: contentStartInHtml + chapterMatch.index,
                        endIndex: contentStartInHtml + chapterMatch.index + chapterMatch[0].length,
                    });
                }
            }
        }

        let chapterCounter = 1;

        if (chapterMatches.length === 0) {
            const stories: StoryInfo[] = [];

            REGEX_PATTERNS.RAPIDGATOR_ROW.lastIndex = 0;
            let rapidGatorMatch: RegExpExecArray | null;
            while ((rapidGatorMatch = REGEX_PATTERNS.RAPIDGATOR_ROW.exec(contentHtml)) !== null) {
                const storyTitle = removeHtmlTags(rapidGatorMatch[1]).trim();
                const mediaUrl = normalizeUrl(rapidGatorMatch[2]);
                const linkText = removeHtmlTags(rapidGatorMatch[3]).trim();

                if (mediaUrl && linkText && storyTitle && storyTitle.includes('RapidGator') && !storyTitle.includes('Premium')) {
                    stories.push({
                        name: linkText,
                        media: mediaUrl,
                        rapidGatorUrl: null,
                    });
                }
            }

            REGEX_PATTERNS.RAPIDGATOR_LINK.lastIndex = 0;
            while ((rapidGatorMatch = REGEX_PATTERNS.RAPIDGATOR_LINK.exec(contentHtml)) !== null) {
                const beforeLink = contentHtml.substring(Math.max(0, rapidGatorMatch.index - 200), rapidGatorMatch.index);
                const isPremium = beforeLink.includes('Premium') || beforeLink.includes('RapidGator(Premium)');

                if (isPremium) {
                    continue;
                }

                const mediaUrl = normalizeUrl(rapidGatorMatch[1]);
                const linkText = removeHtmlTags(rapidGatorMatch[2]).trim();

                if (mediaUrl && linkText) {
                    const existingStory = stories.find(s => s.media === mediaUrl);
                    if (!existingStory) {
                        stories.push({
                            name: linkText,
                            media: mediaUrl,
                            rapidGatorUrl: null,
                        });
                    }
                }
            }

            if (stories.length > 0) {
                chapters.push({
                    title: `Chapter ${String(chapterCounter).padStart(3, '0')}`,
                    stories,
                });
            }
        } else {
            for (let i = 0; i < chapterMatches.length; i++) {
                const currentChapter = chapterMatches[i];
                const nextChapterStartIndex = i + 1 < chapterMatches.length
                    ? chapterMatches[i + 1].startIndex
                    : entryContentEndInHtml;

                const chapterSection = html.substring(currentChapter.endIndex, nextChapterStartIndex);
                const stories: StoryInfo[] = [];

                REGEX_PATTERNS.RAPIDGATOR_ROW.lastIndex = 0;
                let rapidGatorMatch: RegExpExecArray | null;
                while ((rapidGatorMatch = REGEX_PATTERNS.RAPIDGATOR_ROW.exec(chapterSection)) !== null) {
                    const storyTitle = removeHtmlTags(rapidGatorMatch[1]).trim();
                    const mediaUrl = normalizeUrl(rapidGatorMatch[2]);
                    const linkText = removeHtmlTags(rapidGatorMatch[3]).trim();

                    if (mediaUrl && linkText && storyTitle && storyTitle.includes('RapidGator') && !storyTitle.includes('Premium')) {
                        stories.push({
                            name: linkText,
                            media: mediaUrl,
                            rapidGatorUrl: null,
                        });
                    }
                }

                REGEX_PATTERNS.RAPIDGATOR_LINK.lastIndex = 0;
                while ((rapidGatorMatch = REGEX_PATTERNS.RAPIDGATOR_LINK.exec(chapterSection)) !== null) {
                    const beforeLink = chapterSection.substring(Math.max(0, rapidGatorMatch.index - 200), rapidGatorMatch.index);
                    const isPremium = beforeLink.includes('Premium') || beforeLink.includes('RapidGator(Premium)');

                    if (isPremium) {
                        continue;
                    }

                    const mediaUrl = normalizeUrl(rapidGatorMatch[1]);
                    const linkText = removeHtmlTags(rapidGatorMatch[2]).trim();

                    if (mediaUrl && linkText) {
                        const existingStory = stories.find(s => s.media === mediaUrl);
                        if (!existingStory) {
                            stories.push({
                                name: linkText,
                                media: mediaUrl,
                                rapidGatorUrl: null,
                            });
                        }
                    }
                }

                if (stories.length > 0) {
                    const chapterTitle = currentChapter.title && currentChapter.title.trim()
                        ? currentChapter.title
                        : `Chapter ${String(chapterCounter).padStart(3, '0')}`;

                    chapters.push({
                        title: chapterTitle,
                        stories,
                    });

                    chapterCounter++;
                }
            }
        }

        return chapters;
    } catch (error) {
        logger.error('[parseChaptersAndStoriesFromHtml] Error parsing chapters and stories from HTML:', error);

        return [];
    }
}

