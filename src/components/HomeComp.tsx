import {useState, useEffect, useRef} from 'react'
import ItemsComp from './ItemsComp';
import { AppState } from '../context/Context'
import { getRandomHint, retrieveLocalStorage, saveLocalStorage } from '../utils/utils'
import { BsArrowLeftRight } from 'react-icons/bs';
import i18n from '../i18n';
import '../styles.css'
import TabsComp from './TabsComp';
import { MAIN_ACTIONS } from '../context/Reducers';
import NoteSpacesComp from './NoteSpacesComp';
import HintsComp from './HintsComp';
import { useTranslation } from 'react-i18next';


let isItemsResizing: boolean = false;
let resizeHideItemsHandle: ReturnType<typeof setTimeout> | null = null;
let defaultItemsWidth: string = retrieveLocalStorage("privthing.pmItemsWidth");

const HomeComp = () => {

    const { mainState, settingsState: {showHints}, mainDispatch } = AppState();
    const [hint, setHint] = useState('');
    const [showHint, setShowHint] = useState(showHints)
    const [itemsWidth, setItemsWidth] = useState(typeof defaultItemsWidth === 'number' ? defaultItemsWidth : 25);
    const itewsWrapperRef = useRef(null);

    const { t } = useTranslation();

    const mouseUpListener = () => {
        cleanListeners();

        let currentItemsWidth = (itewsWrapperRef?.current as any).style?.width;
        if(typeof currentItemsWidth === 'string' && currentItemsWidth.includes('%')) {
            currentItemsWidth = parseInt(currentItemsWidth.replace('%',''));

            // NJ save width
            if(currentItemsWidth > 5 && currentItemsWidth < 100) {
                // console.log('pmItemsWidth', currentItemsWidth)

                saveLocalStorage("privthing.pmItemsWidth", currentItemsWidth);
            }
        }
    }

    const handleWindowResize = () => {
        // NJ in case its full items and we entlarge screen
        // console.log('handleWindowResize')
        
        if(itewsWrapperRef?.current && (itewsWrapperRef.current as any).classList.contains('fullItemsDisplay') && window.innerWidth > 500) {
            if(resizeHideItemsHandle) {
                clearTimeout(resizeHideItemsHandle);
            }
            resizeHideItemsHandle = setTimeout(function() {
                mainDispatch({type: MAIN_ACTIONS.HIDE_ITEMS_BAR});
            }, 200);
        }
    }

    useEffect(() => {
        window.removeEventListener('resize', handleWindowResize);
        window.addEventListener('resize', handleWindowResize);

        setHint(t(getRandomHint()));

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        }
    }, [])

    useEffect(() => {
        setHint(t(getRandomHint()));
    }, [i18n?.language])

    const resizingOfColumns = (e:MouseEvent) => {
        if(!isItemsResizing) {
            cleanListeners();
            return
        }
        
        let percWidth = Math.round(e.clientX * 100 / window.innerWidth);
        if(percWidth > 10 && percWidth < 100) {
            setItemsWidth(percWidth)
        }

        // console.log('isResizing', e.clientX, percWidth)
    }

    const cleanListeners = () => {
        window.removeEventListener("mousemove", resizingOfColumns);
        window.removeEventListener("mouseup", mouseUpListener);
        isItemsResizing = false;
    }

    // console.log(new Date().getTime(), isItemsResizing)
    
    return (
        <div className={'home nonTextSelectable'}>
            <div ref={itewsWrapperRef} className={"itemsResizeWrapper " + (mainState.fullItems === true ? 'fullItemsDisplay' : '')} style={{width: mainState.fullItems === true ? '100%' : itemsWidth + '%'}}>
                <ItemsComp />    
            </div>
            <div className='resizer'
            onMouseDown={() => {
                window.removeEventListener("mousemove", resizingOfColumns);
                window.addEventListener("mousemove", resizingOfColumns);
                window.removeEventListener("mouseup", mouseUpListener);
                window.addEventListener("mouseup", mouseUpListener);
                isItemsResizing = true;
            }}
            >
                <BsArrowLeftRight style={{margin: "auto"}}/>
            </div>
            <div className={'homeContainer ' + (mainState.fullItems === true ? 'dontDisplay' : '')}>
                <TabsComp />
                <NoteSpacesComp />
                {showHint && <HintsComp hint={hint} closeHint={() => {setShowHint(false)}} onAnotherHint={() => {setHint(t(getRandomHint()))}}/>}
            </div>
        </div>
    )
}

export default HomeComp
