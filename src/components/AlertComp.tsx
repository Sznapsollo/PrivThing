import { useState, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface Props {
    externalCloseButtonVariant?: string,
    externalCloseLabel?: string
    externalContent?: string,
    externalHeading?: string,
    externalSaveLabel?: string,
    externalSaveButtonVariant?: string
    externalSetContent?: () => string,
    externalSetHeading?: () => string,
    externalShowSaveButton?: boolean,
    externalShowCloseButton?: boolean,
    handleExternalClose?: () => any,
    handleExternalShow?: () => any,
    handleExternalSave?: () => any,
    initialShow?: boolean,
}

const Alert = ({
    externalCloseButtonVariant,
    externalCloseLabel, 
    externalContent, 
    externalHeading,
    externalSaveButtonVariant,
    externalSaveLabel,
    externalSetContent,
    externalSetHeading,
    externalShowSaveButton,
    externalShowCloseButton,
    handleExternalClose, 
    handleExternalShow, 
    handleExternalSave,
    initialShow
}: Props) => {

    const { t } = useTranslation();

    const [show, setShow] = useState(initialShow != null ? initialShow : true);
    const [showSaveButton, setShowSaveButton] = useState(externalShowSaveButton != null ? externalShowSaveButton : true);
    const [showCloseButton, setShowCloseButton] = useState(externalShowCloseButton != null ? externalShowCloseButton : true);
    const [saveLabel, setSaveLabel] = useState(externalSaveLabel || t("save"));
    const [closeLabel, setCloseLabel] = useState(externalCloseLabel || t("close"));
    const [modalContent, setModalContent] = useState(externalContent || '');
    const [modalHeading, setModalHeading] = useState(externalHeading || '');
    const [saveButtonVariant, setSaveButtonVariant] = useState(externalSaveButtonVariant || 'primary');
    const [closeButtonVariant, setCloseButtonVariant] = useState(externalCloseButtonVariant || 'danger');

    const handleClose = () => {
        if(handleExternalClose) {
            handleExternalClose();
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
        if(externalSetContent) {
            setModalContent(externalSetContent());
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
                {modalContent}
            </Modal.Body>
            <Modal.Footer>
                {showSaveButton && <Button variant={saveButtonVariant} onClick={handleSave}>{saveLabel}</Button>}
                {showCloseButton && <Button variant={closeButtonVariant} onClick={handleClose}>{closeLabel}</Button>}
            </Modal.Footer>
        </Modal>
      </>
    );
}

export default Alert
