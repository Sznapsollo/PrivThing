import { useState, useEffect } from 'react'
import { Item } from '../model';
import { AppState } from '../context/Context'
import { GiPadlock } from 'react-icons/gi';
import { useTranslation } from 'react-i18next'
import moment from 'moment';
import '../styles.css'

interface Props {
    item: Item,
    keyProp: number
}

const LisItem = ({item, keyProp}: Props) => {

    const { t } = useTranslation();

    const { mainState: {editedItem}, mainDispatch } = AppState();
    const [ itemCss, setItemCss ] = useState('');

    useEffect(() => {
        updateItemCss();
    }, [editedItem.path]);

    useEffect(() => {
        updateItemCss();
    }, [item]);

    const updateItemCss = () => {
        let itemsCsses: string[] = []
        if(keyProp % 2 === 0) {
            itemsCsses.push('evenRow')
        }
        if(editedItem.path === item.path) {
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
                mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
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
                mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
            }}
            >
            {item.name?.endsWith('.prvmttr') && <div className='listItemIcon'><GiPadlock style={{marginBottom: 0, marginLeft: -5, marginRight: 5}} className='h2'/></div>}
            <div className='listItemBody' title={item.name + ( item.path ? ('\n' + item.path) : '') + ( item.lastModified ? ('\n' + t('lastModified') + ': ' + moment.utc(item.lastModified).format("YYYY-MM-DD HH:mm:ss")) : '') + ( item.size ? ('\n' + t('size') + ': ' + item.size + (item.folder !== 'localStorage' ? ' kB' : '')) : '')}>
                <div className='name' data-content={item.name}></div>
                <div className='path' data-content={item.path}></div>
            </div>
        </div>
    )
}

export default LisItem
