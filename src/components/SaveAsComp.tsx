import { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import SecretComp from './SecretComp'

interface saveAsResults {
    saveAs: string,
    encryptData: boolean
    secret?: string
}

interface Props {
    onSave: (item: saveAsResults) => void,
    onClose: () => void
}

const SaveAsComp = ({
    onSave, 
    onClose,
}: Props) => {

    const { t } = useTranslation();
    const [encryptData, setEncryptData] = useState<boolean>(false);
    const [saveAs, setSaveAs] = useState<string>('FILE')

    const handleClose = () => {
        onClose();
    };

    const handleSave = () => {
        onSave({
            saveAs: saveAs,
            encryptData: false
        });
    };

    const handleSecretSubmit = (secret: string) => {
        onSave({
            saveAs: saveAs,
            encryptData: encryptData,
            secret: secret
        })
    }
  
    return (
      <>
        <Modal
        show={true}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    {t('saveAs')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{padding: 20}}>
                <div className='formGroupContainer'>
                    <Form.Group className='formGroup'>
                        <Form.Control 
                            as="select" 
                            name="officialIdType"
                            className={'form-control-lg'}
                            value={saveAs}
                            onChange={(e) => {
                                setSaveAs(e.target.value)
                            }}
                        >
                            <option value="FILE">{t("file")}</option>
                            {/* <option value="LOCAL_STORAGE">{t("localStorage")}</option> */}
                        </Form.Control>
                    </Form.Group>
                </div>
                <div className='formGroupContainer' style={{textAlign:'center'}}>
                    <Form.Group className='formGroup' style={{display: 'inline-block'}}>
                        <Form.Check
                            type="checkbox"
                            label={t("encryptData")}
                            name="encryptData"
                            checked={encryptData}
                            className={'form-control-lg largeCheckbox'}
                            onChange={(e) => {
                                setEncryptData(e.target.checked)
                            }}
                        ></Form.Check>
                    </Form.Group>
                </div>
                {encryptData && <SecretComp confirm={true} info={t("providePasswordToEncryptFile")} handleSubmit={handleSecretSubmit} />}
            </Modal.Body>
            <Modal.Footer style={{display: 'flex'}}>
                {!encryptData && <Button className={'btn-lg'} style={{flex: 1}} variant="success" onClick={handleSave}>{t('save')}</Button>}
                <Button className={'btn-lg'} style={{width: 150}} variant="danger" onClick={handleClose}>{t('cancel')}</Button>
            </Modal.Footer>
        </Modal>
      </>
    );
}

export default SaveAsComp
