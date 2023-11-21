import { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import SecretComp from './SecretComp'
import { SaveAsResults } from '../model'
import { retrieveLocalStorage, saveLocalStorage } from '../utils/utils'

interface Props {
    fileName: string,
    onSave: (item: SaveAsResults) => void,
    onClose: () => void
}

const SaveAsComp = ({
    fileName,
    onSave, 
    onClose,
}: Props) => {

    let pmSaveAsType
    try {
        pmSaveAsType = retrieveLocalStorage("privmatter.pmSaveAsType");
    } catch(e) {
        console.error("Error on pmSaveAsType", e);
    }

    const { t } = useTranslation();
    const [encryptData, setEncryptData] = useState<boolean>(false);
    const [saveAsType, setSaveAsType] = useState<string>(pmSaveAsType || "LOCAL_STORAGE");
    const [saveFileName, setSaveFileName] = useState<string>(fileName);

    const handleClose = () => {
        onClose();
    };

    const handleFileName = ():string => {
        let fileNameLoc = saveFileName;
        if(encryptData) {
            // we assume taht encrypted ones will end with '.prvmttr'
            fileNameLoc = saveFileName.replaceAll('.txt', '')
            if(!fileNameLoc.endsWith('.prvmttr')) {
                fileNameLoc += '.prvmttr';
            }
        }
        return fileNameLoc
    }

    const handleSubmitSaveAs = (event: React.FormEvent<HTMLFormElement> | undefined) => {
        if(event) {
            event.preventDefault();
        }
        if(!encryptData) {
            handleSave();
        }
    }

    const handleSave = () => {
        onSave({
            fileName: handleFileName(),
            saveAsType: saveAsType,
            encryptData: false
        });
    };

    const handleSecretSubmit = (secret: string) => {
        onSave({
            fileName: handleFileName(),
            saveAsType: saveAsType,
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
        // size="lg"
        width={300}
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    {t('saveAs')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{padding: 20}}>
                <Form onSubmit={(e) => {
                    handleSubmitSaveAs(e);
                }}>
                    <div className='formGroupContainer'>
                        <Form.Group className='formGroup'>
                            <label className='upperLabel'>{t("fileName")}</label>
                            <Form.Control
                                className='form-control-lg'
                                type="text"
                                name="fileName"
                                placeholder=''
                                value={saveFileName}
                                required= {true}
                                autoFocus={true}
                                onChange={(e)=> {
                                    setSaveFileName(e.target.value);
                                }}
                            ></Form.Control>
                        </Form.Group>
                    </div>
                    <div className='formGroupContainer'>
                        <Form.Group className='formGroup'>
                            <Form.Control 
                                as="select" 
                                name="saveAsType"
                                className={'form-control-lg'}
                                value={saveAsType}
                                onChange={(e) => {
                                    saveLocalStorage("privmatter.pmSaveAsType", e.target.value);
                                    setSaveAsType(e.target.value);
                                }}
                            >
                                <option value="LOCAL_STORAGE">{t("localStorage")}</option>
                                <option value="FILE">{t("file")}</option>
                            </Form.Control>
                        </Form.Group>
                    </div>
                    <div className='formGroupContainer' style={{textAlign:'center'}}>
                        <Form.Group className='formGroup' style={{display: 'inline-block'}}>
                            <Form.Check
                                id="encryptDataChbx"
                                type="checkbox"
                                label={t("encryptData")}
                                name="encryptData"
                                checked={encryptData}
                                className={'form-control-lg largeCheckbox'}
                                onChange={(e) => {
                                    setEncryptData(e.target.checked);
                                }}
                            ></Form.Check>
                        </Form.Group>
                    </div>
                </Form>
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
