import React, { useState, useEffect } from 'react'
import { AppState } from '../context/Context'
import { Modal, Button, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { saveCookie } from '../helpers/helpers'
import moment from 'moment';

interface Props {
    show: boolean
}

const SettingsComp = ({show}:Props) => {

    const { t } = useTranslation();

    const { mainDispatch, settingsState, settingsDispatch } = AppState();
    const [ settings, setSettings ] = useState<any>(settingsState)

    useEffect(() => {
        setSettings(settingsState);
    }, [settingsState]);

    const handleClose = () => {
        mainDispatch({type: "HIDE_SETTINGS"});
    }

    const handleSave = () => {
        settingsDispatch({type: "UPDATE_SETTINGS", payload: settings});
        mainDispatch({type: "HIDE_SETTINGS"});
        saveCookie("pmSettings", settings);
    }

    const clone = (ob: any) => {
        var cloneObj = {} as any;
        for (var attribut in ob) {
            if (typeof ob[attribut] === "object") {
                cloneObj[attribut] = ob[attribut].clone();
            } else {
                cloneObj[attribut] = ob[attribut];
            }
        }
        return cloneObj;
    }

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
                        onChange={(e) => {
                            let newSettings = clone(settings);
                            newSettings.forgetSecretMode = e.target.value;
                            setSettings(newSettings);
                        }}
                    >
                        <option value="AFTER_TIME">{t("afterSpecTime")}</option>
                        <option value="NEVER">{t("never")}</option>
                        <option value="IMMEDIATE">{t("eachTimeRequired")}</option>
                    </Form.Control>
                </Form.Group>
                &nbsp;
                {settings.forgetSecretMode === "AFTER_TIME" && <Form.Group className='formGroup'>
                    <label className='upperLabel'>{t("forgetSecretTime")}</label>
                    <Form.Control
                        type="range"
                        name="forgetSecretTime"
                        className='form-range'
                        placeholder='11'
                        min={10000}
                        max={3600000}
                        style={{height: 35}}
                        value={settings.forgetSecretTime}
                        onChange={(e) => {
                            let newSettings = clone(settings);
                            newSettings.forgetSecretTime = parseInt(e.target.value);
                            setSettings(newSettings);
                        }}
                    ></Form.Control>
                    <div style={{padding: 10, textAlign: "center"}}>{moment.utc(settings.forgetSecretTime).format("HH:mm:ss")}</div>
                </Form.Group>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={handleSave}>{t("save")}</Button>
                <Button variant="danger" onClick={handleClose}>{t("cancel")}</Button>
            </Modal.Footer>
    </Modal>
        </>
      );
}

export default SettingsComp
