import CryptoJS from 'crypto-js';

export const ENCRYPTED_PREFIX = 'privthingencrypted_';

export function isEncryptedNote(rawData: string, fileName?: string): boolean {
    if (fileName?.toLocaleLowerCase()?.includes('.prvthng')) {
        return true
    }
    return !!rawData && rawData.startsWith(ENCRYPTED_PREFIX)
}

export function encryptNote(note: string, secret: string): string {
    return ENCRYPTED_PREFIX + CryptoJS.AES.encrypt(JSON.stringify(note), secret).toString()
}

export function decryptNote(rawData: string, secret: string): string {
    const payload = rawData.startsWith(ENCRYPTED_PREFIX) ? rawData.replace(ENCRYPTED_PREFIX, '') : rawData;
    const bytes = CryptoJS.AES.decrypt(payload, secret);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}
