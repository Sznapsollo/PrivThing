import { useRef } from 'react';
import { AppState } from '../context/Context'
import { useTranslation } from 'react-i18next'
import { Item } from '../model';
import { FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import { saveLocalStorage } from '../helpers/helpers'

const TabsComp = () => {

    const { mainState, mainDispatch, settingsState } = AppState();
    const { t } = useTranslation();

    if(mainState.tabs) {
        saveLocalStorage("pmTabs", mainState.tabs);
    }

    const dragItem = useRef<number | null>();
    const dragOverItem = useRef<number | null>();
   
    const dragStart = <T,>(e: T, position:number) => {
          dragItem.current = position;
    };
   
    const dragEnter = <T,>(e: T, position:number) => {
        dragOverItem.current = position;
    };
   
    const drop = <T,>(e: T) => {
      const copyListItems = [...mainState.tabs];
      if(dragItem.current == null || dragOverItem.current == null) {
        return
      }
      const dragItemContent = copyListItems[dragItem.current];
      copyListItems.splice(dragItem.current, 1);
      copyListItems.splice(dragOverItem.current, 0, dragItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      mainDispatch({type: "UPDATE_TABS", payload: copyListItems});
    };

    return (
        <div>
            {
                mainState.tabs.map((tabItem, tabItemIndex) => {
                    return <span key={tabItemIndex}
                    onDragStart={(e) => dragStart(e, tabItemIndex)}
                    onDragEnter={(e) => dragEnter(e, tabItemIndex)}
                    onDragEnd={drop}
                    draggable
                    >
                        <div className={'itemTab ' + ((tabItem.active === true) ? 'selected': '')} onClick={() => {
                        if(tabItem.active === true) {
                            return
                        }
                        mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: tabItem, tab: tabItem}});
                        }}>{tabItem.name || t("empty")} &nbsp; 
                        </div>
                        {mainState.tabs.length > 1 && <FiMinusCircle className='h2 itemTabIconRemove' onClick={(e) => {
                            e.preventDefault();
                            mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: mainState.editedItem, tab: tabItem, action: 'REMOVE_TAB'}});
                        }}/>}
                    </span>
                        
                })
            }
            <FiPlusCircle className='h2 itemTabIconAdd' onClick={() => {
                const payLoadItem: Item = {
                    name: '',
                    path: '',
                    size: 0,
                    rawNote: undefined
                };
                mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
            }}/>
        </div>
    )
}

export default TabsComp
