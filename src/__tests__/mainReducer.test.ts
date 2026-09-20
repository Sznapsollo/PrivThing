import { MAIN_ACTIONS, mainReducer } from '../context/Reducers';
import { MainContextType } from '../model';

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
