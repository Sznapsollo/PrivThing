import { renderMarkdown } from '../utils/markdown';

const parse = (html: string): HTMLElement => {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host
};

describe('markdown from a file somebody else wrote', () => {
    const nasty = [
        '<img src=x onerror=alert(1)>',
        '<svg/onload=alert(1)>',
        '<svg onload="alert(1)"></svg>',
        '[a](JaVaScRiPt:alert(1))',
        '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
        '<iframe src="https://evil.example"></iframe>',
        '<style>body{display:none}</style>',
        '<form action="https://evil.example"><input name="p"></form>',
        '<math><mtext><script>alert(1)</script></mtext></math>',
        '<details open ontoggle=alert(1)>x</details>'
    ];

    it.each(nasty)('leaves nothing executable in %s', (input) => {
        const root = parse(renderMarkdown(input));

        expect(root.querySelectorAll('script, iframe, style, form, input, object, embed')).toHaveLength(0);

        root.querySelectorAll('*').forEach((element) => {
            for (const attribute of Array.from(element.attributes)) {
                expect(attribute.name.toLowerCase().startsWith('on')).toBe(false);
                if (attribute.name.toLowerCase() === 'href' || attribute.name.toLowerCase() === 'src') {
                    expect(attribute.value.toLowerCase().replace(/\s/g, '').startsWith('javascript:')).toBe(false);
                    expect(attribute.value.toLowerCase().replace(/\s/g, '').startsWith('data:text/html')).toBe(false);
                }
            }
        });
    });

    it('keeps ordinary links and images working', () => {
        const root = parse(renderMarkdown('[docs](https://example.com) and ![pic](https://example.com/a.png)'));
        expect(root.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
        expect(root.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.png');
    });
});
