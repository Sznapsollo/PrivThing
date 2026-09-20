import { useMemo } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { EditItem } from '../../model';
import { diffLines, diffSummary } from '../../utils/diff';
import { getNoteText } from './noteTexts';

interface Props {
    left: EditItem,
    right: EditItem,
    onClose: () => void
}

const CompareComp = ({ left, right, onClose }: Props) => {

    const { t } = useTranslation();

    const diff = useMemo(
        () => diffLines(getNoteText(left.spaceId) || '', getNoteText(right.spaceId) || ''),
        [left.spaceId, right.spaceId]
    );
    const summary = useMemo(() => diffSummary(diff), [diff]);

    return (
        <Modal show={true} onHide={onClose} fullscreen centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {t("compareNotes")}
                    <span className='compareSummary'>
                        &nbsp;{left.name || t("newNote")} &rarr; {right.name || t("newNote")}
                        &nbsp;&middot; <span className='compareAddedCount'>+{summary.added}</span>
                        &nbsp;<span className='compareRemovedCount'>-{summary.removed}</span>
                    </span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {
                    !summary.added && !summary.removed &&
                    <div className='compareSame'>{t("compareNoDifferences")}</div>
                }
                <div className='compareDiff'>
                    {
                        diff.map((line, index) => (
                            <div key={index} className={'compareLine compareLine-' + line.type}>
                                <span className='compareLineNumber'>{line.leftNumber || ''}</span>
                                <span className='compareLineNumber'>{line.rightNumber || ''}</span>
                                <span className='compareLineSign'>{line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}</span>
                                <span className='compareLineText'>{line.text}</span>
                            </div>
                        ))
                    }
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button className={'btn-lg'} variant='secondary' onClick={onClose}>{t('close')}</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default CompareComp;
