import React, { useEffect } from 'react'
import NoteComp from './NoteComp'
import { AppState } from '../context/Context';
import { Item } from '../model';
import { FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import { MAIN_ACTIONS } from '../context/Reducers';
import { getNewItem, saveLocalStorage } from '../utils/utils';
import { useTranslation } from 'react-i18next';

const NoteSpacesComp = () => {

    const { t } = useTranslation();

    const { mainState: { editedItemSpaces }, mainDispatch} = AppState();

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

    return (
        <div className='notesTabContainer'>
            {
                editedItemSpaces.map((editedItemSpace, index) => (
                    <div key={index} style={{flex: 1, display: 'flex', flexDirection: 'column', width: '100%'}}>
                        <div style={{textAlign: 'center'}}>
                            <div style={{padding: 10}} className={'editItemSpace ' + (editedItemSpace.isActive ? 'isActive' : '')} 
                                onClick={() => {
                                    mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_TAB_ACTIVE, payload: editedItemSpace})
                                }}
                            >
                                {editedItemSpace.name ? editedItemSpace.name : '---'}
                            </div>
                            { 
                                editedItemSpaces.length > 1 && <FiMinusCircle title={t("closeNoteSpace")} className='h2 itemTabIconRemove' onClick={(e) => {
                                    e.preventDefault();
                                    mainDispatch({type: MAIN_ACTIONS.REMOVE_EDITED_ITEM_TAB, payload: editedItemSpace});
                                }}/>
                            }
                            {
                                (index === editedItemSpaces.length - 1) && <FiPlusCircle title={t("newNoteSpace")} className='h2 itemTabIconAdd' onClick={() => {
                                    const payLoadItem: Item = getNewItem();
                                    mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}, action: 'NEW_EDIT_ITEM_TAB'}});
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
