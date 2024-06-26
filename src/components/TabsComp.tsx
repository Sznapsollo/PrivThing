import { useEffect, useRef, useState } from 'react';
import { AppState } from '../context/Context'
import { useTranslation } from 'react-i18next'
import { GenericContextMenuAction, GenericContextMenuItem, Item, Tab, TabContextMenu } from '../model';
import { FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import { PiArrowsInLineVertical, PiArrowsOutLineVertical } from 'react-icons/pi';
import { getNewItem, retrieveLocalStorage, saveLocalStorage } from '../utils/utils'
import { MAIN_ACTIONS } from '../context/Reducers';
import GenericContextMenuComp from './GenericContextMenuComp';

const initialTabContextMenu: TabContextMenu = {
    show: false,
    menuActions: [],
    x: 0,
    y: 0
}

const TabsComp = () => {

    const { mainState, mainDispatch } = AppState();
    const { t } = useTranslation();
    const [ tabContextMenu, setTabContextMenu ] = useState<TabContextMenu>(initialTabContextMenu);
    const [ tabsDisplayMode, setTabsDisplayMode ] = useState<string>('MULTILINE');

    const dragItem = useRef<number | null>();
    const dragOverItem = useRef<number | null>();
    const dragItemPrev = useRef<number | null>();
    const dragOverItemPrev = useRef<number | null>();
   
    useEffect(() => {
        let defaultTabDisplayMode = retrieveLocalStorage('privthing.pmTabsDisplayMode')
        if(defaultTabDisplayMode && defaultTabDisplayMode !== tabsDisplayMode && ['MULTILINE', 'SINGLELINE'].indexOf(defaultTabDisplayMode) >= 0) {
            console.log('switching display mode to', defaultTabDisplayMode)
            setTabsDisplayMode(defaultTabDisplayMode);
        }
    }, [])

    useEffect(() => {
        if(!!mainState.tabs) {
            const copiedTabs = mainState.tabs.map((tabItem) => {
                return  {...tabItem}
            })
            if(!!copiedTabs) {
                saveLocalStorage("privthing.pmTabs", copiedTabs);
            }
        }
    }, [mainState.tabs])

    const showPassFieldHack = (show: boolean) => {
        let secretPassFields = document.getElementsByName('secretPass');
        let secretPassFieldsDummy = document.getElementsByName('secretPassDummy');
        
        if(show) {
            if(secretPassFields) {
                Array.from(secretPassFields).forEach((secretPassField) => { secretPassField.style.display = 'inherit';});
            }
            if(secretPassFieldsDummy) {
                Array.from(secretPassFieldsDummy).forEach((secretPassFieldDummy) => { secretPassFieldDummy.style.display = 'none';});
            }
        } else {
            if(secretPassFields) {
                Array.from(secretPassFields).forEach((secretPassField) => { secretPassField.style.display = 'none';});
            }
            if(secretPassFieldsDummy) {
                Array.from(secretPassFieldsDummy).forEach((secretPassFieldDummy) => { secretPassFieldDummy.style.display = 'inherit';});
            }
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
    const buildContextMenu = (e: React.MouseEvent<HTMLDivElement>, tab: Tab): void => {
        e.preventDefault();
        const {pageX, pageY} = e;

        const menuItems: GenericContextMenuItem[] = [
            {
                action: 'openInNewNoteSpace',
                title: t("openInNewNoteSpace")
            },
            {
                action: 'closeTab',
                title: t("closeTab")
            },
            {
                action: 'closeAllTabs',
                title: t("closeAllTabs")
            }
        ]

        setTabContextMenu({show: true, x: pageX, y:pageY, tab: tab, menuActions: menuItems});
    }

    const handleContextMenuAction = (menuAction: GenericContextMenuAction) => {
        switch(menuAction.action) {
            case 'openInNewNoteSpace':
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: tabContextMenu.tab, tab: tabContextMenu.tab, action: 'NEW_NOTE_SPACE'}});
                break;
            case 'closeTab':
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: {}, tab: tabContextMenu.tab, action: 'REMOVE_TAB'}});
                break;
            case 'closeAllTabs':
                mainDispatch({type: MAIN_ACTIONS.UPDATE_TABS, payload: []});
                break;
            case 'close':
            default:
                break;
        }
        setTabContextMenu(initialTabContextMenu);
    }
    // context menu things end

    const handleChangeTabsDisplayMode = (newMode: string) => {
        setTabsDisplayMode(newMode);
        saveLocalStorage("privthing.pmTabsDisplayMode", newMode);
    }

    return (
        <div className={tabsDisplayMode === 'SINGLELINE' ? 'singleLineTabs': ''}>
            <span>
                {
                    (tabsDisplayMode !== 'SINGLELINE') &&
                    <PiArrowsInLineVertical title={t("singleLineTabs")} className='h2 tabBarShrinkIcon' onClick={(e) => {
                        handleChangeTabsDisplayMode('SINGLELINE');
                    }}/>
                }
                {
                    (tabsDisplayMode === 'SINGLELINE') &&
                    <PiArrowsOutLineVertical title={t("multiLineTabs")} className='h2 tabBarShrinkIcon' onClick={(e) => {
                        handleChangeTabsDisplayMode('MULTILINE');
                    }}/>
                }
            </span>
            {
                mainState.tabs.map((tabItem, tabItemIndex) => (
                    <span key={tabItemIndex}
                    onDragStart={(e) => dragStart(e.currentTarget, tabItemIndex)}
                    onDragEnter={(e) => dragEnter(e.currentTarget, tabItemIndex)}
                    onDragEnd={drop}
                    draggable={true}
                    >
                        <div className={'itemTab ' + ((tabItem.isActive === true) ? ' selected': '') + ((tabItem.isDragged === true) ? ' isDragged': '')} 
                            onClick={() => {
                                if(tabItem.isActive === true) {
                                    return
                                }
                                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: tabItem, tab: tabItem}});
                                }}
                            onContextMenu={(e) => buildContextMenu(e, tabItem)}
                        >{tabItem.name || t("empty")} &nbsp; 
                        </div>
                        <FiMinusCircle title={t("closeTab")} className='h2 itemTabIconRemove' onClick={(e) => {
                            e.preventDefault();
                            mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: {}, tab: tabItem, action: 'REMOVE_TAB'}});
                        }}/>
                    </span>
                        
                ))
            }
            <FiPlusCircle title={t("newTab")} className='h2 itemTabIconAdd' onClick={() => {
                const payLoadItem: Item = getNewItem();
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
            }}/>
            {tabContextMenu.show === true && <GenericContextMenuComp x={tabContextMenu.x} y={tabContextMenu.y} menuActions={tabContextMenu.menuActions} contextMenuAction={handleContextMenuAction}/>}
        </div>
    )
}

export default TabsComp
