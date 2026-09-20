import CryptoJS from 'crypto-js';

export const ENCRYPTED_PREFIX = 'privthingencrypted_';
export const ENCRYPTED_PREFIX_V2 = 'privthingencrypted2_';

const PBKDF2_ITERATIONS = 300000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte) });
    return btoa(binary)
};

const fromBase64 = (value: string): Uint8Array => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes
};

const deriveKey = async (secret: string, salt: Uint8Array): Promise<CryptoKey> => {
    const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
};

export function isEncryptedNote(rawData: string, fileName?: string): boolean {
    if (fileName?.toLocaleLowerCase()?.includes('.prvthng')) {
        return true
    }
    return !!rawData && (rawData.startsWith(ENCRYPTED_PREFIX_V2) || rawData.startsWith(ENCRYPTED_PREFIX))
}

export function isLegacyEncryptedNote(rawData: string): boolean {
    return !!rawData && !rawData.startsWith(ENCRYPTED_PREFIX_V2) && rawData.startsWith(ENCRYPTED_PREFIX)
}

export async function encryptNote(note: string, secret: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(secret, salt);

    const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        textEncoder.encode(JSON.stringify(note))
    ));

    const payload = new Uint8Array(salt.length + iv.length + ciphertext.length);
    payload.set(salt, 0);
    payload.set(iv, salt.length);
    payload.set(ciphertext, salt.length + iv.length);

    return ENCRYPTED_PREFIX_V2 + toBase64(payload)
}

function decryptLegacyNote(rawData: string, secret: string): string {
    const payload = rawData.startsWith(ENCRYPTED_PREFIX) ? rawData.replace(ENCRYPTED_PREFIX, '') : rawData;
    const bytes = CryptoJS.AES.decrypt(payload, secret);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}

export async function decryptNote(rawData: string, secret: string): Promise<string> {
    if (!rawData.startsWith(ENCRYPTED_PREFIX_V2)) {
        return decryptLegacyNote(rawData, secret)
    }

    const payload = fromBase64(rawData.replace(ENCRYPTED_PREFIX_V2, ''));
    const salt = payload.slice(0, SALT_BYTES);
    const iv = payload.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const ciphertext = payload.slice(SALT_BYTES + IV_BYTES);
    const key = await deriveKey(secret, salt);

    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext);
    return JSON.parse(textDecoder.decode(plaintext))
}
