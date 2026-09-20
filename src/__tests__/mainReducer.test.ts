import { MAIN_ACTIONS, mainReducer } from '../context/Reducers';
import { EditItem, MainContextType } from '../model';
import { toPersistable } from '../utils/utils';

const baseState = (): MainContextType => ({
    editedItemSpaces: [{ name: '', path: '', isActive: true }],
    favourites: [],
    fullItems: false,
    items: [],
    recents: [],
    showSettings: false,
    tabs: []
} as unknown as MainContextType);

describe('mainReducer', () => {
    it('opens an item into the active space, a tab and recents', () => {
        const item = { name: 'a.txt', path: '/a.txt' };
        const state = mainReducer(baseState(), { type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: { item: item } } as any);
        expect(state.editedItemSpaces[0].name).toBe('a.txt');
        expect(state.activeEditedItemPath).toBe('/a.txt');
        expect(state.tabs).toHaveLength(1);
        expect(state.recents[0].path).toBe('/a.txt');
    });

    it('keeps recents unique and newest first, capped', () => {
        let state = baseState();
        for (const path of ['/a.txt', '/b.txt', '/a.txt']) {
            state = mainReducer(state, { type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: { item: { name: path, path: path } } } as any);
        }
        expect(state.recents.map((recent) => recent.path)).toEqual(['/a.txt', '/b.txt']);
    });

    it('does not add the same favourite twice', () => {
        let state = baseState();
        const item = { name: 'a.txt', path: '/a.txt' } as any;
        state = mainReducer(state, { type: MAIN_ACTIONS.ADD_TO_FAVOURITES, payload: item } as any);
        state = mainReducer(state, { type: MAIN_ACTIONS.ADD_TO_FAVOURITES, payload: item } as any);
        expect(state.favourites).toHaveLength(1);
    });

    it('returns the state untouched when SET_EDITED_ITEM carries no item', () => {
        const state = baseState();
        expect(mainReducer(state, { type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: {} } as any).tabs).toEqual([]);
    });
});

describe('saving a new note under a name', () => {
    it('remembers the path to open, and hands it back once the list reloads', () => {
        let state = baseState();
        state = mainReducer(state, { type: MAIN_ACTIONS.UPDATE_ITEMS_LIST, payload: 'localStorage/new.txt' } as any);
        expect(state.newPathToOpenCandidate).toBe('localStorage/new.txt');

        state = mainReducer(state, { type: MAIN_ACTIONS.SET_ITEMS, payload: [
            { name: 'new.txt', path: 'localStorage/new.txt', folder: 'localStorage' }
        ] } as any);
        expect(state.newItemToOpen?.path).toBe('localStorage/new.txt');
        expect(state.newPathToOpenCandidate).toBe('');
    });

    it('loses the pending open if any other list refresh lands first', () => {
        let state = baseState();
        state = mainReducer(state, { type: MAIN_ACTIONS.UPDATE_ITEMS_LIST, payload: 'localStorage/new.txt' } as any);
        state = mainReducer(state, { type: MAIN_ACTIONS.SET_ITEMS, payload: [] } as any);
        state = mainReducer(state, { type: MAIN_ACTIONS.SET_ITEMS, payload: [
            { name: 'new.txt', path: 'localStorage/new.txt', folder: 'localStorage' }
        ] } as any);
        expect(state.newItemToOpen).toBeUndefined();
    });
});

describe('note spaces are identified by id, not by object identity', () => {
    const withSpaces = (): MainContextType => ({
        ...baseState(),
        editedItemSpaces: [
            { name: 'a.txt', path: '/a.txt', spaceId: 'space-a', isActive: true, flex: 1 },
            { name: 'b.txt', path: '/b.txt', spaceId: 'space-b', isActive: false, flex: 1 }
        ]
    } as unknown as MainContextType);

    it('activates the right space even when the payload is a copy', () => {
        const state = withSpaces();
        const copyOfB = { ...state.editedItemSpaces[1] };

        const next = mainReducer(state, { type: MAIN_ACTIONS.SET_NOTE_SPACE_ACTIVE, payload: copyOfB } as any);

        expect(next.editedItemSpaces.find((space: EditItem) => space.spaceId === 'space-b')?.isActive).toBe(true);
        expect(next.editedItemSpaces.find((space: EditItem) => space.spaceId === 'space-a')?.isActive).toBe(false);
    });

    it('stretches the right space when the payload is a copy', () => {
        const state = withSpaces();
        const copyOfB = { ...state.editedItemSpaces[1] };

        const next = mainReducer(state, { type: MAIN_ACTIONS.STRETCH_NOTE_SPACE, payload: copyOfB } as any);

        expect(next.editedItemSpaces.find((space: EditItem) => space.spaceId === 'space-b')?.flex).toBe(2);
        expect(next.editedItemSpaces.find((space: EditItem) => space.spaceId === 'space-a')?.flex).toBe(1);
    });

    it('closes the right space when the payload is a copy', () => {
        const state = withSpaces();
        const copyOfA = { ...state.editedItemSpaces[0] };

        const next = mainReducer(state, { type: MAIN_ACTIONS.REMOVE_NOTE_SPACE, payload: copyOfA } as any);

        expect(next.editedItemSpaces).toHaveLength(1);
        expect(next.editedItemSpaces[0].spaceId).toBe('space-b');
    });

    it('gives every new space an id of its own', () => {
        let state = baseState();
        state = mainReducer(state, { type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: { item: { name: 'a.txt', path: '/a.txt' } } } as any);
        state = mainReducer(state, { type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: { item: { name: 'b.txt', path: '/b.txt' }, action: 'NEW_NOTE_SPACE' } } as any);

        const ids = state.editedItemSpaces.map((space: EditItem) => space.spaceId);
        expect(ids.every((id) => !!id)).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('wrap rows, remembered per note space', () => {
    const twoSpaces = (): MainContextType => ({
        ...baseState(),
        editedItemSpaces: [
            { name: 'a.txt', path: '/a.txt', spaceId: 'space-a', isActive: true },
            { name: 'b.txt', path: '/b.txt', spaceId: 'space-b', isActive: false }
        ]
    } as unknown as MainContextType);

    it('turns wrapping off for one space without touching the other', () => {
        const next = mainReducer(twoSpaces(), {
            type: MAIN_ACTIONS.SET_NOTE_SPACE_WRAP,
            payload: { spaceId: 'space-a', wrapWords: false }
        } as any);

        expect(next.editedItemSpaces.find((space: EditItem) => space.spaceId === 'space-a')?.wrapWords).toBe(false);
        expect(next.editedItemSpaces.find((space: EditItem) => space.spaceId === 'space-b')?.wrapWords).toBeUndefined();
    });

    it('turns it back on again', () => {
        let state = mainReducer(twoSpaces(), { type: MAIN_ACTIONS.SET_NOTE_SPACE_WRAP, payload: { spaceId: 'space-a', wrapWords: false } } as any);
        state = mainReducer(state, { type: MAIN_ACTIONS.SET_NOTE_SPACE_WRAP, payload: { spaceId: 'space-a', wrapWords: true } } as any);

        expect(state.editedItemSpaces.find((space: EditItem) => space.spaceId === 'space-a')?.wrapWords).toBe(true);
    });

    it('does nothing when the space is unknown', () => {
        const next = mainReducer(twoSpaces(), { type: MAIN_ACTIONS.SET_NOTE_SPACE_WRAP, payload: { spaceId: 'nope', wrapWords: false } } as any);
        expect(next.editedItemSpaces.every((space: EditItem) => space.wrapWords === undefined)).toBe(true);
    });

    it('is carried into what gets persisted', () => {
        const next = mainReducer(twoSpaces(), { type: MAIN_ACTIONS.SET_NOTE_SPACE_WRAP, payload: { spaceId: 'space-a', wrapWords: false } } as any);
        const persisted = next.editedItemSpaces.map(toPersistable);
        expect(persisted[0].wrapWords).toBe(false);
        expect(persisted[0].spaceId).toBe('space-a');
    });
});

describe('folder labels from the server', () => {
    it('keeps a folder label alongside the path', () => {
        const state = mainReducer(baseState(), { type: MAIN_ACTIONS.SET_ITEMS, payload: [
            { name: 'a.txt', path: '/notes/a.txt', folder: '/notes/', folderLabel: 'My notes' },
            { name: 'b.txt', path: '/scripts/b.txt', folder: '/scripts/' }
        ] } as any);

        const labelled = state.folders.find((folder) => folder.name === '/notes/');
        const plain = state.folders.find((folder) => folder.name === '/scripts/');

        expect(labelled?.label).toBe('My notes');
        expect(plain?.label).toBeUndefined();
    });

    it('still identifies folders by path, so filtering and saved tabs keep working', () => {
        const state = mainReducer(baseState(), { type: MAIN_ACTIONS.SET_ITEMS, payload: [
            { name: 'a.txt', path: '/notes/a.txt', folder: '/notes/', folderLabel: 'My notes' },
            { name: 'c.txt', path: '/notes/c.txt', folder: '/notes/', folderLabel: 'My notes' }
        ] } as any);

        expect(state.folders).toHaveLength(1);
        expect(state.folders[0].name).toBe('/notes/');
        expect(state.folders[0].itemsCount).toBe(2);
    });
});
