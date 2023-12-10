import React from 'react'
import NoteComp from './NoteComp'
import { AppState } from '../context/Context';
import { Item } from '../model';
import { FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import { MAIN_ACTIONS } from '../context/Reducers';
import { getNewItem } from '../utils/utils';

const NotesTabComp = () => {

    const { mainState: { editedItemTabs }, mainDispatch} = AppState();

    return (
        <div className='notesTabContainer'>
            {
                editedItemTabs.map((editedItemTab, index) => (
                    <div key={index} style={{flex: 1, display: 'flex', flexDirection: 'column', width: '100%'}}>
                        <div style={{textAlign: 'center'}}>
                            <div style={{padding: 10}} className={'editItemTab ' + (editedItemTab.isActive ? 'isActive' : '')}
                                onClick={() => {
                                    mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_TAB_ACTIVE, payload: editedItemTab})
                                }}
                            >
                                {editedItemTab.name ? editedItemTab.name : '---'}
                            </div>
                            { 
                                editedItemTabs.length > 1 && <FiMinusCircle className='h2 itemTabIconRemove' onClick={(e) => {
                                    e.preventDefault();
                                    mainDispatch({type: MAIN_ACTIONS.REMOVE_EDITED_ITEM_TAB, payload: editedItemTab});
                                }}/>
                            }
                            {
                                (index === editedItemTabs.length - 1) && <FiPlusCircle className='h2 itemTabIconAdd' onClick={() => {
                                    const payLoadItem: Item = getNewItem();
                                    mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}, action: 'NEW_EDIT_ITEM_TAB'}});
                                }}/>
                            }
                        </div>
                        <NoteComp editedItem={editedItemTab} />
                    </div>
                ))
            }
        </div>
    )
}

export default NotesTabComp
