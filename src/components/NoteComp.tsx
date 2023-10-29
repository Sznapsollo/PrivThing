import {useState, useEffect} from 'react'
import {Form, Button} from 'react-bootstrap'
import CryptoJS from 'crypto-js';
import { AppState } from '../context/Context'
import ConfirmationComp from './ConfirmationComp';
import SecretComp from './SecretComp';
import AlertComp from './AlertComp';
import { Alert } from '../model';
import '../styles.css'

const NoteComp = () => {

    interface SecretMeta {
        info?: string,
        warning?: string
    }

    const { mainState, mainDispatch, settingsState } = AppState();
    const [filePath, setFilePath] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [rawNote, setRawNote] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [orgNote, setOrgNote] = useState<string>('');
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
    const [showUnsaved, setShowUnsaved] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [alertData, setAlertData] = useState<Alert>({});
    const [needSecret, setNeedSecret] = useState<boolean>(false);
    const [needSecretMeta, setNeedSecretMeta] = useState<SecretMeta>({});
    const [isSavingAsEncrypted, setIsSavingAsEncryted] = useState<boolean>(false);
    
    useEffect(() => {
        if(rawNote?.length) {
            decryptData();
        }
    }, [rawNote]);

    const initializeEditedItem = () => {
        setInitialState();
        let defaultFileName = (new Date().toJSON().slice(0,10).replace(/-/g,'_') + '_privmatter.txt');
        setFilePath(mainState.editedItem.path || '');
        setFileName(mainState.editedItem.name || defaultFileName);
        if(mainState.editedItem.fetchData === true) {
            // NJ load and setEncrypted data
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({type: 'retrieveFileFromPath', data: mainState.editedItem.path}) 
            };

            fetch('actions', requestOptions)
            .then(result => {return result.json()})
            .then(data => {
                // debugger
                if(data.status !== "OK") {
                    console.warn("Actions response", data);
                    return
                }
                if(typeof data.data === "string") {
                    setRawNote(data.data);
                }
            })
        } else if(mainState.editedItem.rawNote) {
            setRawNote(mainState.editedItem.rawNote);
        }
    }

    useEffect(() => {
        if(isEncrypted) {
            if(!mainState.secret) {
                giveMeSecret("", "");
            } else {
                dismissSecret();
                decryptData();
            }
        }
    }, [mainState.secret]);

    useEffect(() => {
        console.log('changed edited item', mainState.editedItem)
        initializeEditedItem();
    }, [mainState.editedItem]);

    useEffect(() => {
        // NJ to check if there is something open to ask if we should save first
        console.log('changed editedItemCandidate item candidate', mainState.editedItemCandidate)
        if(isDirty) {
            setShowUnsaved(true);
        } else {
            if(mainState.secret && settingsState.forgetSecretMode === "IMMEDIATE") {
                mainDispatch({type: 'CLEAR_SECRET'})     
            }
            mainDispatch({type: 'SET_EDITED_ITEM', payload: mainState.editedItemCandidate}) 
        }
    }, [mainState.editedItemCandidate]);

    useEffect(() => {
        validateButtonsState();
    }, [note]);

    const giveMeSecret = (info?:string, warning?: string):void => {
        setNeedSecretMeta({info: info, warning: warning});
        setNeedSecret(true);
    }

    const dismissSecret = ():void => {
        setNeedSecretMeta({});
        setNeedSecret(false);
    }

    const validateButtonsState = () => {
        setIsDirty((note !== orgNote));
    }

    const translateCode = (msgCode: string) => {
        var msgCodes:any = {
            fileName: "File Name",
            filePath: "File Path",
            note: "Note",
            password: 'Password',
        }
        return msgCodes[msgCode] || msgCode;
    }

    const setInitialState = () => {
        setFileName('');
        setFilePath('');
        setIsEncrypted(false);
        setIsSavingAsEncryted(false);
        dismissSecret();
        setNote('');
        setOrgNote('');
        setRawNote('');
        setShowUnsaved(false);
    }

    const handleSecretSubmit = (secret: string) => {
        mainDispatch({type: 'UPDATE_SECRET', payload: secret});
    }

    const handleSaveAsSecretSubmit = (secret: string) => {
        if(secret) {
            saveToFileEncrypted(secret);
        }
        setIsSavingAsEncryted(false);
    }

    const saveToFileEncrypted = (secret: string) => {
        let fileNameLoc = fileName.replaceAll('.txt', '') + '.prvmttr';
        saveToFile(fileNameLoc, encryptData(secret));
    }

    const saveToFile = (fileNameLoc: string, fileData: string) => {
        const blob = new Blob([fileData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = fileNameLoc;
        link.href = url;
        link.click();
    }

    const updateFile = () => {
        if(!mainState.editedItem.path || !mainState.editedItem.fetchData) {
            return
        }

        const fileData = isEncrypted ? encryptData(mainState.secret) : note;
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({type: 'updateFileFromPath', data: fileData, path: mainState.editedItem.path}) 
        };
        
        fetch('actions', requestOptions)
        .then(result => {return result.json()})
        .then(data => {
            if(data.status !== "OK") {
            console.warn("Actions response", data);
            setAlertData({header: "Error!", content: "Something went wrong ..."})
            setShowAlert(true);
            return
            }
            mainDispatch({type: "UPDATE_ITEMS_LIST"});
            initializeEditedItem();
        })
    }

    const encryptData = (secret: string):string => {
        const encryptedData = CryptoJS.AES.encrypt(
            JSON.stringify(note),
            secret
        ).toString();

        return 'privmatterencrypted_' + encryptedData;
    };

    const decryptData = () => {
        let data;
        let rawData = rawNote;
        let encrypted = false;
        try {
            encrypted = false;
            if(fileName?.toLocaleLowerCase()?.includes('.prvmttr')) {
                encrypted = true;
            }
            if(rawData.startsWith('privmatterencrypted_')) {
                encrypted = true;
                rawData = rawData.replace('privmatterencrypted_', '');
            }

            if(encrypted === true) {
                setIsEncrypted(true);

                if(!mainState.secret) {
                    giveMeSecret("", "");
                    return
                }

                const bytes = CryptoJS.AES.decrypt(rawData, mainState.secret);
                data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            } else {
                data = rawData;
            }
        } catch(e) {
            // setAlertData({header: "Error!", content: "Can not open this file!!!!"})
            // setShowAlert(true);
            if(encrypted) {
                giveMeSecret("","Incorrect Password. Try again.");
            }
        }
        if(data && data.length) {
            setNote(data);
            setOrgNote(data);
        }
    };

    return (
        <div className='noteContainer'>
            {
                isSavingAsEncrypted && 
                <SecretComp confirm={true} info="Provide password to encrypt file" handleSubmit={handleSaveAsSecretSubmit} />
            }
            {
                needSecret && 
                <SecretComp confirm={false} warning={needSecretMeta.warning} info={needSecretMeta.info || "Provide password to open decrypted file"} handleSubmit={handleSecretSubmit} />
            }
            {
                !needSecret && !isSavingAsEncrypted && <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <div className='formGroupContainer'>
                        <Form.Group className='formGroup'>
                        <label className='upperLabel'>{translateCode("filePath")}</label>
                        <Form.Control
                            type="text"
                            name="filePath"
                            placeholder=''
                            value={filePath}
                            readOnly={true}
                        ></Form.Control>
                        </Form.Group>
                    </div>
                    <div className='formGroupContainer'>
                        <Form.Group className='formGroup'>
                        <label className='upperLabel'>{translateCode("fileName")}</label>
                        <Form.Control
                            type="text"
                            name="fileName"
                            placeholder=''
                            value={fileName}
                            readOnly={true}
                        ></Form.Control>
                        </Form.Group>
                    </div>
                    <div className='formGroupContainer flexStretch'>
                        <Form.Group className='formGroup'>
                            <label className='upperLabel'>{translateCode("note")}</label>
                            <Form.Control
                                as="textarea"
                                name="comments"
                                value={note}
                                onChange={(e) => {
                                    setNote(e.target.value);
                                }}
                            ></Form.Control>
                        </Form.Group>
                    </div>
                    <div style={{display: "flex"}} className='formGroupContainer'>
                        {
                            mainState.editedItem.fetchData && <Button disabled={!isDirty} variant='success' onClick={ () => {
                                updateFile();
                            }}>Save</Button>
                        }
                        <div style={{flex: 1}}>&nbsp;</div>
                        &nbsp;
                        <Button disabled={!isDirty} variant='primary' onClick={ () => {
                            setIsSavingAsEncryted(true);
                        }}>Save As (encrypted)</Button>
                        &nbsp;
                        <Button disabled={!isDirty} variant='success' onClick={ () => {
                            saveToFile(fileName, note);
                        }}>Save As</Button>
                        &nbsp;
                        <Button disabled={!isDirty} variant='danger' onClick={() => {
                            setNote(orgNote);
                        }}>Cancel</Button>
                    </div>
                </div>
            }
            {   
                showUnsaved && 
                <ConfirmationComp 
                    externalHeading='Warning'
                    externalContent='There are unsaved changes. Do you want to continue?'
                    externalSaveLabel="Yes. I don't care abou these changes. Skip them."
                    externalCloseLabel='NO! Let me save them first!'
                    handleExternalSave={() => {
                        setShowUnsaved(false);
                        if(mainState.editedItemCandidate) {
                            if(mainState.secret && settingsState.forgetSecretMode === "IMMEDIATE") {
                                mainDispatch({type: 'CLEAR_SECRET'})     
                            }
                            mainDispatch({type: 'SET_EDITED_ITEM', payload: mainState.editedItemCandidate});
                        }
                    }}
                    handleExternalClose={() => {setShowUnsaved(false)}}
                />
            }
            {   
                showAlert && 
                <AlertComp 
                    externalHeading={alertData.header}
                    externalContent={alertData.content}
                    externalCloseLabel="OK :-("
                    externalShowSaveButton={false}
                    handleExternalSave={() => {
                        setShowAlert(false);
                        
                    }}
                    handleExternalClose={() => {setShowAlert(false)}}
                />
            }
        </div>
    )
}

export default NoteComp
