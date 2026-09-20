const pad2 = (value: number): string => String(value).padStart(2, '0');

const ordinal = (day: number): string => {
    if (day > 3 && day < 21) {
        return day + 'th'
    }
    const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
    return day + (suffixes[day % 10] || 'th')
};

export function fileNameTimestamp(date: Date = new Date()): string {
    const month = date.toLocaleString('en-US', { month: 'long' });
    const hour = date.getHours() % 12 || 12;
    return `${month}_${ordinal(date.getDate())}_${date.getFullYear()}_${hour}_${pad2(date.getMinutes())}_${pad2(date.getSeconds())}`
}

export function durationClock(milliseconds: number, withHours: boolean = true): string {
    const seconds = Math.max(0, Math.floor((milliseconds || 0) / 1000));
    const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
    if (withHours) {
        parts.unshift(Math.floor(seconds / 3600) % 24);
    }
    return parts.map(pad2).join(':')
}

export function formatUtcDateTime(milliseconds: number): string {
    return new Date(milliseconds).toISOString().replace('T', ' ').slice(0, 19)
}
