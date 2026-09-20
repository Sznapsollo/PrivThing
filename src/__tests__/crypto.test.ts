import CryptoJS from 'crypto-js';
import {
    decryptNote,
    encryptNote,
    isEncryptedNote,
    isLegacyEncryptedNote,
    ENCRYPTED_PREFIX,
    ENCRYPTED_PREFIX_V2
} from '../utils/crypto';

const legacyEncrypt = (note: string, secret: string): string =>
    ENCRYPTED_PREFIX + CryptoJS.AES.encrypt(JSON.stringify(note), secret).toString();

describe('note encryption (current format)', () => {
    it('round-trips a note', async () => {
        const encrypted = await encryptNote('my password is hunter2', 'correct horse');
        expect(encrypted.startsWith(ENCRYPTED_PREFIX_V2)).toBe(true);
        expect(encrypted).not.toContain('hunter2');
        expect(await decryptNote(encrypted, 'correct horse')).toBe('my password is hunter2');
    });

    it('round-trips non-ascii content', async () => {
        const note = 'zażółć gęślą jaźń — ärger';
        expect(await decryptNote(await encryptNote(note, 'hasło'), 'hasło')).toBe(note);
    });

    it('rejects the wrong password', async () => {
        const encrypted = await encryptNote('secret', 'right');
        await expect(decryptNote(encrypted, 'wrong')).rejects.toThrow();
    });

    it('rejects a tampered payload instead of returning altered text', async () => {
        const encrypted = await encryptNote('secret', 'right');
        const tampered = encrypted.slice(0, -6) + 'AAAAAA';
        await expect(decryptNote(tampered, 'right')).rejects.toThrow();
    });

    it('uses a fresh salt and iv, so the same note never encrypts to the same string', async () => {
        const first = await encryptNote('same note', 'same password');
        const second = await encryptNote('same note', 'same password');
        expect(first).not.toBe(second);
        expect(await decryptNote(first, 'same password')).toBe('same note');
        expect(await decryptNote(second, 'same password')).toBe('same note');
    });
});

describe('notes encrypted by older versions', () => {
    it('still opens a legacy file', async () => {
        const legacy = legacyEncrypt('written by 1.0.30', 'my password');
        expect(isLegacyEncryptedNote(legacy)).toBe(true);
        expect(await decryptNote(legacy, 'my password')).toBe('written by 1.0.30');
    });

    it('still rejects the wrong password on a legacy file', async () => {
        const legacy = legacyEncrypt('written by 1.0.30', 'my password');
        await expect(decryptNote(legacy, 'not my password')).rejects.toThrow();
    });

    it('re-saving a legacy note produces the current format', async () => {
        const legacy = legacyEncrypt('an old note', 'my password');
        const reopened = await decryptNote(legacy, 'my password');
        const reWrapped = await encryptNote(reopened, 'my password');
        expect(isLegacyEncryptedNote(reWrapped)).toBe(false);
        expect(reWrapped.startsWith(ENCRYPTED_PREFIX_V2)).toBe(true);
        expect(await decryptNote(reWrapped, 'my password')).toBe('an old note');
    });
});

describe('recognising an encrypted note', () => {
    it('recognises both formats, by prefix or by .prvthng name', async () => {
        expect(isEncryptedNote(await encryptNote('x', 'k'))).toBe(true);
        expect(isEncryptedNote(legacyEncrypt('x', 'k'))).toBe(true);
        expect(isEncryptedNote('plain text')).toBe(false);
        expect(isEncryptedNote('plain text', 'notes.prvthng')).toBe(true);
        expect(isEncryptedNote('plain text', 'notes.txt')).toBe(false);
    });

    it('does not call the current format legacy', async () => {
        expect(isLegacyEncryptedNote(await encryptNote('x', 'k'))).toBe(false);
    });
});
