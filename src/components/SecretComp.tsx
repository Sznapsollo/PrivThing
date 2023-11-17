import React, { useState, useEffect } from 'react'
import { Form, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import CryptoJS from 'crypto-js';

interface Props {
    warning?: string, 
    info?: string,
    handleSubmit: (secret: string) => any,
    confirm: boolean
}

const SecretComp = ({confirm, info, handleSubmit, warning} : Props) => {

    const { t } = useTranslation();

    const [ secret, setSecret ] = useState('');
    const [ secretConfirm, setSecretConfirm ] = useState('');
    const [ isValid, setIsValid ] = useState<boolean>(true);

    useEffect(() => {
        checkValidity();
    }, [secret, secretConfirm]);

    const submitSecret = (event: React.FormEvent<HTMLFormElement> | undefined) => {
        if(event) {
            event.preventDefault();
        }
        if(!secret || !secret.length || secret !== secretConfirm) {
            return
        }
        handleSubmit(CryptoJS.SHA256(secret).toString(CryptoJS.enc.Base64));
        setSecret('');
        setSecretConfirm('');
    }

    const checkValidity = ():void => {
        if(!secret || !secret.length || !secretConfirm || !secretConfirm.length ) {
            return
        }
        if(secret !== secretConfirm) {
            setIsValid(false);
        } else {
            setIsValid(true);
        }
    }

    return (
        <div style={{width: "100%", height: "100%", display: "table"}}>
            <div style={{display: "table-cell", verticalAlign: "middle"}}>
                <div style={{margin: "auto", display: "table"}}>
                    {warning && <div style={{textAlign: "center", color: "red", width: 300, padding: 10}}>{warning}</div>}
                    {info && <div style={{textAlign: "center",width: 300, padding: 10}}>{info}</div>}
                    <Form onSubmit={(e) => {
                        submitSecret(e);
                    }}>
                        <Form.Group className='formGroup'>
                            <label className='upperLabel'>{t("password")}</label>
                            {/* This is hack for chrome not allowing drag on tab elements when there is focused password input on screen */}
                            {/* Unfocusing or focusing on something else does not help, it must be text input */}
                            {/* Hope there will be better solution in the future */}
                            {/* Hack start */}
                            <Form.Control
                                id='secretPassDummy'
                                type="text"
                                name="secretPassDummy"
                                placeholder=''
                                disabled={true}
                                draggable={false}
                                style={{display: "none"}}
                            ></Form.Control>
                            {/* Hack end */}
                            <Form.Control
                                id='secretPass'
                                type="password"
                                name="secretValue"
                                className={'form-control-lg'}
                                placeholder=''
                                autoFocus={true}
                                value={secret}
                                draggable={false}
                                onChange={(e) => {
                                    setSecret(e.target.value);
                                    if(!confirm) {
                                        setSecretConfirm(e.target.value);
                                    }
                                }}
                            ></Form.Control>
                        </Form.Group>
                        {confirm && <div>&nbsp;</div>}
                        {confirm && <Form.Group className='formGroup'>
                            <label className='upperLabel'>{t("repeatPassword")}</label>
                            <Form.Control
                                type="password"
                                name="secretValueConfirm"
                                className={'form-control-lg'}
                                placeholder=''
                                isInvalid={!isValid}
                                value={secretConfirm}
                                onChange={(e) => {
                                    setSecretConfirm(e.target.value);
                                }}
                            ></Form.Control>
                        </Form.Group>}
                        <div>&nbsp;</div>
                        <Button className='btn-lg' type='submit' disabled={!isValid} style={{width: "100%"}} variant='success' onClick={ () => {
                            submitSecret(undefined)
                        }}>{t("go")}</Button>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default SecretComp
