import { diffLines, diffSummary } from '../utils/diff';

const shape = (left: string, right: string) => diffLines(left, right).map((line) => line.type + ':' + line.text);

describe('comparing two notes line by line', () => {
    it('reports nothing when they are the same', () => {
        const diff = diffLines('one\ntwo', 'one\ntwo');
        expect(diff.every((line) => line.type === 'same')).toBe(true);
        expect(diffSummary(diff)).toEqual({ added: 0, removed: 0 });
    });

    it('sees a line that was added', () => {
        expect(shape('one\ntwo', 'one\nmiddle\ntwo')).toEqual(['same:one', 'added:middle', 'same:two']);
    });

    it('sees a line that was removed', () => {
        expect(shape('one\nmiddle\ntwo', 'one\ntwo')).toEqual(['same:one', 'removed:middle', 'same:two']);
    });

    it('shows a changed line as one removed and one added', () => {
        expect(shape('one\nold\ntwo', 'one\nnew\ntwo')).toEqual(['same:one', 'removed:old', 'added:new', 'same:two']);
    });

    it('keeps the unchanged lines around a change', () => {
        const diff = diffLines('a\nb\nc\nd\ne', 'a\nb\nX\nd\ne');
        expect(diffSummary(diff)).toEqual({ added: 1, removed: 1 });
        expect(diff.filter((line) => line.type === 'same')).toHaveLength(4);
    });

    it('numbers the lines on the side they belong to', () => {
        const diff = diffLines('one\ntwo', 'one\nmiddle\ntwo');
        expect(diff[1]).toEqual({ type: 'added', text: 'middle', rightNumber: 2 });
        expect(diff[2].leftNumber).toBe(2);
        expect(diff[2].rightNumber).toBe(3);
    });

    it('handles one side being empty', () => {
        expect(diffSummary(diffLines('', 'one\ntwo'))).toEqual({ added: 2, removed: 1 });
        expect(diffSummary(diffLines('one\ntwo', ''))).toEqual({ added: 1, removed: 2 });
    });

    it('finds the longest common run rather than rewriting everything', () => {
        const diff = diffLines('keep\nkeep\nkeep\nold', 'keep\nkeep\nkeep\nnew');
        expect(diff.filter((line) => line.type === 'same').map((line) => line.text)).toEqual(['keep', 'keep', 'keep']);
        expect(diffSummary(diff)).toEqual({ added: 1, removed: 1 });
    });

    it('copes with a moved block without exploding', () => {
        const diff = diffLines('a\nb\nc', 'c\na\nb');
        expect(diffSummary(diff).added + diffSummary(diff).removed).toBeLessThanOrEqual(2);
    });
});
