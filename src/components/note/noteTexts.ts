const texts = new Map<string, () => string>();

export function registerNoteText(spaceId: string | undefined, getText: () => string): void {
    if (spaceId) {
        texts.set(spaceId, getText);
    }
}

export function unregisterNoteText(spaceId: string | undefined): void {
    if (spaceId) {
        texts.delete(spaceId);
    }
}

export function getNoteText(spaceId: string | undefined): string | null {
    if (!spaceId) {
        return null
    }
    const getText = texts.get(spaceId);
    return getText ? getText() : null
}
