import { useState, useEffect } from 'react'
import { Item } from '../model';
import { isPinned, togglePinned } from '../utils/pinned';
import { displayItemPath } from '../utils/itemDisplay';
import { keyActivate } from '../utils/a11y';
import { formatUtcDateTime } from '../utils/dates';
import { AppState } from '../context/Context'
import { GiPadlock } from 'react-icons/gi';
import { TbPin, TbPinnedFilled } from 'react-icons/tb';
import { FaFolderOpen } from "react-icons/fa";
import { useTranslation } from 'react-i18next'
import '../styles.css'
import { MAIN_ACTIONS } from '../context/Reducers';

interface Props {
    item: Item,
    onPinnedChange?: () => void,
    keyProp: number,
    editedItemPath?: string,
    onDragStart?: (item: HTMLSpanElement, position:number) => void,
    onDragEnter?: (e: HTMLSpanElement, position:number) => void,
    onDrop?: <T,>(e: T) => void
}

const LisItem = ({item, keyProp, editedItemPath, onPinnedChange, onDragStart, onDragEnter, onDrop}: Props) => {

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

    const openItem = (inNewSpace: boolean) => {
        const payLoadItem: Item = {
            name: item.name,
            folder: item.folder,
            path: item.path,
            size: item.size,
            fetchData: item.folder === 'localStorage' ? false : true,
            rawNote: undefined
        };
        mainDispatch({
            type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE,
            payload: {
                item: payLoadItem,
                tab: {...payLoadItem, isNew: true},
                action: inNewSpace ? 'NEW_NOTE_SPACE' : undefined
            }
        });
    }

    let canDrag = !!onDragStart;

    return (
        <div className={"listItem " + itemCss} 
            role="button"
            tabIndex={0}
            aria-label={item.name}
            onKeyDown={keyActivate(() => openItem(false))}
            onClick={() => openItem(false)}
            onContextMenu={(e) => {
                e.preventDefault();
                openItem(true);
            }}
            onDragStart={(e) => onDragStart && onDragStart(e.currentTarget, keyProp)}
            onDragEnter={(e) => onDragEnter && onDragEnter(e.currentTarget, keyProp)}
            onDragEnd={onDrop}
            draggable={canDrag}
            >
            <div
                className={'listItemPin' + (isPinned(item.path) ? ' listItemPinned' : '')}
                title={isPinned(item.path) ? t("unpinFromTop") : t("pinToTop")}
                role="button"
                tabIndex={0}
                aria-label={(isPinned(item.path) ? t("unpinFromTop") : t("pinToTop")) + ': ' + item.name}
                aria-pressed={isPinned(item.path)}
                onKeyDown={keyActivate(() => {
                    togglePinned(item.path);
                    if(onPinnedChange) {
                        onPinnedChange();
                    }
                })}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    togglePinned(item.path);
                    if(onPinnedChange) {
                        onPinnedChange();
                    }
                }}
            >
                {isPinned(item.path) ? <TbPinnedFilled /> : <TbPin />}
            </div>
            <div className='listItemIcon'>
                {item.name?.endsWith('.prvthng') && <GiPadlock style={{margin: "1px 5px 0 -5px"}} className='h4'/>}
                {(item.folder !== 'localStorage') && <FaFolderOpen style={{margin: "1px 5px 0 -3px"}} />}
            </div>
            <div className='listItemBody' title={item.name + ( item.path ? ('\n' + item.path) : '') + ( item.lastModified ? ('\n' + t('lastModified') + ': ' + formatUtcDateTime(item.lastModified)) : '') + ( item.size ? ('\n' + t('size') + ': ' + item.size + (item.folder !== 'localStorage' ? ' kB' : '')) : '')}>
                <div className='name' data-content={item.name}></div>
                <div className='path' data-content={displayItemPath(item)}></div>
            </div>
        </div>
    )
}

export default LisItem
