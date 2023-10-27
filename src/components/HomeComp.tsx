import ItemsComp from './ItemsComp';
import NoteComp from './NoteComp';
import { AppState } from '../context/Context'
import '../styles.css'

const HomeComp = () => {

    const { mainState } = AppState();
    
    return (
        <div className='home'>
            <ItemsComp />
            <div className={'homeContainer ' + mainState.homeCss}>
                <NoteComp />
            </div>
        </div>
    )
}

export default HomeComp
