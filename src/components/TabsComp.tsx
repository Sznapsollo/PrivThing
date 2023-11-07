import { AppState } from '../context/Context'
import { useTranslation } from 'react-i18next'
import { Item } from '../model';
import { FiPlusCircle, FiMinusCircle } from 'react-icons/fi';

const TabsComp = () => {

    const { mainState, mainDispatch, settingsState } = AppState();
    const { t } = useTranslation();

    return (
        <div>
            {
                mainState.tabs.map((tabItem, tabItemIndex) => {
                    return <span key={tabItemIndex}>
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
