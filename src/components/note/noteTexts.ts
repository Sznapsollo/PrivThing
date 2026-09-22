interface NoteState {
    getText: () => string,
    isDirty: () => boolean
}

const notes = new Map<string, NoteState>();

export function registerNoteText(spaceId: string | undefined, getText: () => string, isDirty: () => boolean = () => false): void {
    if (spaceId) {
        notes.set(spaceId, { getText: getText, isDirty: isDirty });
    }
}

export function unregisterNoteText(spaceId: string | undefined): void {
    if (spaceId) {
        notes.delete(spaceId);
    }
}

export function getNoteText(spaceId: string | undefined): string | null {
    if (!spaceId) {
        return null
    }
    const state = notes.get(spaceId);
    return state ? state.getText() : null
}

export function isNoteDirty(spaceId: string | undefined): boolean {
    if (!spaceId) {
        return false
    }
    const state = notes.get(spaceId);
    return state ? state.isDirty() : false
}

export function anyNoteDirty(spaceIds: (string | undefined)[]): boolean {
    return spaceIds.some(isNoteDirty)
}
