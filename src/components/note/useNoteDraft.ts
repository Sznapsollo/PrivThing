import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Draft, getDraft, removeDraft, saveDraft } from '../../storage/draftsStore';

export const DRAFT_DEBOUNCE_MS = 1500;

interface Options {
    spaceId?: string,
    path?: string,
    name?: string,
    note: string,
    orgNote: MutableRefObject<string>,
    isEncrypted: boolean,
    isLoading: boolean,
    onRestore: (note: string) => void,
    debounceMs?: number
}

export function useNoteDraft({ spaceId, path, name, note, orgNote, isEncrypted, isLoading, onRestore, debounceMs = DRAFT_DEBOUNCE_MS }: Options) {
    const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // false until the note for this space has been read from storage, so the debounce
    // never runs against the empty editor that precedes a load
    const loadedRef = useRef(false);
    // true once this editing session may have written a draft, so returning to the stored
    // text removes only drafts of our own making, never one still waiting to be offered
    const draftedRef = useRef(false);
    const loadTokenRef = useRef(0);

    const cancelTimer = () => {
        if (timerRef.current != null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const reset = useCallback(() => {
        cancelTimer();
        loadedRef.current = false;
        draftedRef.current = false;
        loadTokenRef.current++;
        setPendingDraft(null);
    }, []);

    const clear = useCallback(() => {
        cancelTimer();
        draftedRef.current = false;
        if (spaceId) {
            removeDraft(spaceId).catch((e) => console.warn('Could not remove the draft', e));
        }
    }, [spaceId]);

    const check = useCallback(async (encrypted: boolean) => {
        loadedRef.current = true;
        const token = ++loadTokenRef.current;
        if (!spaceId || encrypted) {
            return
        }
        const draft = await getDraft(spaceId);
        if (token !== loadTokenRef.current) {
            return
        }
        if (draft && draft.path === (path || '') && draft.note !== orgNote.current) {
            setPendingDraft(draft);
        } else if (draft) {
            removeDraft(spaceId).catch((e) => console.warn('Could not remove the draft', e));
        }
    }, [spaceId, path, orgNote]);

    const restore = useCallback(() => {
        if (pendingDraft) {
            onRestore(pendingDraft.note);
        }
        setPendingDraft(null);
    }, [pendingDraft, onRestore]);

    const discard = useCallback(() => {
        if (spaceId) {
            removeDraft(spaceId).catch((e) => console.warn('Could not remove the draft', e));
        }
        setPendingDraft(null);
    }, [spaceId]);

    useEffect(() => {
        if (!spaceId || isEncrypted || isLoading || !loadedRef.current) {
            return
        }
        cancelTimer();
        if (note === orgNote.current) {
            if (draftedRef.current) {
                draftedRef.current = false;
                removeDraft(spaceId).catch((e) => console.warn('Could not remove the draft', e));
            }
            return
        }
        draftedRef.current = true;
        const draftedNote = note;
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            saveDraft({
                spaceId: spaceId,
                path: path || '',
                name: name || '',
                note: draftedNote,
                savedAt: new Date().getTime()
            }).catch((e) => console.warn('Could not store the draft', e));
        }, debounceMs);
        return cancelTimer
    }, [note, isEncrypted, isLoading, spaceId, path, name, orgNote, debounceMs]);

    useEffect(() => cancelTimer, []);

    return { pendingDraft, reset, clear, check, restore, discard }
}
