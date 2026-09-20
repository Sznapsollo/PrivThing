import { webcrypto } from 'crypto';
import { TextDecoder, TextEncoder } from 'util';

if (!global.TextEncoder) {
    Object.defineProperty(global, 'TextEncoder', { value: TextEncoder });
}
if (!global.TextDecoder) {
    Object.defineProperty(global, 'TextDecoder', { value: TextDecoder });
}
if (!global.crypto?.subtle) {
    Object.defineProperty(global, 'crypto', { value: webcrypto });
}
if (!global.structuredClone) {
    Object.defineProperty(global, 'structuredClone', { value: (value: unknown) => JSON.parse(JSON.stringify(value)) });
}
