import {useState, useRef} from 'react'
import ItemsComp from './ItemsComp';
import NoteComp from './NoteComp';
import { AppState } from '../context/Context'
import { BsArrowLeftRight } from 'react-icons/bs';
import '../styles.css'

const HomeComp = () => {

    const { mainState } = AppState();
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [itemsWidth, setItemsWidth] = useState(25);
    
    const mouseUpListener = () => {
        cleanListeners();
    }

    const resizingOfColumns = (e:MouseEvent) => {
        if(!isResizing) {
            cleanListeners();
            return
        }
        
        let percWidth = Math.round(e.clientX * 100 / window.innerWidth);
        if(percWidth > 20 && percWidth < 100) {
            setItemsWidth(percWidth)
        }

        // console.log('isResizing', e.clientX, percWidth)
    }

    const cleanListeners = () => {
        window.removeEventListener("mousemove", resizingOfColumns);
        window.removeEventListener("mouseup", mouseUpListener);
    }

    return (
        <div className='home'>
            <div className={"itemsResizeWrapper " + mainState.itemsCss} style={{width: itemsWidth + '%'}}>
                <ItemsComp />    
            </div>
            
            <div className='resizer'
            onMouseDown={() => {
                setIsResizing(true);
                window.removeEventListener("mousemove", resizingOfColumns);
                window.addEventListener("mousemove", resizingOfColumns);
                window.removeEventListener("mouseup", mouseUpListener);
                window.addEventListener("mouseup", mouseUpListener);
            }}
            >
                <BsArrowLeftRight style={{margin: "auto"}}/>
            </div>
            <div className={'homeContainer ' + mainState.homeCss}>
                <NoteComp />
            </div>
        </div>
    )
}

export default HomeComp
