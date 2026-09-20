import { passwordBits, passwordStrength, PASSWORD_STRENGTH_LABELS } from '../utils/passwordStrength';
import en from '../locales/en/translation.json';

describe('judging a password', () => {
    it('says nothing about an empty one', () => {
        expect(passwordStrength('')).toBe('empty');
        expect(passwordBits('')).toBe(0);
    });

    it('calls the obvious ones weak', () => {
        expect(passwordStrength('password')).toBe('weak');
        expect(passwordStrength('Password1')).toBe('weak');
        expect(passwordStrength('qwerty123')).toBe('weak');
        expect(passwordStrength('haslo')).toBe('weak');
        expect(passwordStrength('abc')).toBe('weak');
    });

    it('is not fooled by one repeated character', () => {
        expect(passwordStrength('aaaaaaaaaaaaaaaaaaaaaaaa')).toBe('weak');
        expect(passwordStrength('ababababababababababab')).toBe('weak');
    });

    it('rewards length above all', () => {
        expect(passwordStrength('correct horse battery staple')).toBe('strong');
        expect(passwordStrength('zazolc gesla jazn i jeszcze')).toBe('strong');
    });

    it('recognises a short but varied password as only fair', () => {
        expect(passwordStrength('Tr0ub4dor')).toBe('fair');
    });

    it('moves up as a password grows', () => {
        const rising = ['abcd1234', 'abcd1234EF', 'abcd1234EFgh!!', 'abcd1234EFgh!!jklmnop'];
        const bits = rising.map(passwordBits);
        expect(bits[1]).toBeGreaterThan(bits[0]);
        expect(bits[2]).toBeGreaterThan(bits[1]);
        expect(bits[3]).toBeGreaterThan(bits[2]);
    });

    it('gives every level a name', () => {
        expect(new Set(['abc', 'Tr0ub4dor', 'Tr0ub4dor&3xx', 'correct horse battery staple'].map(passwordStrength)).size)
            .toBeGreaterThan(2);
    });
});

describe('every strength has a label key', () => {
    it('maps each level to a key that exists in the translations', () => {
        const translations = en as Record<string, string>;
        for (const level of ['weak', 'fair', 'good', 'strong'] as const) {
            expect(translations[PASSWORD_STRENGTH_LABELS[level]]).toBeDefined();
        }
    });
});
