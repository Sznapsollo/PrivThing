import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { hideRegex } from '../components/note/hideRegex';

export const MARKDOWN_EXTENSIONS = ['.md', '.markdown'];

export function isMarkdownNote(fileName?: string): boolean {
    const name = (fileName || '').toLowerCase();
    return MARKDOWN_EXTENSIONS.some((extension) => name.endsWith(extension))
}

export function maskHiddenText(note: string): string {
    return (note || '').replace(hideRegex, (_match, hidden) => '•'.repeat(Math.max(3, (hidden || '').length)))
}

export function renderMarkdown(note: string): string {
    const rendered = marked.parse(maskHiddenText(note), { async: false, gfm: true, breaks: true }) as string;

    return DOMPurify.sanitize(rendered, {
        ADD_ATTR: ['target', 'rel'],
        FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['style']
    })
}
