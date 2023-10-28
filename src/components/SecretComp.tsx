import React, {useState, useEffect} from 'react'
import {Form, Button} from 'react-bootstrap'
import CryptoJS from 'crypto-js';

interface Props {
    warning?: string, 
    info?: string,
    handleSubmit: (secret: string) => any,
    confirm: boolean
}

const SecretComp = ({confirm, info, handleSubmit, warning} : Props) => {
    const [ secret, setSecret ] = useState('');
    const [ secretConfirm, setSecretConfirm ] = useState('');
    const [ isValid, setIsValid ] = useState<boolean>(true);

    useEffect(() => {
        checkValidity();
    }, [secret, secretConfirm]);

    const translateCode = (msgCode: string) => {
        var msgCodes:any = {
            password: 'Password',
            repeatPassword: 'Repeat Password',
        }
        return msgCodes[msgCode] || msgCode;
    }

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
                            <label className='upperLabel'>{translateCode("password")}</label>
                            <Form.Control
                                type="password"
                                name="secretValue"
                                placeholder=''
                                autoFocus={true}
                                value={secret}
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
                            <label className='upperLabel'>{translateCode("repeatPassword")}</label>
                            <Form.Control
                                type="password"
                                name="secretValueConfirm"
                                placeholder=''
                                isInvalid={!isValid}
                                value={secretConfirm}
                                onChange={(e) => {
                                    setSecretConfirm(e.target.value);
                                }}
                            ></Form.Control>
                        </Form.Group>}
                        <div>&nbsp;</div>
                        <Button type='submit' disabled={!isValid} style={{width: "100%"}} variant='success' onClick={ () => {
                            submitSecret(undefined)
                        }}>Go</Button>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default SecretComp
