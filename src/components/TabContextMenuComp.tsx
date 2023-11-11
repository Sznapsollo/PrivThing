import {useRef} from 'react'
import { useClickAway } from 'react-use';
import { Tab } from '../model';
import { AppState } from '../context/Context';

interface Props {
    x: number, 
    y: number,
    tab?: Tab,
    closeContextMenu: () => void
}

const TabContextMenuComp = ({x, y, tab, closeContextMenu}: Props) => {
    
    const { mainDispatch } = AppState();

    const contextMenuRef = useRef<HTMLDivElement>(null);
    useClickAway(contextMenuRef, closeContextMenu);

    return (
        <div ref={contextMenuRef} style={{top: y, left: x}} className='contextMenu'>
            <div className='contextMenuItem' onClick={() => {
                closeContextMenu();
                mainDispatch({type: "UPDATE_TABS", payload: []});
            }}>
                Close all tabs
            </div>
        </div>
    )
}

export default TabContextMenuComp