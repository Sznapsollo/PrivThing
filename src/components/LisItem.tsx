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

    const { mainState, mainDispatch } = AppState();
    const [ itemCss, setItemCss ] = useState('');

    useEffect(() => {
        updateItemCss();
    }, [mainState.editedItem]);

    useEffect(() => {
        updateItemCss();
    }, [item]);

    const updateItemCss = () => {
        let itemsCsses: string[] = []
        if(keyProp % 2 === 0) {
            itemsCsses.push('evenRow')
        }
        if(mainState.editedItem.path === item.path) {
            itemsCsses.push('selected');
        }
        if(itemsCsses) {
            setItemCss(itemsCsses.join(' '))
        }
    }

    return (
        <div className={"listItem " + itemCss} onClick={() => {
            const payLoadItem: Item = {
                name: item.name,
                path: item.path,
                size: item.size,
                fetchData: true,
                rawNote: undefined
            };
            mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: payLoadItem});
            }}>
            {item.name?.endsWith('.prvmttr') && <div className='listItemIcon'><GiPadlock style={{marginBottom: 0, marginLeft: -5, marginRight: 5}} className='h2'/></div>}
            <div className='listItemBody' title={item.name + ( item.path ? ('\n' + item.path) : '') + ( item.lastModified ? ('\n' + t('lastModified') + ': ' + moment.utc(item.lastModified).format("YYYY-MM-DD HH:mm:ss")) : '') + ( item.size ? ('\n' + t('size') + ': ' + item.size + ' kB') : '')}>
                <div className='name'>{item.name}</div>
                <div className='path'>{item.path}</div>
            </div>
        </div>
    )
}

export default LisItem
