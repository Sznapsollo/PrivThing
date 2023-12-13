import {useRef} from 'react'
import { useClickAway } from 'react-use';
import { Tab } from '../model';
import { AppState } from '../context/Context';
import { useTranslation } from 'react-i18next'
import { MAIN_ACTIONS } from '../context/Reducers';

interface Props {
    x: number, 
    y: number,
    tabItem?: Tab,
    closeContextMenu: () => void
}

const TabContextMenuComp = ({x, y, tabItem, closeContextMenu}: Props) => {
    
    const { t } = useTranslation();

    const { mainDispatch } = AppState();

    const contextMenuRef = useRef<HTMLDivElement>(null);
    useClickAway(contextMenuRef, closeContextMenu);

    return (
        <div ref={contextMenuRef} style={{top: y, left: x}} className='contextMenu'>
            <div className='contextMenuItem' onClick={() => {
                closeContextMenu();
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: tabItem, tab: tabItem, action: 'NEW_NOTE_SPACE'}});
            }}>
                {t("openInNewNoteSpace")}
            </div>
            <div className='contextMenuItem' onClick={() => {
                closeContextMenu();
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: {}, tab: tabItem, action: 'REMOVE_TAB'}});
            }}>
                {t("closeTab")}
            </div>
            <div className='contextMenuItem' onClick={() => {
                closeContextMenu();
                mainDispatch({type: MAIN_ACTIONS.UPDATE_TABS, payload: []});
            }}>
                {t("closeAllTabs")}
            </div>
        </div>
    )
}

export default TabContextMenuComp