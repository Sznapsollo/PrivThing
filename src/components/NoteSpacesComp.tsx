import React, { useEffect, useState } from 'react'
import NoteComp from './NoteComp'
import { AppState } from '../context/Context';
import { EditItem, Item, NoteSpaceContextMenu } from '../model';
import { FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import { MAIN_ACTIONS } from '../context/Reducers';
import { getNewItem, saveLocalStorage } from '../utils/utils';
import { useTranslation } from 'react-i18next';
import NoteSpaceContextMenuComp from './NoteSpaceContextMenuComp'

const initialNoteSpaceContextMenu: NoteSpaceContextMenu = {
    show: false,
    x: 0,
    y: 0
}

const NoteSpacesComp = () => {

    const { t } = useTranslation();

    const { mainState: { editedItemSpaces }, mainDispatch} = AppState();
    const [ noteSpaceContextMenu, setNoteSpaceContextMenu ] = useState<NoteSpaceContextMenu>(initialNoteSpaceContextMenu)

    useEffect(() => {
        if(!!editedItemSpaces) {
            const copiedEditedItems = editedItemSpaces.map((editedItemSpace) => {
                return  {...editedItemSpace}
            })
            if(!!copiedEditedItems) {
                saveLocalStorage("privthing.pmeditedItemSpaces", copiedEditedItems);
            }
        }
    }, [editedItemSpaces])

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, noteSpaceItem: EditItem): void => {
        e.preventDefault();
        const {pageX, pageY} = e;
        setNoteSpaceContextMenu({show: true, x: pageX, y:pageY, noteSpaceItem: noteSpaceItem});
    }

    const handleContextMenuClose = () => setNoteSpaceContextMenu(initialNoteSpaceContextMenu)

    return (
        <div className='notesTabContainer'>
            {noteSpaceContextMenu.show === true && <NoteSpaceContextMenuComp x={noteSpaceContextMenu.x} y={noteSpaceContextMenu.y} allItems={editedItemSpaces} noteSpaceItem={noteSpaceContextMenu.noteSpaceItem} closeContextMenu={handleContextMenuClose}/>}
            {
                editedItemSpaces.map((editedItemSpace, index) => (
                    <div key={index} style={{flex: 1, display: 'flex', flexDirection: 'column', width: '100%'}}>
                        <div style={{textAlign: 'center'}}>
                            <div style={{padding: 10}} className={'editItemSpace ' + (editedItemSpace.isActive ? 'isActive' : '')} 
                                onClick={() => {
                                    mainDispatch({type: MAIN_ACTIONS.SET_NOTE_SPACE_ACTIVE, payload: editedItemSpace})
                                }}
                                onContextMenu={(e) => handleContextMenu(e, editedItemSpace)}
                            >
                                {editedItemSpace.name ? editedItemSpace.name : '---'}
                            </div>
                            { 
                                editedItemSpaces.length > 1 && <FiMinusCircle title={t("closeNoteSpace")} className='h2 itemTabIconRemove' onClick={(e) => {
                                    e.preventDefault();
                                    mainDispatch({type: MAIN_ACTIONS.REMOVE_NOTE_SPACE, payload: editedItemSpace});
                                }}/>
                            }
                            {
                                (index === editedItemSpaces.length - 1) && <FiPlusCircle title={t("newNoteSpace")} className='h2 itemTabIconAdd' onClick={() => {
                                    const payLoadItem: Item = getNewItem();
                                    mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}, action: 'NEW_NOTE_SPACE'}});
                                }}/>
                            }
                        </div>
                        <NoteComp editedItem={editedItemSpace} />
                    </div>
                ))
            }
        </div>
    )
}

export default NoteSpacesComp
