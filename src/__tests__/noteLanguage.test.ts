import { describeNoteLanguage, loadNoteLanguage } from '../components/note/noteLanguage';

describe('picking highlighting from the file name', () => {
    it('falls back to JavaScript for notes without a language of their own', () => {
        expect(describeNoteLanguage('whatever.qqq')?.name).toBe('JavaScript');
        expect(describeNoteLanguage('secrets.prvthng')?.name).toBe('JavaScript');
        expect(describeNoteLanguage('server.log')?.name).toBe('JavaScript');
        expect(describeNoteLanguage('README')?.name).toBe('JavaScript');
        expect(describeNoteLanguage('notes.txt')?.name).toBe('JavaScript');
        expect(describeNoteLanguage(undefined)?.name).toBe('JavaScript');
    });

    it('recognises the kinds of file this app actually opens', () => {
        expect(describeNoteLanguage('config.json')?.name).toBe('JSON');
        expect(describeNoteLanguage('deploy.sh')?.name).toBe('Shell');
        expect(describeNoteLanguage('notes.md')?.name).toBe('Markdown');
        expect(describeNoteLanguage('query.sql')?.name).toBe('SQL');
        expect(describeNoteLanguage('build.groovy')?.name).toBe('Groovy');
        expect(describeNoteLanguage('notes.yaml')?.name).toBe('YAML');
    });

    it('ignores the case of the extension', () => {
        expect(describeNoteLanguage('CONFIG.JSON')?.name).toBe('JSON');
    });

    it('actually loads the language it picked', async () => {
        const support = await loadNoteLanguage('config.json');
        expect(support).not.toBeNull();
        expect(support?.language.name).toBe('json');
    });

    it('loads JavaScript for a plain note', async () => {
        const support = await loadNoteLanguage('notes.txt');
        expect(support?.language.name).toBe('javascript');
    });

    it('a recognised extension still wins over the default', async () => {
        expect((await loadNoteLanguage('deploy.sh'))?.language.name).toBe('shell');
    });
});
