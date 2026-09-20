import { isMarkdownNote, maskHiddenText, renderMarkdown } from '../utils/markdown';

describe('recognising a markdown note', () => {
    it('matches .md and .markdown, whatever the case', () => {
        expect(isMarkdownNote('notes.md')).toBe(true);
        expect(isMarkdownNote('NOTES.MD')).toBe(true);
        expect(isMarkdownNote('readme.markdown')).toBe(true);
    });

    it('does not match anything else', () => {
        expect(isMarkdownNote('notes.txt')).toBe(false);
        expect(isMarkdownNote('secrets.prvthng')).toBe(false);
        expect(isMarkdownNote(undefined)).toBe(false);
    });
});

describe('rendering markdown', () => {
    it('renders the usual things', () => {
        const html = renderMarkdown('# Title\n\nSome **bold** text\n\n- one\n- two');
        expect(html).toContain('<h1>Title</h1>');
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('<li>one</li>');
    });

    it('keeps code blocks as code', () => {
        expect(renderMarkdown('```\nnpm run build\n```')).toContain('<code>');
    });

    it('strips a script tag', () => {
        const html = renderMarkdown('hello <script>alert(1)</script> world');
        expect(html).not.toContain('<script');
        expect(html).toContain('hello');
    });

    it('strips an event handler hidden in an image', () => {
        const html = renderMarkdown('![x](y) <img src=x onerror="alert(1)">');
        expect(html).not.toContain('onerror');
    });

    it('strips a javascript: link', () => {
        expect(renderMarkdown('[click](javascript:alert(1))')).not.toContain('javascript:');
    });
});

describe('hidden text in the preview', () => {
    it('masks hide[[...]] instead of revealing it', () => {
        const html = renderMarkdown('my password is hide[[hunter2]] ok');
        expect(html).not.toContain('hunter2');
        expect(html).toContain('•');
    });

    it('masks each hidden run on a line separately', () => {
        expect(maskHiddenText('a hide[[one]] b hide[[two]] c')).toBe('a ••• b ••• c');
    });

    it('leaves a note without hidden text alone', () => {
        expect(maskHiddenText('nothing to hide here')).toBe('nothing to hide here');
    });
});
