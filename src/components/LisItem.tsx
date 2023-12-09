import { useState, useEffect } from 'react'
import { Item } from '../model';
import { AppState } from '../context/Context'
import { GiPadlock } from 'react-icons/gi';
import { FaFolderOpen } from "react-icons/fa";
import { useTranslation } from 'react-i18next'
import moment from 'moment';
import '../styles.css'
import { MAIN_ACTIONS } from '../context/Reducers';

interface Props {
    item: Item,
    keyProp: number,
    editedItemPath?: string
}

const LisItem = ({item, keyProp, editedItemPath}: Props) => {

    const { t } = useTranslation();

    const { mainDispatch } = AppState();
    const [ itemCss, setItemCss ] = useState('');

    useEffect(() => {
        updateItemCss();
    }, [item, editedItemPath]);

    const updateItemCss = () => {
        let itemsCsses: string[] = []
        if(keyProp % 2 === 0) {
            itemsCsses.push('evenRow')
        }
        if(editedItemPath === item.path) {
            itemsCsses.push('selected');
        }
        if(itemsCsses) {
            setItemCss(itemsCsses.join(' '))
        }
    }

    return (
        <div className={"listItem " + itemCss} 
            onClick={() => {
                const payLoadItem: Item = {
                    name: item.name,
                    folder: item.folder,
                    path: item.path,
                    size: item.size,
                    fetchData: item.folder === 'localStorage' ? false : true,
                    rawNote: undefined
                };
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                const payLoadItem: Item = {
                    name: item.name,
                    folder: item.folder,
                    path: item.path,
                    size: item.size,
                    fetchData: item.folder === 'localStorage' ? false : true,
                    rawNote: undefined
                };
                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
            }}
            >
            <div className='listItemIcon'>
                {item.name?.endsWith('.prvthng') && <GiPadlock style={{margin: "1px 5px 0 -5px"}} className='h4'/>}
                {(item.folder !== 'localStorage') && <FaFolderOpen style={{margin: "1px 5px 0 -3px"}} />}
            </div>
            <div className='listItemBody' title={item.name + ( item.path ? ('\n' + item.path) : '') + ( item.lastModified ? ('\n' + t('lastModified') + ': ' + moment.utc(item.lastModified).format("YYYY-MM-DD HH:mm:ss")) : '') + ( item.size ? ('\n' + t('size') + ': ' + item.size + (item.folder !== 'localStorage' ? ' kB' : '')) : '')}>
                <div className='name' data-content={item.name}></div>
                <div className='path' data-content={item.path}></div>
            </div>
        </div>
    )
}

export default LisItem
