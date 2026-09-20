export type DiffType = 'same' | 'added' | 'removed';

export interface DiffLine {
    type: DiffType,
    text: string,
    leftNumber?: number,
    rightNumber?: number
}

export function diffLines(left: string, right: string): DiffLine[] {
    const leftLines = (left || '').split('\n');
    const rightLines = (right || '').split('\n');

    const lengths: number[][] = Array.from({ length: leftLines.length + 1 }, () => new Array(rightLines.length + 1).fill(0));
    for (let i = leftLines.length - 1; i >= 0; i--) {
        for (let j = rightLines.length - 1; j >= 0; j--) {
            lengths[i][j] = leftLines[i] === rightLines[j]
                ? lengths[i + 1][j + 1] + 1
                : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
        }
    }

    const diff: DiffLine[] = [];
    let i = 0;
    let j = 0;

    while (i < leftLines.length && j < rightLines.length) {
        if (leftLines[i] === rightLines[j]) {
            diff.push({ type: 'same', text: leftLines[i], leftNumber: i + 1, rightNumber: j + 1 });
            i++;
            j++;
        } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
            diff.push({ type: 'removed', text: leftLines[i], leftNumber: i + 1 });
            i++;
        } else {
            diff.push({ type: 'added', text: rightLines[j], rightNumber: j + 1 });
            j++;
        }
    }

    while (i < leftLines.length) {
        diff.push({ type: 'removed', text: leftLines[i], leftNumber: i + 1 });
        i++;
    }
    while (j < rightLines.length) {
        diff.push({ type: 'added', text: rightLines[j], rightNumber: j + 1 });
        j++;
    }

    return diff
}

export function diffSummary(diff: DiffLine[]): { added: number, removed: number } {
    return diff.reduce((counts, line) => {
        if (line.type === 'added') {
            counts.added++;
        } else if (line.type === 'removed') {
            counts.removed++;
        }
        return counts
    }, { added: 0, removed: 0 })
}
