import { act, renderHook } from '@testing-library/react';
import { MutableRefObject } from 'react';
import { useNoteDraft } from '../components/note/useNoteDraft';
import { getDraft, pruneDrafts, saveDraft } from '../storage/draftsStore';

const DEBOUNCE = 30;
const settle = (ms: number = DEBOUNCE * 2) => new Promise((resolve) => setTimeout(resolve, ms));

interface HookProps {
    note: string,
    path?: string,
    isEncrypted?: boolean,
    isLoading?: boolean
}

const mount = (initial: HookProps, orgNote: MutableRefObject<string>, onRestore = vi.fn()) => {
    const rendered = renderHook((props: HookProps) => useNoteDraft({
        spaceId: 'space-1',
        path: props.path ?? '/notes/a.txt',
        name: 'a.txt',
        note: props.note,
        orgNote: orgNote,
        isEncrypted: props.isEncrypted === true,
        isLoading: props.isLoading === true,
        onRestore: onRestore,
        debounceMs: DEBOUNCE
    }), { initialProps: initial });
    return { ...rendered, onRestore }
};

const loaded = async (hook: ReturnType<typeof mount>, encrypted: boolean = false) => {
    await act(async () => { await hook.result.current.check(encrypted) });
};

beforeEach(async () => {
    await pruneDrafts([]);
});

describe('crash-safe drafts in the editor', () => {
    it('writes a draft once typing pauses, and removes it when the text is back to what is stored', async () => {
        const orgNote = { current: 'stored' };
        const hook = mount({ note: 'stored' }, orgNote);
        await loaded(hook);

        hook.rerender({ note: 'stored plus' });
        await settle();
        expect((await getDraft('space-1'))?.note).toBe('stored plus');

        hook.rerender({ note: 'stored' });
        await settle();
        expect(await getDraft('space-1')).toBeUndefined();
    });

    it('a save inside the debounce window leaves no draft behind', async () => {
        const orgNote = { current: 'stored' };
        const hook = mount({ note: 'stored' }, orgNote);
        await loaded(hook);

        hook.rerender({ note: 'stored plus' });
        await settle(5);
        orgNote.current = 'stored plus';
        act(() => hook.result.current.clear());
        await settle();

        expect(await getDraft('space-1')).toBeUndefined();
    });

    it('never touches a draft before the note has been loaded', async () => {
        await saveDraft({ spaceId: 'space-1', path: '/notes/a.txt', name: 'a.txt', note: 'from last time', savedAt: 1 });
        const orgNote = { current: '' };
        const hook = mount({ note: '' }, orgNote);
        await settle();

        expect((await getDraft('space-1'))?.note).toBe('from last time');
        hook.rerender({ note: '', isLoading: true });
        hook.rerender({ note: 'stored', isLoading: false });
        await settle();
        expect((await getDraft('space-1'))?.note).toBe('from last time');
    });

    it('offers a draft kept for this space and file once the note is loaded, and restores it', async () => {
        await saveDraft({ spaceId: 'space-1', path: '/notes/a.txt', name: 'a.txt', note: 'from last time', savedAt: 1 });
        const orgNote = { current: 'stored' };
        const hook = mount({ note: 'stored' }, orgNote);
        await loaded(hook);

        expect(hook.result.current.pendingDraft?.note).toBe('from last time');
        act(() => hook.result.current.restore());
        expect(hook.onRestore).toHaveBeenCalledWith('from last time');
        expect(hook.result.current.pendingDraft).toBeNull();
        expect((await getDraft('space-1'))?.note).toBe('from last time');
    });

    it('does not offer a draft that belongs to another file opened earlier in the same space', async () => {
        await saveDraft({ spaceId: 'space-1', path: '/notes/other.txt', name: 'other.txt', note: 'other text', savedAt: 1 });
        const orgNote = { current: 'stored' };
        const hook = mount({ note: 'stored' }, orgNote);
        await loaded(hook);
        await settle(5);

        expect(hook.result.current.pendingDraft).toBeNull();
        expect(await getDraft('space-1')).toBeUndefined();
    });

    it('does not offer a draft identical to what is stored', async () => {
        await saveDraft({ spaceId: 'space-1', path: '/notes/a.txt', name: 'a.txt', note: 'stored', savedAt: 1 });
        const orgNote = { current: 'stored' };
        const hook = mount({ note: 'stored' }, orgNote);
        await loaded(hook);
        await settle(5);

        expect(hook.result.current.pendingDraft).toBeNull();
        expect(await getDraft('space-1')).toBeUndefined();
    });

    it('discarding removes the draft', async () => {
        await saveDraft({ spaceId: 'space-1', path: '/notes/a.txt', name: 'a.txt', note: 'from last time', savedAt: 1 });
        const orgNote = { current: 'stored' };
        const hook = mount({ note: 'stored' }, orgNote);
        await loaded(hook);

        act(() => hook.result.current.discard());
        await settle(5);
        expect(hook.result.current.pendingDraft).toBeNull();
        expect(await getDraft('space-1')).toBeUndefined();
    });

    it('never drafts an encrypted note, and never offers one to it', async () => {
        await saveDraft({ spaceId: 'space-1', path: '/notes/a.txt', name: 'a.txt', note: 'leftover', savedAt: 1 });
        const orgNote = { current: 'secret text' };
        const hook = mount({ note: 'secret text', isEncrypted: true }, orgNote);
        await loaded(hook, true);

        expect(hook.result.current.pendingDraft).toBeNull();
        hook.rerender({ note: 'secret text plus', isEncrypted: true });
        await settle();
        expect((await getDraft('space-1'))?.note).toBe('leftover');
    });

    it('a pending timer from the previous note does not survive switching to another one', async () => {
        const orgNote = { current: 'stored' };
        const hook = mount({ note: 'stored' }, orgNote);
        await loaded(hook);

        hook.rerender({ note: 'stored plus' });
        act(() => hook.result.current.reset());
        orgNote.current = '';
        hook.rerender({ note: '', path: '/notes/b.txt', isLoading: true });
        await settle();

        expect(await getDraft('space-1')).toBeUndefined();
    });
});
