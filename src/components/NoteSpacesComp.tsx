import React, { useEffect, useState } from 'react'
import NoteComp from './NoteComp'
import { AppState } from '../context/Context';
import { EditItem, Item, NoteSpaceContextMenu } from '../model';
import { FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { PiArrowsInLineHorizontalFill } from "react-icons/pi";
import { PiArrowsOutLineHorizontalFill } from "react-icons/pi";
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

    const { mainState: { editedItemSpaces, favourites }, mainDispatch} = AppState();
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

    useEffect(() => {
        if(!!favourites) {
            const copiedFavourites = favourites.map((favItem) => {
                return  {...favItem}
            })
            if(!!copiedFavourites) {
                saveLocalStorage("privthing.pmfavourites", copiedFavourites);
            }
        }
    }, [favourites])

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, noteSpaceItem: EditItem): void => {
        e.preventDefault();
        const {pageX, pageY} = e;
        setNoteSpaceContextMenu({show: true, x: pageX, y:pageY, noteSpaceItem: noteSpaceItem});
    }

    const handleContextMenuClose = () => setNoteSpaceContextMenu(initialNoteSpaceContextMenu)

    const isFavourite = (item: EditItem): boolean => {
        return favourites && !!favourites.find((favItem) => favItem.path === item.path);
    }

    return (
        <div className='notesSpacesContainer'>
            {noteSpaceContextMenu.show === true && <NoteSpaceContextMenuComp x={noteSpaceContextMenu.x} y={noteSpaceContextMenu.y} allItems={editedItemSpaces} noteSpaceItem={noteSpaceContextMenu.noteSpaceItem} closeContextMenu={handleContextMenuClose}/>}
            {
                editedItemSpaces.map((editedItemSpace, index) => (
                    <div key={index} style={{flex: editedItemSpace.flex || 1, display: 'flex'}} className='noteSpaceContainer'>
                        <div style={{textAlign: 'center'}}>
                            {
                                editedItemSpaces.length > 1 && (!editedItemSpace.flex || editedItemSpace.flex < 2) && <PiArrowsOutLineHorizontalFill title={t("stretch")} className='h4 itemTabIconResize' onClick={(e) => {
                                    e.preventDefault();
                                    mainDispatch({type: MAIN_ACTIONS.STRETCH_NOTE_SPACE, payload: editedItemSpace});
                                }}/>
                            }
                            {
                                editedItemSpaces.length > 1 && (editedItemSpace.flex && editedItemSpace.flex >= 2) && <PiArrowsInLineHorizontalFill title={t("shrink")} className='h4 itemTabIconResize' onClick={(e) => {
                                    e.preventDefault();
                                    mainDispatch({type: MAIN_ACTIONS.SHRINK_NOTE_SPACE, payload: editedItemSpace});
                                }}/>
                            }
                            <div style={{padding: 10}} className={'editItemSpace ' + (editedItemSpace.isActive ? 'isActive' : '')} 
                                onClick={() => {
                                    mainDispatch({type: MAIN_ACTIONS.SET_NOTE_SPACE_ACTIVE, payload: editedItemSpace})
                                }}
                                onContextMenu={(e) => handleContextMenu(e, editedItemSpace)}
                            >
                                <div>
                                    {
                                        isFavourite(editedItemSpace) &&
                                        <FaStar title={t("shrink")} className='h6' style={{margin: 0, padding: 0, marginRight: 5}} onClick={(e) => {
                                            e.preventDefault();
                                            mainDispatch({type: MAIN_ACTIONS.REMOVE_FROM_FAVOURITES, payload: editedItemSpace})
                                        }}/>
                                    }
                                    {
                                        !isFavourite(editedItemSpace) &&
                                        <FaRegStar title={t("shrink")} className='h6' style={{margin: 0, padding: 0, marginRight: 5}} onClick={(e) => {
                                            e.preventDefault();
                                            mainDispatch({type: MAIN_ACTIONS.ADD_TO_FAVOURITES, payload: editedItemSpace})
                                        }}/>
                                    }
                                    {editedItemSpace.name ? editedItemSpace.name : '---'}
                                </div>
                            </div>
                            { 
                                editedItemSpaces.length > 1 && <FiMinusCircle title={t("closeNoteSpace")} color={editedItemSpace.isActive ? '#ffffff' : '#000000'} className='h2 itemTabIconRemove' onClick={(e) => {
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
