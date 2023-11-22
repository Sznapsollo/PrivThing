import { useState, useEffect } from 'react'
import { AppState, settingsInitialStateBaseline } from '../context/Context'
import { Modal, Button, Form } from 'react-bootstrap'
import ConfirmationComp from './ConfirmationComp';
import { useTranslation } from 'react-i18next'
import { removeLocalStorage, saveLocalStorage } from '../utils/utils'
import moment from 'moment';


const SettingsComp = () => {

    const { t } = useTranslation();

    const { mainState, mainDispatch, settingsState, settingsDispatch } = AppState();
    const [ settings, setSettings ] = useState<any>(settingsState);
    const [ clearSettings, setClearSettings ] = useState<boolean>(false);

    useEffect(() => {
        setSettings(settingsState);
    }, [settingsState]);

    const handleClose = () => {
        mainDispatch({type: "HIDE_SETTINGS"});
    }

    const handleSave = () => {
        settingsDispatch({type: "UPDATE_SETTINGS", payload: settings});
        mainDispatch({type: "HIDE_SETTINGS"});
        saveLocalStorage("privmatter.pmSettings", settings);
        mainDispatch({type: "UPDATE_ITEMS_LIST"});
    }

    const handleClearSettings = () => {
        setClearSettings(false);

        removeLocalStorage("privmatter.pmItemsWidth");
        removeLocalStorage("privmatter.pmSaveAsType");
        removeLocalStorage("privmatter.pmSearchSettings");
        removeLocalStorage("privmatter.pmSettings");
        removeLocalStorage("privmatter.pmTabs");

        settingsDispatch({type: "UPDATE_SETTINGS", payload: settingsInitialStateBaseline});

        handleClose();
    }

    return (
        <>
        <Modal
        show={mainState.showSettings}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                {t("settings")}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className='formGroup'>
                    <label className='upperLabel'>{t("forgetSecretMode")}</label>
                    <Form.Control 
                        as="select" 
                        name="forgetSecretMode"
                        value={settings?.forgetSecretMode}
                        className='form-control-lg'
                        onChange={(e) => {
                            setSettings({...settings, forgetSecretMode: e.target.value});
                        }}
                    >
                        <option value="AFTER_TIME">{t("afterSpecTime")}</option>
                        <option value="IMMEDIATE">{t("eachTimeRequired")}</option>
                        <option value="NEVER">{t("never")}</option>
                    </Form.Control>
                </Form.Group>
                &nbsp;
                {settings.forgetSecretMode === "AFTER_TIME" && <Form.Group className='formGroup'>
                    <label className='upperLabel'>{t("forgetSecretTime")}</label>
                    <Form.Control
                        type="range"
                        name="forgetSecretTime"
                        className='form-range form-control-lg'
                        placeholder='11'
                        min={10000}
                        max={3600000}
                        style={{height: 35}}
                        value={settings.forgetSecretTime}
                        onChange={(e) => {
                            setSettings({...settings, forgetSecretTime: parseInt(e.target.value)});
                        }}
                    ></Form.Control>
                    <div style={{padding: 10, textAlign: "center"}}>{moment.utc(settings.forgetSecretTime).format("HH:mm:ss")}</div>
                </Form.Group>}
                <div className='formGroupContainer' style={{textAlign:'center'}}>
                    <Form.Group className='formGroup' style={{display: 'inline-block'}}>
                        <Form.Check
                            id="enableFileServerChbx"
                            type="checkbox"
                            label={t("enableFileServer")}
                            name="enableFileServer"
                            checked={settings.enableFileServer}
                            className={'form-control-lg largeCheckbox'}
                            onChange={(e) => {
                                setSettings({...settings, enableFileServer: e.target.checked});
                            }}
                            onClick={(e) => {
                                console.log('onclicked', e.target)
                            }}
                        ></Form.Check>
                    </Form.Group>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" className={'btn-lg'} onClick={() => setClearSettings(true)}>{t("clearAllSettings")}</Button>
                <div style={{flex: 1}}>&nbsp;</div>
                <Button variant="primary" className={'btn-lg'} onClick={handleSave}>{t("save")}</Button>
                <Button variant="danger" className={'btn-lg'} onClick={handleClose}>{t("cancel")}</Button>
            </Modal.Footer>
    </Modal>

            {   
            clearSettings && 
            <ConfirmationComp
                externalHeading={t("pleaseConfirm")}
                externalSaveLabel={t("yes")}
                externalCloseLabel={t("no")}
                handleExternalSave={handleClearSettings}
                handleExternalClose={() => {setClearSettings(false)}}
            >
                {t("clearAllSettingsConfirm")}
            </ConfirmationComp>
            }
        </>
      );
}

export default SettingsComp
