import {useRef} from 'react'
import { useClickAway } from 'react-use';
// import { AppState } from '../context/Context';
// import { useTranslation } from 'react-i18next'
// import { MAIN_ACTIONS } from '../context/Reducers';
import { GenericContextMenuAction, GenericContextMenuItem } from '../model';

interface Props {
    x: number, 
    y: number,
    menuActions: GenericContextMenuItem[],
    contextMenuAction: (menuAction: GenericContextMenuAction) => void
}

const GenericContextMenuComp = ({x, y, menuActions, contextMenuAction}: Props) => {
    
    // const { t } = useTranslation();

    // const { mainDispatch } = AppState();

    const closeContextMenu = () => {
        contextMenuAction({action: 'close'});
    }

    const contextMenuRef = useRef<HTMLDivElement>(null);
    useClickAway(contextMenuRef, closeContextMenu);

    return (
        <div ref={contextMenuRef} style={{top: y, left: x}} className='contextMenu'>
            {
                menuActions.map((menuAction, index) => (
                    <div key={index} className='contextMenuItem' onClick={() => {
                        contextMenuAction({action: menuAction.action});
                    }}>
                        {menuAction.title}
                    </div>
                ))
            }
        </div>
    )
}

export default GenericContextMenuComp