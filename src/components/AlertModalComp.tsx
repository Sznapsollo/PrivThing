import { useState, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { AppState } from '../context/Context';
import { AlertData } from '../model';
import { MAIN_ACTIONS } from '../context/Reducers';

const AlertModal = () => {

    const { mainState, mainDispatch } = AppState();

    const { t } = useTranslation();

    const [show, setShow] = useState(false);

    useEffect(() => {
        if(mainState.alertData) {
            setShow(mainState.alertData.show === true);
        }
    }, [mainState.alertData]);

    const handleClose = () => {
        mainDispatch({type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: {show: false} as AlertData})
    };
  
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
                    {mainState.alertData?.header || ''}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {mainState.alertData?.message || ''}
            </Modal.Body>
            <Modal.Footer>
                {<Button className={'btn-lg'} variant='secondary' onClick={handleClose}>{mainState.alertData?.buttonLabel || t('close')}</Button>}
            </Modal.Footer>
        </Modal>
      </>
    );
}

export default AlertModal
