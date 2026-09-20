import { quickOpenMatches } from '../utils/quickOpen';
import { Item } from '../model';

const items: Item[] = [
    { name: 'work_notes.txt', path: 'localStorage/work_notes.txt', folder: 'localStorage' },
    { name: '20260422.txt', path: '/home/nj/Documents/work_log/20260422.txt', folder: '/home/nj/Documents/work_log/' },
    { name: 'deploy_work.sh', path: '/home/nj/skrypty/deploy_work.sh', folder: '/home/nj/skrypty/' },
    { name: 'shopping.prvthng', path: 'localStorage/shopping.prvthng', folder: 'localStorage' }
];

describe('quick open matching', () => {
    it('lists everything when the query is empty', () => {
        expect(quickOpenMatches(items, '')).toHaveLength(4);
    });

    it('puts a name that starts with the query first', () => {
        expect(quickOpenMatches(items, 'work')[0].name).toBe('work_notes.txt');
    });

    it('still finds a match in the middle of a name', () => {
        expect(quickOpenMatches(items, 'deploy').map((item) => item.name)).toEqual(['deploy_work.sh']);
    });

    it('matches letters in order, not just substrings', () => {
        expect(quickOpenMatches(items, 'wnt').map((item) => item.name)).toEqual(['work_notes.txt']);
    });

    it('drops anything whose letters are not all there', () => {
        expect(quickOpenMatches(items, 'zzz')).toHaveLength(0);
    });

    it('ranks a closer fuzzy match above a scattered one', () => {
        const ranked = quickOpenMatches(items, 'wo').map((item) => item.name);
        expect(ranked[0]).toBe('work_notes.txt');
        expect(ranked).toContain('deploy_work.sh');
    });

    it('is case-insensitive and ignores surrounding spaces', () => {
        expect(quickOpenMatches(items, '  WORK  ')[0].name).toBe('work_notes.txt');
    });

    it('caps how many it returns', () => {
        const many = Array.from({ length: 50 }, (_, index) => ({ name: 'note' + index + '.txt', path: '/n' + index }));
        expect(quickOpenMatches(many, 'note', 12)).toHaveLength(12);
    });
});
