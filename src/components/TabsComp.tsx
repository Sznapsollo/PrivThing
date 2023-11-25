import { useEffect, useRef, useState } from 'react';
import { AppState } from '../context/Context'
import { useTranslation } from 'react-i18next'
import { Item, Tab, TabContextMenu } from '../model';
import { FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import { getNewItem, saveLocalStorage } from '../utils/utils'
import TabContextMenuComp from './TabContextMenuComp';
import { MAIN_ACTIONS } from '../context/Reducers';

const initialTabContextMenu: TabContextMenu = {
    show: false,
    x: 0,
    y: 0
}

const TabsComp = () => {

    const { mainState, mainDispatch } = AppState();
    const { t } = useTranslation();
    const [ tabContextMenu, setTabContextMenu ] = useState<TabContextMenu>(initialTabContextMenu)

    useEffect(() => {
        if(mainState.tabs) {
            saveLocalStorage("privthing.pmTabs", mainState.tabs);
        }
    }, [mainState.tabs])

    const dragItem = useRef<number | null>();
    const dragOverItem = useRef<number | null>();
    const dragItemPrev = useRef<number | null>();
    const dragOverItemPrev = useRef<number | null>();
   
    const showPassFieldHack = (show: boolean) => {
        let secretPassField = document.getElementById('secretPass');
        let secretPassFieldDummy = document.getElementById('secretPassDummy');
        if(!secretPassField || !secretPassFieldDummy) {
            return
        }
        if(show) {
            secretPassField.style.display = 'inherit';
            secretPassFieldDummy.style.display = 'none';
        } else {
            secretPassField.style.display = 'none';
            secretPassFieldDummy.style.display = 'inherit';
        }
    }

    // dndn stuff start

    const dragStart = (item: HTMLSpanElement, position:number) => {
        showPassFieldHack(false);
        dragItem.current = position;

        const copyListItems = [...mainState.tabs];
        copyListItems[position].isDragged = true;
        mainDispatch({type: MAIN_ACTIONS.UPDATE_TABS, payload: copyListItems});
    };
   
    const dragEnter = (e: HTMLSpanElement, position:number) => {
        dragOverItem.current = position;

        if(dragItem.current == null || dragOverItem.current == null) {
            return
        }

        if((dragItemPrev.current === dragOverItem.current) && ((dragOverItemPrev.current === dragItem.current))) {
            return
        }

        dragItemPrev.current = dragItem.current;
        dragOverItemPrev.current = dragOverItem.current;

        if(dragItem.current  === dragOverItem.current) {
            return
        }

        const copyListItems = [...mainState.tabs];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = position;
        dragOverItem.current = null;
        
        copyListItems[position].isDragged = true;

        mainDispatch({type: MAIN_ACTIONS.UPDATE_TABS, payload: copyListItems});
    };
   
    const drop = <T,>(e: T) => {
        showPassFieldHack(true);
        const copyListItems = mainState.tabs.map((tabItem) => {
            return {...tabItem, isDragged: false};
        });
        if(dragItem.current == null || dragOverItem.current == null) {
            mainDispatch({type: MAIN_ACTIONS.UPDATE_TABS, payload: copyListItems});
            return
        }
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        mainDispatch({type: MAIN_ACTIONS.UPDATE_TABS, payload: copyListItems});
    };

    // dndn stuff end

    // context menu things start
    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, tab: Tab): void => {
        e.preventDefault();
        const {pageX, pageY} = e;
        setTabContextMenu({show: true, x: pageX, y:pageY, tab: tab});
    }

    const handleContextMenuClose = () => setTabContextMenu(initialTabContextMenu)
    // context menu things end

    return (
        <div>
            {
                mainState.tabs.map((tabItem, tabItemIndex) => (
                    <span key={tabItemIndex}
                    onDragStart={(e) => dragStart(e.currentTarget, tabItemIndex)}
                    onDragEnter={(e) => dragEnter(e.currentTarget, tabItemIndex)}
                    onDragEnd={drop}
                    draggable={true}
                    >
                        <div className={'itemTab ' + ((tabItem.active === true) ? ' selected': '') + ((tabItem.isDragged === true) ? ' isDragged': '')} 
                            onClick={() => {
                                if(tabItem.active === true) {
                                    return
                                }
                                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: tabItem, tab: tabItem}});
                                }}
                            onContextMenu={(e) => handleContextMenu(e, tabItem)}
                        >{tabItem.name || t("empty")} &nbsp; 
                        </div>
                        <FiMinusCircle className='h2 itemTabIconRemove' onClick={(e) => {
                            e.preventDefault();
                            mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: {}, tab: tabItem, action: 'REMOVE_TAB'}});
                        }}/>
                    </span>
                        
                ))
            }
            <FiPlusCircle className='h2 itemTabIconAdd' onClick={() => {
                const payLoadItem: Item = getNewItem();
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
            }}/>
            {tabContextMenu.show === true && <TabContextMenuComp x={tabContextMenu.x} y={tabContextMenu.y} tabItem={tabContextMenu.tab} closeContextMenu={handleContextMenuClose}/>}
        </div>
    )
}

export default TabsComp
