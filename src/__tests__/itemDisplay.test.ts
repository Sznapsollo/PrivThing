import { displayItemPath } from '../utils/itemDisplay';

describe('what the sidebar shows under a name', () => {
    it('shows the full path when the folder has no label, exactly as before', () => {
        expect(displayItemPath({ name: 'a.sh', path: '/home/nj/skrypty/a.sh', folder: '/home/nj/skrypty/' }))
            .toBe('/home/nj/skrypty/a.sh');
    });

    it('swaps the folder for its label when there is one', () => {
        expect(displayItemPath({ name: 'a.sh', path: '/home/nj/skrypty/a.sh', folder: '/home/nj/skrypty/', folderLabel: 'Skrypty' }))
            .toBe('Skrypty/a.sh');
    });

    it('does not double up slashes when the label ends in one', () => {
        expect(displayItemPath({ name: 'a.sh', path: '/home/nj/skrypty/a.sh', folder: '/home/nj/skrypty/', folderLabel: 'Skrypty/' }))
            .toBe('Skrypty/a.sh');
    });

    it('leaves browser notes alone', () => {
        expect(displayItemPath({ name: 'note.txt', path: 'localStorage/note.txt', folder: 'localStorage' }))
            .toBe('localStorage/note.txt');
    });

    it('falls back to the path if it does not start with the folder', () => {
        expect(displayItemPath({ name: 'a.sh', path: '/somewhere/else/a.sh', folder: '/home/nj/skrypty/', folderLabel: 'Skrypty' }))
            .toBe('/somewhere/else/a.sh');
    });

    it('copes with a missing path', () => {
        expect(displayItemPath({ name: '', path: '' })).toBe('');
    });
});
