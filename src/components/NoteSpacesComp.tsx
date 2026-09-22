import React, { Fragment, useEffect, useState } from 'react'
import NoteComp from './NoteComp'
import { AppState } from '../context/Context';
import { EditItem, GenericContextMenuAction, GenericContextMenuItem, Item, NoteSpaceContextMenu } from '../model';
import { FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { PiArrowsInLineHorizontalFill } from "react-icons/pi";
import { PiArrowsOutLineHorizontalFill } from "react-icons/pi";
import { MAIN_ACTIONS } from '../context/Reducers';
import { getNewItem, saveLocalStorage, toPersistable } from '../utils/utils';
import { pruneDrafts } from '../storage/draftsStore';
import { anyNoteDirty } from './note/noteTexts';
import ConfirmationComp from './ConfirmationComp';
import { keyActivate } from '../utils/a11y';
import CompareComp from './note/CompareComp';
import { VscDiff } from 'react-icons/vsc';
import { useTranslation } from 'react-i18next';
import GenericContextMenuComp from './GenericContextMenuComp';

const initialNoteSpaceContextMenu: NoteSpaceContextMenu = {
    show: false,
    menuActions: [],
    x: 0,
    y: 0
}

const NoteSpacesComp = () => {

    const { t } = useTranslation();

    const { mainState: { editedItemSpaces, favourites, recents }, mainDispatch} = AppState();
    const [ noteSpaceContextMenu, setNoteSpaceContextMenu ] = useState<NoteSpaceContextMenu>(initialNoteSpaceContextMenu)
    const [ comparePair, setComparePair ] = useState<EditItem[] | null>(null)
    const [ pendingClose, setPendingClose ] = useState<(() => void) | null>(null)

    const closeSpace = (noteSpaceItem: EditItem) => {
        const close = () => mainDispatch({type: MAIN_ACTIONS.REMOVE_NOTE_SPACE, payload: noteSpaceItem});
        if(anyNoteDirty([noteSpaceItem.spaceId])) {
            setPendingClose(() => close);
        } else {
            close();
        }
    }

    const closeOtherSpaces = (noteSpaceItem: EditItem) => {
        const close = () => {
            if(noteSpaceItem.isActive === true) {
                mainDispatch({type: MAIN_ACTIONS.CLEAR_OTHER_NOTE_SPACES, payload: noteSpaceItem});
            } else {
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: noteSpaceItem, tab: {...noteSpaceItem, isActive: false, isNew: true}, action: 'CLEAR_OTHER_NOTE_SPACES'}});
            }
        };
        const others = editedItemSpaces.filter((editedItemSpace) => editedItemSpace.spaceId !== noteSpaceItem.spaceId).map((editedItemSpace) => editedItemSpace.spaceId);
        if(anyNoteDirty(others)) {
            setPendingClose(() => close);
        } else {
            close();
        }
    }

    useEffect(() => {
        if(!!editedItemSpaces) {
            const copiedEditedItems = editedItemSpaces.map((editedItemSpace) => {
                return  toPersistable(editedItemSpace)
            })
            if(!!copiedEditedItems) {
                saveLocalStorage("privthing.pmeditedItemSpaces", copiedEditedItems);
            }
            const liveSpaceIds = editedItemSpaces
                .map((editedItemSpace) => editedItemSpace.spaceId)
                .filter((spaceId): spaceId is string => !!spaceId);
            pruneDrafts(liveSpaceIds).catch((e) => console.warn('Could not prune drafts', e));
        }
    }, [editedItemSpaces])

    useEffect(() => {
        if(!!favourites) {
            const copiedFavourites = favourites.map((favItem) => {
                return  toPersistable(favItem)
            })
            if(!!copiedFavourites) {
                saveLocalStorage("privthing.pmfavourites", copiedFavourites);
            }
        }
    }, [favourites])

    useEffect(() => {
        if(!!recents) {
            const copiedRecents = recents.map((recentItem) => {
                return  toPersistable(recentItem)
            })
            if(!!copiedRecents) {
                saveLocalStorage("privthing.pmrecents", copiedRecents);
            }
        }
    }, [recents])

    const buildContextMenu = (e: React.MouseEvent<HTMLDivElement>, noteSpaceItem: EditItem): void => {
        e.preventDefault();
        const {pageX, pageY} = e;

        const menuItems: GenericContextMenuItem[] = []

        if(editedItemSpaces.length > 1) {
            menuItems.push({
                action: 'closeNoteSpace',
                title: t("closeNoteSpace")
            });
            menuItems.push({
                action: 'closeNoteSpacesButThis',
                title: t("closeNoteSpacesButThis")
            });
        }

        setNoteSpaceContextMenu({show: true, x: pageX, y:pageY, noteSpaceItem: noteSpaceItem, menuActions: menuItems});
    }

    const handleContextMenuAction = (menuAction: GenericContextMenuAction) => {
        const noteSpaceItem = noteSpaceContextMenu.noteSpaceItem;
        switch(menuAction.action) {
            case 'closeNoteSpace':
                if(noteSpaceItem) {
                    closeSpace(noteSpaceItem);
                }
                break;
            case 'closeNoteSpacesButThis':
                if(noteSpaceItem) {
                    closeOtherSpaces(noteSpaceItem);
                }
                break;
            case 'close':
            default:
                break;
        }

        setNoteSpaceContextMenu(initialNoteSpaceContextMenu)
    }

    const isFavourite = (item: EditItem): boolean => {
        return favourites && !!favourites.find((favItem) => favItem.path === item.path);
    }

    return (
        <div className='notesSpacesContainer'>
            {noteSpaceContextMenu.show === true && <GenericContextMenuComp x={noteSpaceContextMenu.x} y={noteSpaceContextMenu.y} menuActions={noteSpaceContextMenu.menuActions} contextMenuAction={handleContextMenuAction}/>}
            {comparePair && <CompareComp left={comparePair[0]} right={comparePair[1]} onClose={() => setComparePair(null)}/>}
            {
                pendingClose &&
                <ConfirmationComp
                    externalHeading={t("warning")}
                    externalSaveLabel={t("yes")}
                    externalCloseLabel={t("no")}
                    handleExternalSave={() => { pendingClose(); setPendingClose(null); }}
                    handleExternalClose={() => setPendingClose(null)}
                >{t("unsavedChanges")}</ConfirmationComp>
            }
            {
                editedItemSpaces.map((editedItemSpace, index) => (
                    <Fragment key={editedItemSpace.spaceId || index}>
                    {
                        index > 0 &&
                        <div className='noteSpacesDivider'>
                            <VscDiff
                                title={t("compareNotes")}
                                aria-label={t("compareNotes")}
                                role="button"
                                tabIndex={0}
                                className='h5 noteSpacesDividerIcon'
                                onKeyDown={keyActivate(() => setComparePair([editedItemSpaces[index - 1], editedItemSpace]))}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setComparePair([editedItemSpaces[index - 1], editedItemSpace]);
                                }}
                            />
                        </div>
                    }
                    <div style={{flex: editedItemSpace.flex || 1, display: 'flex'}} className='noteSpaceContainer'>
                        <div style={{textAlign: 'center'}}>
                            {
                                editedItemSpaces.length > 1 && (!editedItemSpace.flex || editedItemSpace.flex < 2) && <PiArrowsOutLineHorizontalFill title={t("stretch")} aria-label={t("stretch")} role="button" tabIndex={0} onKeyDown={keyActivate(() => mainDispatch({type: MAIN_ACTIONS.STRETCH_NOTE_SPACE, payload: editedItemSpace}))} className='h4 itemTabIconResize' onClick={(e) => {
                                    e.preventDefault();
                                    mainDispatch({type: MAIN_ACTIONS.STRETCH_NOTE_SPACE, payload: editedItemSpace});
                                }}/>
                            }
                            {
                                editedItemSpaces.length > 1 && (editedItemSpace.flex && editedItemSpace.flex >= 2) && <PiArrowsInLineHorizontalFill title={t("shrink")} aria-label={t("shrink")} role="button" tabIndex={0} onKeyDown={keyActivate(() => mainDispatch({type: MAIN_ACTIONS.SHRINK_NOTE_SPACE, payload: editedItemSpace}))} className='h4 itemTabIconResize' onClick={(e) => {
                                    e.preventDefault();
                                    mainDispatch({type: MAIN_ACTIONS.SHRINK_NOTE_SPACE, payload: editedItemSpace});
                                }}/>
                            }
                            <div style={{padding: 10}} className={'editItemSpace ' + (editedItemSpace.isActive ? 'isActive' : '')} 
                                role="button"
                                tabIndex={0}
                                aria-pressed={editedItemSpace.isActive === true}
                                aria-label={editedItemSpace.name || t("newNote")}
                                onKeyDown={keyActivate(() => mainDispatch({type: MAIN_ACTIONS.SET_NOTE_SPACE_ACTIVE, payload: editedItemSpace}))}
                                onClick={() => {
                                    mainDispatch({type: MAIN_ACTIONS.SET_NOTE_SPACE_ACTIVE, payload: editedItemSpace})
                                }}
                                onContextMenu={(e) => buildContextMenu(e, editedItemSpace)}
                            >
                                <div>
                                    {
                                        isFavourite(editedItemSpace) &&
                                        <FaStar title={t("removeFromFavourites")} aria-label={t("removeFromFavourites")} role="button" tabIndex={0} onKeyDown={keyActivate(() => mainDispatch({type: MAIN_ACTIONS.REMOVE_FROM_FAVOURITES, payload: editedItemSpace}))} className='h6' style={{margin: 0, padding: 0, marginRight: 5}} onClick={(e) => {
                                            e.preventDefault();
                                            mainDispatch({type: MAIN_ACTIONS.REMOVE_FROM_FAVOURITES, payload: editedItemSpace})
                                        }}/>
                                    }
                                    {
                                        !isFavourite(editedItemSpace) &&
                                        <FaRegStar title={t("addToFavourites")} aria-label={t("addToFavourites")} role="button" tabIndex={0} onKeyDown={keyActivate(() => mainDispatch({type: MAIN_ACTIONS.ADD_TO_FAVOURITES, payload: editedItemSpace}))} className='h6' style={{margin: 0, padding: 0, marginRight: 5}} onClick={(e) => {
                                            e.preventDefault();
                                            mainDispatch({type: MAIN_ACTIONS.ADD_TO_FAVOURITES, payload: editedItemSpace})
                                        }}/>
                                    }
                                    {editedItemSpace.name ? editedItemSpace.name : '---'}
                                </div>
                            </div>
                            { 
                                editedItemSpaces.length > 1 && <FiMinusCircle title={t("closeNoteSpace")} aria-label={t("closeNoteSpace")} role="button" tabIndex={0} onKeyDown={keyActivate(() => closeSpace(editedItemSpace))} color={editedItemSpace.isActive ? '#ffffff' : '#000000'} className='h2 itemTabIconRemove' onClick={(e) => {
                                    e.preventDefault();
                                    closeSpace(editedItemSpace);
                                }}/>
                            }
                            {
                                (index === editedItemSpaces.length - 1) && <FiPlusCircle title={t("newNoteSpace")} aria-label={t("newNoteSpace")} role="button" tabIndex={0} onKeyDown={keyActivate(() => {
                                    const payLoadItem: Item = getNewItem();
                                    mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}, action: 'NEW_NOTE_SPACE'}});
                                })} className='h2 itemTabIconAdd' onClick={() => {
                                    const payLoadItem: Item = getNewItem();
                                    mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}, action: 'NEW_NOTE_SPACE'}});
                                }}/>
                            }
                        </div>
                        <NoteComp editedItem={editedItemSpace} />
                    </div>
                    </Fragment>
                ))
            }
        </div>
    )
}

export default NoteSpacesComp
