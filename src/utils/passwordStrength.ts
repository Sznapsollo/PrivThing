export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

const COMMON = [
    'password', 'passwd', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey',
    'iloveyou', 'dragon', 'sunshine', 'princess', 'football', 'haslo', 'zaq12wsx'
];

const CHARSET_SIZES: [RegExp, number][] = [
    [/[a-z]/, 26],
    [/[A-Z]/, 26],
    [/[0-9]/, 10],
    [/[^a-zA-Z0-9]/, 33]
];

export function passwordBits(password: string): number {
    if (!password) {
        return 0
    }

    const lowered = password.toLowerCase();
    if (COMMON.some((common) => lowered === common || lowered.startsWith(common))) {
        return 8
    }

    const alphabet = CHARSET_SIZES.reduce((size, [pattern, count]) => size + (pattern.test(password) ? count : 0), 0);
    const bits = password.length * Math.log2(alphabet || 1);

    const distinct = new Set(password).size;
    if (distinct <= 2) {
        return Math.min(bits, 12)
    }
    if (distinct < password.length / 3) {
        return bits * 0.5
    }

    return bits
}

export function passwordStrength(password: string): PasswordStrength {
    if (!password) {
        return 'empty'
    }

    const bits = passwordBits(password);
    if (bits < 40) {
        return 'weak'
    }
    if (bits < 60) {
        return 'fair'
    }
    if (bits < 90) {
        return 'good'
    }
    return 'strong'
}

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
    empty: '',
    weak: 'passwordStrengthWeak',
    fair: 'passwordStrengthFair',
    good: 'passwordStrengthGood',
    strong: 'passwordStrengthStrong'
};
