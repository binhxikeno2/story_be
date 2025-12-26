import { Injectable } from '@nestjs/common';
import { HTML_REGEX } from 'modules/admin/crawlPost/constants/regex.constant';

export interface ListPageResult {
    detailUrls: string[];
}

export interface DetailPageResult {
    thumbnailUrl?: string;
    title?: string;
    tags?: string[];
    lastUpdated?: string;
    description?: string;
    chapters?: Array<{
        title: string;
        stories: Array<{
            title: string;
            media: string;
        }>;
    }>;
}

@Injectable()
export class HtmlParserService {
    parseListPage(html: string, baseUrl: string): ListPageResult {
        const detailUrls = this.extractDetailUrls(html, baseUrl);

        return { detailUrls };
    }

    parseDetailPage(html: string, baseUrl: string): DetailPageResult {
        const data: DetailPageResult = {};

        // Extract thumbnailUrl
        const thumbnailMatch = html.match(HTML_REGEX.ENTRY_THUMBNAIL);
        if (thumbnailMatch && thumbnailMatch[1]) {
            data.thumbnailUrl = this.normalizeImageUrl(thumbnailMatch[1], baseUrl);
        }

        // Extract title
        const titleMatch = html.match(HTML_REGEX.ENTRY_TITLE);
        if (titleMatch && titleMatch[1]) {
            data.title = titleMatch[1].trim().replace(/\s+/g, ' ');
        }

        // Extract tags
        const tags = this.extractTags(html);
        if (tags.length > 0) {
            data.tags = tags;
        }

        // Extract lastUpdated
        const dateMatch = html.match(HTML_REGEX.META_DATE_UPDATED);
        if (dateMatch && dateMatch[1]) {
            data.lastUpdated = dateMatch[1].trim();
        }

        // Extract description
        const descMatch = html.match(HTML_REGEX.META_DESCRIPTION);
        if (descMatch && descMatch[1]) {
            let description = descMatch[1].replace(HTML_REGEX.HTML_TAGS, '').trim();
            description = description.replace(/\s+/g, ' ');
            if (description) {
                data.description = description;
            }
        }

        // Extract chapters and stories
        const chapters = this.parseChaptersAndStories(html, baseUrl);
        if (chapters.length > 0) {
            data.chapters = chapters;
        }

        return data;
    }

    private extractDetailUrls(html: string, baseUrl: string): string[] {
        const articleMatches = html.matchAll(HTML_REGEX.ARTICLE_ITEM);
        const detailUrls: string[] = [];

        for (const articleMatch of articleMatches) {
            const articleContent = articleMatch[1];
            if (!articleContent) {
                continue;
            }

            const href = this.extractLinkFromArticle(articleContent);
            if (!href) {
                continue;
            }

            const absoluteUrl = this.normalizeUrl(href, baseUrl);

            if (absoluteUrl && !detailUrls.includes(absoluteUrl)) {
                detailUrls.push(absoluteUrl);
            }
        }

        return detailUrls;
    }

    private extractLinkFromArticle(articleContent: string): string | null {
        // Priority 1: <h3 class="entry-title mh-loop-title"> -> <a>
        let linkMatch = articleContent.match(HTML_REGEX.ARTICLE_TITLE_LINK);

        // Priority 2: <figure class="mh-loop-thumb"> -> <a>
        if (!linkMatch) {
            linkMatch = articleContent.match(HTML_REGEX.ARTICLE_THUMB_LINK);
        }

        return linkMatch?.[1] || null;
    }

    private normalizeUrl(href: string, baseUrl: string): string | null {
        if (this.shouldSkipUrl(href)) {
            return null;
        }

        if (href.startsWith('http')) {
            return href;
        }

        try {
            const baseUrlObj = new URL(baseUrl);

            return href.startsWith('/')
                ? `${baseUrlObj.origin}${href}`
                : `${baseUrlObj.origin}/${href}`;
        } catch {
            return null;
        }
    }

    private normalizeImageUrl(url: string, baseUrl: string): string {
        if (url.startsWith('//')) {
            return `https:${url}`;
        }

        if (url.startsWith('/')) {
            try {
                const baseUrlObj = new URL(baseUrl);

                return `${baseUrlObj.origin}${url}`;
            } catch {
                return url;
            }
        }

        return url;
    }

    private shouldSkipUrl(href: string): boolean {
        return href.includes('/zip/') ||
            href.includes('/link/') ||
            href.includes('/category/') ||
            href.includes('/tag/') ||
            href.startsWith('//');
    }

    private extractTags(html: string): string[] {
        const tags: string[] = [];
        const tagSectionMatch = html.match(HTML_REGEX.META_TAG_SECTION);

        if (tagSectionMatch && tagSectionMatch[1]) {
            const tagLinks = tagSectionMatch[1].matchAll(HTML_REGEX.TAG_LINK);
            for (const tagLink of tagLinks) {
                if (tagLink[1]) {
                    const tagText = tagLink[1].trim();
                    if (tagText && !tags.includes(tagText)) {
                        tags.push(tagText);
                    }
                }
            }
        }

        return tags;
    }

    private parseChaptersAndStories(html: string, baseUrl: string): Array<{
        title: string;
        stories: Array<{
            title: string;
            media: string;
        }>;
    }> {
        const chapters: Array<{
            title: string;
            stories: Array<{
                title: string;
                media: string;
            }>;
        }> = [];

        const entryContentMatch = html.match(HTML_REGEX.ENTRY_CONTENT);
        if (!entryContentMatch || !entryContentMatch[1]) {
            return chapters;
        }

        const entryContent = entryContentMatch[1];

        // Find all <p> tags and their positions
        const pTagRegex = HTML_REGEX.P_TAG;
        const pMatches: Array<{ content: string; index: number }> = [];
        let pMatch;

        while ((pMatch = pTagRegex.exec(entryContent)) !== null) {
            const content = pMatch[1].trim();
            // Skip empty paragraphs, comments, and special tags
            if (content &&
                !content.includes('<!--more-->') &&
                !content.includes('<span id="more-') &&
                !content.match(/^<[^>]+>[\s\S]*<\/[^>]+>$/)) {
                pMatches.push({
                    content: content.replace(HTML_REGEX.HTML_TAGS, '').trim(),
                    index: pMatch.index,
                });
            }
        }

        // For each potential chapter title, check if it's followed by tables
        for (let i = 0; i < pMatches.length; i++) {
            const chapterTitle = pMatches[i].content;
            const chapterStartIndex = pMatches[i].index;

            // Find the end of this potential chapter (next <p> tag or end of content)
            const nextPIndex = i < pMatches.length - 1 ? pMatches[i + 1].index : entryContent.length;
            const chapterSection = entryContent.substring(chapterStartIndex, nextPIndex);

            // Check if this section contains tables with class "mycss-td"
            const tableRegex = HTML_REGEX.TABLE_CONTENT;
            const tables: string[] = [];
            let tableMatch;

            while ((tableMatch = tableRegex.exec(chapterSection)) !== null) {
                tables.push(tableMatch[1]);
            }

            // If we found tables, this is a chapter
            if (tables.length > 0) {
                const stories: Array<{ title: string; media: string }> = [];

                // Parse each table to extract story
                for (const tableContent of tables) {
                    // Extract story title (first <td> content, usually service name)
                    const firstTdMatch = tableContent.match(HTML_REGEX.TABLE_FIRST_TD);
                    let storyTitle = '';
                    if (firstTdMatch && firstTdMatch[1]) {
                        storyTitle = firstTdMatch[1].trim().replace(HTML_REGEX.HTML_TAGS, '').trim();
                    }

                    // Extract story media (href from <a> tag)
                    const linkMatch = tableContent.match(HTML_REGEX.TABLE_LINK);
                    if (linkMatch && linkMatch[1]) {
                        let mediaUrl = linkMatch[1];

                        // Convert relative URL to absolute
                        if (mediaUrl.startsWith('//')) {
                            mediaUrl = `https:${mediaUrl}`;
                        } else if (mediaUrl.startsWith('/')) {
                            if (baseUrl) {
                                try {
                                    const baseUrlObj = new URL(baseUrl);
                                    mediaUrl = `${baseUrlObj.origin}${mediaUrl}`;
                                } catch (e) {
                                    // Invalid base URL, keep as is
                                }
                            }
                        } else if (!mediaUrl.startsWith('http')) {
                            if (baseUrl) {
                                try {
                                    const baseUrlObj = new URL(baseUrl);
                                    mediaUrl = `${baseUrlObj.origin}/${mediaUrl}`;
                                } catch (e) {
                                    // Invalid base URL, keep as is
                                }
                            }
                        }

                        if (storyTitle && mediaUrl) {
                            stories.push({ title: storyTitle, media: mediaUrl });
                        }
                    }
                }

                if (chapterTitle && stories.length > 0) {
                    chapters.push({ title: chapterTitle, stories });
                }
            }
        }

        return chapters;
    }
}

