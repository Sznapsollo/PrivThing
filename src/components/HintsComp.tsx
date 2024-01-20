import '../styles.css'
import { useTranslation } from 'react-i18next';
import { IoCloseCircleOutline } from "react-icons/io5";
import { ImInfo } from "react-icons/im";

interface Props {
    hint: string,
    closeHint: () => void,
    onAnotherHint: () => void
}

const HintsComp = ({hint, closeHint, onAnotherHint}: Props) => {

    const { t } = useTranslation();
    return (
        <div className='hintBar'>
            <div className='hintBarText'>
                {
                    onAnotherHint && 
                    <ImInfo title={t("closeNoteSpace")} color={'#666666'} className='h5 itemTabIconRemove' onClick={(e) => {
                        e.preventDefault();
                        onAnotherHint();
                    }}/>
                }
                &nbsp;
                {hint}
            </div>
            <div>
                <IoCloseCircleOutline title={t("closeNoteSpace")} color={'#666666'} className='h2 itemTabIconRemove' onClick={(e) => {
                    e.preventDefault();
                    closeHint();
                }}/>
            </div>
        </div>
    )
}

export default HintsComp
