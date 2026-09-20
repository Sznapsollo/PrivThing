import { createStore, del, entries, get, set } from 'idb-keyval';

export interface Draft {
    name: string,
    note: string,
    path: string,
    savedAt: number,
    spaceId: string
}

const DRAFT_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const store = createStore('privthing-drafts', 'drafts');

export async function saveDraft(draft: Draft): Promise<void> {
    await set(draft.spaceId, draft, store);
}

export async function getDraft(spaceId: string): Promise<Draft | undefined> {
    return await get<Draft>(spaceId, store)
}

export async function removeDraft(spaceId: string): Promise<void> {
    await del(spaceId, store);
}

export async function pruneDrafts(liveSpaceIds: string[]): Promise<number> {
    const stored = await entries<string, Draft>(store);
    const oldest = new Date().getTime() - DRAFT_MAX_AGE;
    let removed = 0;

    for (const [spaceId, draft] of stored) {
        if (liveSpaceIds.includes(spaceId) && draft.savedAt > oldest) {
            continue
        }
        await del(spaceId, store);
        removed++;
    }

    return removed
}
