import {useRef} from 'react'
import { useClickAway } from 'react-use';
import { EditItem } from '../model';
import { AppState } from '../context/Context';
import { useTranslation } from 'react-i18next'
import { MAIN_ACTIONS } from '../context/Reducers';

interface Props {
    x: number, 
    y: number,
    noteSpaceItem?: EditItem,
    allItems: EditItem[],
    closeContextMenu: () => void
}

const NoteSpaceContextMenuComp = ({x, y, noteSpaceItem, allItems, closeContextMenu}: Props) => {
    
    const { t } = useTranslation();

    const { mainDispatch } = AppState();

    const contextMenuRef = useRef<HTMLDivElement>(null);
    useClickAway(contextMenuRef, closeContextMenu);

    return (
        <div ref={contextMenuRef} style={{top: y, left: x}} className='contextMenu'>
            {
                allItems.length > 1 && <div className='contextMenuItem' onClick={() => {
                    closeContextMenu();
                    mainDispatch({type: MAIN_ACTIONS.REMOVE_NOTE_SPACE, payload: noteSpaceItem});
                }}>
                    {t("closeNoteSpace")}
                </div>
            }
            {
                allItems.length > 1 && <div className='contextMenuItem' onClick={() => {
                    closeContextMenu();
                    if(noteSpaceItem?.isActive == true) {
                        mainDispatch({type: MAIN_ACTIONS.CLEAR_OTHER_NOTE_SPACES, payload: noteSpaceItem});
                    } else {
                        mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: noteSpaceItem, tab: {...noteSpaceItem, isActive: false, isNew: true}, action: 'CLEAR_OTHER_NOTE_SPACES'}});
                    }
                }}>
                    {t("closeNoteSpacesButThis")}
                </div>
            }
        </div>
    )
}

export default NoteSpaceContextMenuComp