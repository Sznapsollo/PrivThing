import {useState, useEffect, useRef} from 'react'
import ItemsComp from './ItemsComp';
import NoteComp from './NoteComp';
import { AppState } from '../context/Context'
import { retrieveLocalStorage, saveLocalStorage } from '../utils/utils'
import { BsArrowLeftRight } from 'react-icons/bs';
import '../styles.css'
import TabsComp from './TabsComp';


let isItemsResizing: boolean = false;
let resizeHideItemsHandle: ReturnType<typeof setTimeout> | null = null;
let defaultItemsWidth: string = retrieveLocalStorage("privmatter.pmItemsWidth");

const HomeComp = () => {

    const { mainState, mainDispatch } = AppState();
    const [itemsWidth, setItemsWidth] = useState(typeof defaultItemsWidth === 'number' ? defaultItemsWidth : 25);
    const itewsWrapperRef = useRef(null);

    const mouseUpListener = () => {
        cleanListeners();

        let currentItemsWidth = (itewsWrapperRef?.current as any).style?.width;
        if(typeof currentItemsWidth === 'string' && currentItemsWidth.includes('%')) {
            currentItemsWidth = parseInt(currentItemsWidth.replace('%',''));

            // NJ save width
            if(currentItemsWidth > 5 && currentItemsWidth < 100) {
                // console.log('pmItemsWidth', currentItemsWidth)

                saveLocalStorage("privmatter.pmItemsWidth", currentItemsWidth);
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
                mainDispatch({type: 'HIDE_ITEMS_BAR'});
            }, 200);
        }
    }

    useEffect(() => {
        window.removeEventListener('resize', handleWindowResize);
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        }
    }, [])

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
            <div ref={itewsWrapperRef} className={"itemsResizeWrapper " + (mainState.fullItems === true ? 'fullItemsDisplay' : '')} style={{width: mainState.fullItems === true ? 'auto' : itemsWidth + '%'}}>
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
                <NoteComp />
            </div>
        </div>
    )
}

export default HomeComp
