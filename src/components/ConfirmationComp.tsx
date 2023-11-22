import { useState, useEffect, ReactNode } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface Props {
    children: ReactNode,
    externalCloseButtonVariant?: string,
    externalCloseLabel?: string
    externalHeading?: string,
    externalMiddleLabel?: string,
    externalMiddleButtonVariant?: string
    externalSaveLabel?: string,
    externalSaveButtonVariant?: string
    externalSetContent?: () => string,
    externalSetHeading?: () => string,
    externalShowCloseButton?: boolean,
    externalShowMiddleButton?: boolean,
    externalShowSaveButton?: boolean,
    handleExternalClose?: () => any,
    handleExternalMiddle?: () => any,
    handleExternalShow?: () => any,
    handleExternalSave?: () => any,
    initialShow?: boolean,
}

const Confirmation = ({
    children,
    externalCloseButtonVariant,
    externalCloseLabel, 
    externalHeading,
    externalMiddleButtonVariant,
    externalMiddleLabel,
    externalSaveButtonVariant,
    externalSaveLabel,
    externalSetContent,
    externalSetHeading,
    externalShowCloseButton,
    externalShowMiddleButton,
    externalShowSaveButton,
    handleExternalClose, 
    handleExternalMiddle, 
    handleExternalShow, 
    handleExternalSave,
    initialShow
}: Props) => {

    const { t } = useTranslation();

    const [show, setShow] = useState(initialShow != null ? initialShow : true);
    const [showCloseButton] = useState(externalShowCloseButton != null ? externalShowCloseButton : true);
    const [showMiddleButton] = useState(externalShowMiddleButton != null ? externalShowMiddleButton : false);
    const [showSaveButton] = useState(externalShowSaveButton != null ? externalShowSaveButton : true);
    const [closeLabel] = useState(externalCloseLabel || t("cancel"));
    const [middleLabel] = useState(externalMiddleLabel || 'xxx');
    const [saveLabel] = useState(externalSaveLabel || t("yes"));
    const [modalHeading, setModalHeading] = useState(externalHeading || '');
    const [closeButtonVariant] = useState(externalCloseButtonVariant || 'danger');
    const [middleButtonVariant] = useState(externalMiddleButtonVariant || 'primary');
    const [saveButtonVariant] = useState(externalSaveButtonVariant || 'success');

    const handleClose = () => {
        if(handleExternalClose) {
            handleExternalClose();
        }
        setShow(false)
    };

    const handleMiddle = () => {
        if(handleExternalMiddle) {
            handleExternalMiddle();
        }
        setShow(false)
    };

    const handleSave = () => {
        if(handleExternalSave) {
            handleExternalSave();
        }
        setShow(false)
    };

    useEffect(() => {
        if(handleExternalShow) {
            handleExternalShow();
        }
        if(externalSetHeading) {
            setModalHeading(externalSetHeading());
        }
    }, []);
  
    return (
      <>
        <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                {modalHeading}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {children}
            </Modal.Body>
            <Modal.Footer>
                {showSaveButton && <Button className={'btn-lg'} variant={saveButtonVariant} onClick={handleSave}>{saveLabel}</Button>}
                {showMiddleButton && <Button className={'btn-lg'} variant={middleButtonVariant} onClick={handleMiddle}>{middleLabel}</Button>}
                {showCloseButton && <Button className={'btn-lg'} variant={closeButtonVariant} onClick={handleClose}>{closeLabel}</Button>}
            </Modal.Footer>
        </Modal>
      </>
    );
}

export default Confirmation
