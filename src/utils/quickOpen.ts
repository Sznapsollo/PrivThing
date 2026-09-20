import { Item } from '../model';

export interface QuickOpenMatch {
    item: Item,
    score: number
}

const scoreName = (name: string, query: string): number => {
    const haystack = name.toLowerCase();
    const needle = query.toLowerCase();

    if (!needle.length) {
        return 1
    }

    const exact = haystack.indexOf(needle);
    if (exact === 0) {
        return 1000
    }
    if (exact > 0) {
        return 800 - exact
    }

    let position = 0;
    let gaps = 0;
    let lastHit = -1;

    for (const letter of needle) {
        const hit = haystack.indexOf(letter, position);
        if (hit < 0) {
            return 0
        }
        if (lastHit >= 0) {
            gaps += hit - lastHit - 1;
        }
        lastHit = hit;
        position = hit + 1;
    }

    return Math.max(1, 400 - gaps)
};

export function quickOpenMatches(items: Item[], query: string, limit: number = 12): Item[] {
    const trimmed = (query || '').trim();

    const matches: QuickOpenMatch[] = (items || [])
        .map((item) => ({ item: item, score: scoreName(item.name || '', trimmed) }))
        .filter((match) => match.score > 0);

    matches.sort((first, second) => {
        if (second.score !== first.score) {
            return second.score - first.score
        }
        return (first.item.name || '').localeCompare(second.item.name || '')
    });

    return matches.slice(0, limit).map((match) => match.item)
}
