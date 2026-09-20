import { decryptNote, encryptNote, isEncryptedNote } from '../utils/crypto';

const notes = {
    'shopping.txt': { data: 'milk, bread', size: 11, lastModified: 111 },
    'work.txt': { data: 'server root pw is hunter2', size: 25, lastModified: 222 }
};

describe('backing up the browser notes', () => {
    it('a plain export is readable JSON, as it always was', () => {
        const payload = JSON.stringify(notes);
        expect(isEncryptedNote(payload)).toBe(false);
        expect(JSON.parse(payload)['shopping.txt'].data).toBe('milk, bread');
    });

    it('an encrypted export gives nothing away', async () => {
        const encrypted = await encryptNote(JSON.stringify(notes), 'my backup password');

        expect(isEncryptedNote(encrypted)).toBe(true);
        expect(encrypted).not.toContain('hunter2');
        expect(encrypted).not.toContain('shopping.txt');
    });

    it('round-trips every note back', async () => {
        const encrypted = await encryptNote(JSON.stringify(notes), 'my backup password');
        const restored = JSON.parse(await decryptNote(encrypted, 'my backup password'));

        expect(Object.keys(restored).sort()).toEqual(['shopping.txt', 'work.txt']);
        expect(restored['work.txt'].data).toBe('server root pw is hunter2');
        expect(restored['shopping.txt'].lastModified).toBe(111);
    });

    it('refuses the wrong password, so import can say so', async () => {
        const encrypted = await encryptNote(JSON.stringify(notes), 'right');
        await expect(decryptNote(encrypted, 'wrong')).rejects.toThrow();
    });

    it('refuses a backup file somebody tampered with', async () => {
        const encrypted = await encryptNote(JSON.stringify(notes), 'right');
        await expect(decryptNote(encrypted.slice(0, -6) + 'AAAAAA', 'right')).rejects.toThrow();
    });

    it('an old plaintext backup is still recognised as not encrypted', () => {
        expect(isEncryptedNote('{"a.txt":{"data":"hello"}}')).toBe(false);
    });
});
