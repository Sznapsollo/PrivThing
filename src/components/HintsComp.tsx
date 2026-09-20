import '../styles.css'
import { useTranslation } from 'react-i18next'
import { keyActivate } from '../utils/a11y';;
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
                    <ImInfo title={t("anotherHint")} aria-label={t("anotherHint")} role="button" tabIndex={0} onKeyDown={keyActivate(() => onAnotherHint())} color={'#666666'} className='h5 itemTabIconRemove' onClick={(e) => {
                        e.preventDefault();
                        onAnotherHint();
                    }}/>
                }
                &nbsp;
                {hint}
            </div>
            <div>
                <IoCloseCircleOutline title={t("close")} aria-label={t("close")} role="button" tabIndex={0} onKeyDown={keyActivate(() => closeHint())} color={'#666666'} className='h2 itemTabIconRemove' onClick={(e) => {
                    e.preventDefault();
                    closeHint();
                }}/>
            </div>
        </div>
    )
}

export default HintsComp
