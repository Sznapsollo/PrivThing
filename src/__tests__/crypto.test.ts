import { decryptNote, encryptNote, isEncryptedNote, ENCRYPTED_PREFIX } from '../utils/crypto';

describe('note encryption', () => {
    it('round-trips a note', () => {
        const encrypted = encryptNote('my password is hunter2', 'correct horse');
        expect(encrypted.startsWith(ENCRYPTED_PREFIX)).toBe(true);
        expect(encrypted).not.toContain('hunter2');
        expect(decryptNote(encrypted, 'correct horse')).toBe('my password is hunter2');
    });

    it('round-trips non-ascii content', () => {
        const note = 'zażółć gęślą jaźń — ärger';
        expect(decryptNote(encryptNote(note, 'hasło'), 'hasło')).toBe(note);
    });

    it('throws on the wrong password instead of returning garbage', () => {
        const encrypted = encryptNote('secret', 'right');
        expect(() => decryptNote(encrypted, 'wrong')).toThrow();
    });

    it('throws on a tampered payload', () => {
        const encrypted = encryptNote('secret', 'right');
        const tampered = encrypted.slice(0, -6) + 'AAAAAA';
        expect(() => decryptNote(tampered, 'right')).toThrow();
    });

    it('recognises an encrypted note by prefix or by .prvthng name', () => {
        expect(isEncryptedNote(encryptNote('x', 'k'))).toBe(true);
        expect(isEncryptedNote('plain text')).toBe(false);
        expect(isEncryptedNote('plain text', 'notes.prvthng')).toBe(true);
        expect(isEncryptedNote('plain text', 'notes.txt')).toBe(false);
    });
});
