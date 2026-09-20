import React, {useEffect, useRef, useState} from 'react'
import { useClickAway } from '../utils/useClickAway';
import { keyActivate } from '../utils/a11y';
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
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [focused, setFocused] = useState(0);

    useClickAway(contextMenuRef, closeContextMenu);

    useEffect(() => {
        itemRefs.current[focused]?.focus();
    }, [focused]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if(e.key === 'ArrowDown') {
            e.preventDefault();
            setFocused((current) => (current + 1) % menuActions.length);
        } else if(e.key === 'ArrowUp') {
            e.preventDefault();
            setFocused((current) => (current - 1 + menuActions.length) % menuActions.length);
        } else if(e.key === 'Home') {
            e.preventDefault();
            setFocused(0);
        } else if(e.key === 'End') {
            e.preventDefault();
            setFocused(menuActions.length - 1);
        } else if(e.key === 'Escape' || e.key === 'Tab') {
            e.preventDefault();
            closeContextMenu();
        }
    };

    return (
        <div
            ref={contextMenuRef}
            style={{top: y, left: x}}
            className='contextMenu'
            role='menu'
            aria-orientation='vertical'
            onKeyDown={onKeyDown}
        >
            {
                menuActions.map((menuAction, index) => (
                    <div
                        key={index}
                        ref={(element) => { itemRefs.current[index] = element }}
                        className='contextMenuItem'
                        role='menuitem'
                        tabIndex={index === focused ? 0 : -1}
                        onClick={() => {
                            contextMenuAction({action: menuAction.action});
                        }}
                        onKeyDown={keyActivate(() => contextMenuAction({action: menuAction.action}))}
                    >
                        {menuAction.title}
                    </div>
                ))
            }
        </div>
    )
}

export default GenericContextMenuComp