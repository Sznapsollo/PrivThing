import '../styles.css'
import { useTranslation } from 'react-i18next';
import { IoCloseCircleOutline } from "react-icons/io5";

interface Props {
    hint: string,
    closeHint: () => void
}

const HintsComp = ({hint, closeHint}: Props) => {

    const { t } = useTranslation();
    return (
        <div className='hintBar'>
            <div className='hintBarText'>
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
