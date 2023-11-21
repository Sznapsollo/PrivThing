import { useState, useEffect, useRef, useCallback } from 'react'
import { Form, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import CryptoJS from 'crypto-js';
import { AppState } from '../context/Context'
import ConfirmationComp from './ConfirmationComp';
import SecretComp from './SecretComp';
import { AlertData, Item, SaveAsResults } from '../model';
import { AiOutlineLoading } from 'react-icons/ai';
import '../styles.css'
import CodeMirror, {EditorView, ReactCodeMirrorRef} from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { openSearchPanel } from '@codemirror/search';
import SaveAsComp from './SaveAsComp';
import { retrieveLocalStorage, saveLocalStorage } from '../utils/utils';
import moment from 'moment';

var scrollNoteHandle: ReturnType<typeof setTimeout> | null = null;

const NoteComp = () => {

    const { t } = useTranslation();
    interface SecretMeta {
        info?: string,
        warning?: string
    }

    const { mainState: {editedItem, editedItemCandidate, tabs, secret, newItemToOpen}, mainDispatch, settingsState: {forgetSecretMode} } = AppState();
    const [filePath, setFilePath] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [rawNote, setRawNote] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [orgNote, setOrgNote] = useState<string>('');
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
    const [showUnsaved, setShowUnsaved] = useState<boolean>(false);
    const [needSecret, setNeedSecret] = useState<boolean>(false);
    const [askRefresh, setAskRefresh] = useState<boolean>(false);
    const [askDelete, setAskDelete] = useState<boolean>(false);
    const [needSecretMeta, setNeedSecretMeta] = useState<SecretMeta>({});
    const [isSavingAs, setIsSavingAs] = useState<boolean>(false);

    const updateFileButtonRef = useRef<HTMLButtonElement>(null);
    const saveToFileButtonRef = useRef<HTMLButtonElement>(null);
    const scrollableRef = useRef<HTMLDivElement>(null);
    const noteRef = useRef<ReactCodeMirrorRef>(null);

    useEffect(() => {
        // console.log('changed rawNote', rawNote)
        if(rawNote?.length) {
            decryptData();
        }
    }, [rawNote]);

    useEffect(() => {
        if(!newItemToOpen?.path) {
            return
        }
        setIsDirty(false);
        mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: newItemToOpen}});
    }, [newItemToOpen?.path]);

    const initializeEditedItem = () => {
        setInitialState();
        let defaultFileName = moment().format('MMMM_Do_YYYY_h_mm_ss') + '_privmatter.txt';
        setFilePath(editedItem.path || '');
        setFileName(editedItem.name || defaultFileName);
        if(isLocalStorageItem(editedItem)) {
            setIsLoading(true);
            try {
                let localStorageFiles = retrieveLocalStorage('privmatter.files');
                if(localStorageFiles && localStorageFiles[editedItem.name] != null && localStorageFiles[editedItem.name].data != null) {
                    setRawNote(localStorageFiles[editedItem.name].data);
                } else if(!!editedItem.path) {
                    mainDispatch({type: 'SHOW_NOTIFICATION', payload: {show: true, type: 'error', closeAfter: 10000, message: t('fileNotFound') + (filePath || '')} as AlertData})
                    // mainDispatch({type: 'SHOW_ALERT_MODAL', payload: {show: true, header: "Error!", message: t("fileNotFound")} as AlertData})
                    let currentTabs = tabs.filter((tab) => tab.path !== editedItem.path);
                    mainDispatch({type: "UPDATE_TABS", payload: currentTabs});
                }
            } catch(e) {
                console.warn('localStorage read operation error: ', e);
                mainDispatch({type: 'SHOW_NOTIFICATION', payload: {show: true, type: 'error', closeAfter: 10000, message: t('somethingWentWrong') + (editedItem.path || '')} as AlertData})
            }
            setIsLoading(false);
        } else if(isExternalFileItem(editedItem)) {
            // NJ load and setEncrypted data
            setIsLoading(true);
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({type: 'retrieveFileFromPath', data: editedItem.path}) 
            };

            fetch('actions', requestOptions)
            .then(result => {
                if(!result.ok) {
                    throw new Error('Network response was not ok.');
                }
                return result.json()
            })
            .then(data => {
                setIsLoading(false);
                if(data.status !== 0) {
                    // console.warn("Actions response", data);
                    return
                }
                if(data.data == null && !!editedItem.path) {
                    mainDispatch({type: 'SHOW_NOTIFICATION', payload: {show: true, type: 'error', closeAfter: 10000, message: t('fileNotFound') + (filePath || '')} as AlertData})
                    // mainDispatch({type: 'SHOW_ALERT_MODAL', payload: {show: true, header: "Error!", message: t("fileNotFound")} as AlertData})
                    let currentTabs = tabs.filter((tab) => tab.path !== editedItem.path);
                    mainDispatch({type: "UPDATE_TABS", payload: currentTabs});
                }
                if(typeof data.data === "string") {
                    setRawNote(data.data);
                }
            })
            .catch(function(error) {
                setIsLoading(false);
                console.warn('Fetch operation error: ', error.message);
                mainDispatch({type: 'SHOW_NOTIFICATION', payload: {show: true, type: 'error', closeAfter: 10000, message: t('somethingWentWrong') + (editedItem.path || '')} as AlertData})
            });
        } else if(editedItem.rawNote) {
            setIsLoading(true);
            setRawNote(editedItem.rawNote);
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if(isEncrypted) {
            if(!secret) {
                giveMeSecret("", "");
            } else {
                dismissSecret();
                decryptData();
            }
        }
    }, [secret]);

    useEffect(() => {
        // console.log('changed edited item path', editedItem)
        initializeEditedItem();
    }, [editedItem.path]);

    useEffect(() => {
        // NJ to check if there is something open to ask if we should save first
        // console.log('changed editedItemCandidate item candidate', editedItemCandidate)
        if(isDirty) {
            setShowUnsaved(true);
        } else {
            if(secret && forgetSecretMode === "IMMEDIATE") {
                mainDispatch({type: 'CLEAR_SECRET'})     
            }
            if(editedItemCandidate?.item) {
                mainDispatch({type: 'SET_EDITED_ITEM', payload: editedItemCandidate}) 
            }
        }
    }, [editedItemCandidate.item]);

    useEffect(() => {
        // console.log('changed note', note)
        validateButtonsState();
        setTimeout(() => {noteRef.current?.view?.focus()}, 100)
    }, [note]);

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key.toLowerCase() === "f") {
            if(noteRef?.current?.view) {
                openSearchPanel(noteRef.current.view);
                e.preventDefault();
            }
        } else if (e.ctrlKey && e.key.toLowerCase() === "s" && updateFileButtonRef.current && updateFileButtonRef.current?.disabled === false){
            e.preventDefault();
            if(updateFileButtonRef.current) {
                updateFileButtonRef.current.click();
            }
        } else if (e.ctrlKey && e.key.toLowerCase() === "s" && !updateFileButtonRef.current && saveToFileButtonRef.current && saveToFileButtonRef.current?.disabled === false){
            e.preventDefault();
            if(saveToFileButtonRef.current) {
                saveToFileButtonRef.current.click();
            }
        }
    }

    useEffect(() => {
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        }
    }, []);


    const rememberScrollPosition = () => {
        if(scrollNoteHandle) {
            clearTimeout(scrollNoteHandle);
        }
        scrollNoteHandle = setTimeout(function() {
            let currentTabs = tabs.map((tab) => {
                if(tab.active === true) {
                    return {...tab, scrollTop: scrollableRef.current?.scrollTop}
                }
                return {...tab}
            });
            mainDispatch({type: "UPDATE_TABS", payload: currentTabs});
        }, 200)
    }

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

    const setInitialState = () => {
        setFileName('');
        setFilePath('');
        setIsEncrypted(false);
        setIsSavingAs(false);
        dismissSecret();
        setNote('');
        setOrgNote('');
        setRawNote('');
        setShowUnsaved(false);
    }

    const handleSecretSubmit = (secret: string) => {
        mainDispatch({type: 'UPDATE_SECRET', payload: secret});
    }

    const handleSaveAs = (saveResults: SaveAsResults): void => {
        if(saveResults.saveAsType === "LOCAL_STORAGE") {
            if(saveResults.encryptData && saveResults.secret) {
                saveEncrypted(saveResults);
            } else {
                saveToLocalStorage(saveResults.fileName, note);
            }
            mainDispatch({type: "UPDATE_ITEMS_LIST", payload: "localStorage/" + saveResults.fileName});
            mainDispatch({type: 'SHOW_NOTIFICATION', payload: {show: true, closeAfter: 3000, message: t('dataSaved')} as AlertData})
        } else {
            if(saveResults.encryptData && saveResults.secret) {
                saveEncrypted(saveResults);
            } else {
                saveToFile(saveResults.fileName, note);
            }
        }
        setIsSavingAs(false);
    }

    const handleDeleteItem = () => {
        setAskDelete(false)
        if(!isLocalStorageItem(editedItem)) {
            return
        }

        try {
            let privMatterLSFiles = retrieveLocalStorage('privmatter.files') || {};
            if(privMatterLSFiles) {
                delete privMatterLSFiles[fileName]
                saveLocalStorage('privmatter.files', privMatterLSFiles);
                mainDispatch({type: "UPDATE_ITEMS_LIST"});
                var currTab = tabs.find((tab) => {
                    return tab.path === filePath && tab.active === true
                })
                if(currTab) {
                    mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: {}, tab: currTab, action: 'REMOVE_TAB'}});   
                }
            }
        } catch(e) {
            mainDispatch({type: 'SHOW_ALERT_MODAL', payload: {show: true, header: "Error!", message: t("somethingWentWrong")} as AlertData})
        }
    }

    const saveEncrypted = (saveResults: SaveAsResults) => {
        if(saveResults.secret) {
            if(saveResults.saveAsType === "LOCAL_STORAGE") {
                saveToLocalStorage(saveResults.fileName, encryptData(saveResults.secret));
            } else {
                saveToFile(saveResults.fileName, encryptData(saveResults.secret));
            }
        }
    }

    const saveToLocalStorage = (fileNameLoc: string, fileData: string) => {
        try {
            let privMatterLSFiles = retrieveLocalStorage('privmatter.files') || {};
            privMatterLSFiles[fileNameLoc] = {
                size: fileData.length,
                lastModified: new Date().getTime(),
                data: fileData
            }
            saveLocalStorage('privmatter.files', privMatterLSFiles);
        } catch(e) {
            mainDispatch({type: 'SHOW_ALERT_MODAL', payload: {show: true, header: "Error!", message: t("somethingWentWrong")} as AlertData})
        }
    }

    const saveToFile = (fileNameLoc: string, fileData: string) => {
        const blob = new Blob([fileData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = fileNameLoc;
        link.href = url;

        setAskRefresh(true);
        
        link.click();
    }

    const isExternalFileItem = (item: Item): boolean => {
        return (item.fetchData === true)
    }

    const isLocalStorageItem = (item: Item): boolean => {
        return (item.folder === 'localStorage')
    }

    const canUpdateFile = (item: Item): boolean => {
        if(!item.path) {
            return false
        }

        if(isLocalStorageItem(item)) {
            return true
        } else if(isExternalFileItem(item)) {
            return true
        }
        return false
    }

    const updateFile = (callback?: () => void) => {
        if(!canUpdateFile(editedItem)) {
            return
        }

        const fileData = isEncrypted ? encryptData(secret) : note;

        if(isLocalStorageItem(editedItem)) {
            saveToLocalStorage(editedItem.name, fileData);

            mainDispatch({type: "UPDATE_ITEMS_LIST"});
            mainDispatch({type: 'SHOW_NOTIFICATION', payload: {show: true, closeAfter: 3000, message: t('dataSaved')} as AlertData})

            if(callback) {
                callback();
            } else {
                initializeEditedItem();
            }
        } else if(isExternalFileItem(editedItem)) {
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({type: 'updateFileFromPath', data: fileData, path: editedItem.path}) 
            };
            
            fetch('actions', requestOptions)
            .then(result => {return result.json()})
            .then(data => {
                if(data.status !== 0) {
                    // console.warn("Actions response", data);
                    mainDispatch({type: 'SHOW_ALERT_MODAL', payload: {show: true, header: "Error!", message: t("somethingWentWrong")} as AlertData})
                    return
                }
                mainDispatch({type: "UPDATE_ITEMS_LIST"});
                mainDispatch({type: 'SHOW_NOTIFICATION', payload: {show: true, closeAfter: 5000, message: t('dataSaved')} as AlertData})
    
                if(callback) {
                    callback();
                } else {
                    initializeEditedItem();
                }
            })
        }
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

                if(!secret) {
                    giveMeSecret("", "");
                    return
                }

                const bytes = CryptoJS.AES.decrypt(rawData, secret);
                data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            } else {
                data = rawData;
            }
        } catch(e) {
            if(encrypted) {
                giveMeSecret("", t("incorrectPassword"));
            }
        }
        if(data && data.length) {
            setNote(data);
            setOrgNote(data);
            let currentTab = tabs.find((tab) => tab.active === true);
            if(currentTab?.scrollTop && currentTab.scrollTop >= 0) {
                setTimeout(() => {scrollableRef.current?.scrollTo({top: currentTab?.scrollTop})}, 100);
            }
        }
    };


    //https://codemirror.net/docs/ref/
    const onCMChange = useCallback((val: any, viewUpdate: any) => {
        setNote(val);
    }, []);

    return (
        <div className='noteContainer'>
            {
                isLoading &&
                <div style={{width: "100%", height: "100%", display: "table"}}>
                    <div style={{display: "table-cell", verticalAlign: "middle", textAlign: 'center'}}>
                        <AiOutlineLoading className='h2 loading-icon'/> &nbsp;In progress ...
                    </div>
                </div>
            }
            {
                needSecret && <>
                    <SecretComp confirm={false} warning={needSecretMeta.warning} info={needSecretMeta.info || t("providePasswordToOpenDecryptedFile")} handleSubmit={handleSecretSubmit} />
                    <div style={{display: "flex"}} className='formGroupContainer'>
                        {
                            isLocalStorageItem(editedItem) && <Button className="btn-lg" variant='danger' onClick={ () => {
                                setAskDelete(true);
                            }}
                            title={t("delete")}>{t("delete")}</Button>
                        }
                    </div>
                </>
            }
            {
                !isLoading && !needSecret && !isSavingAs && <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <div className='formGroupContainer'>
                        <Form.Group className='formGroup'>
                        <label className='upperLabel'>{t("filePath")}</label>
                        <Form.Control
                            className='form-control-lg'
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
                            <label className='upperLabel'>{t("fileName")}</label>
                            <Form.Control
                                className='form-control-lg'
                                type="text"
                                name="fileName"
                                placeholder=''
                                value={fileName}
                                readOnly={true}
                            ></Form.Control>
                        </Form.Group>
                    </div>
                    <div className='formGroupContainer flexStretch'>
                        <Form.Group ref={scrollableRef} className='formGroup' style={{overflow: 'auto'}} onScroll={()=> {rememberScrollPosition()}}>
                            <label className='upperLabel'>{t("note")}</label>
                            <div style={{height: 100}}>
                            <CodeMirror 
                                value={note} 
                                spellCheck={false}
                                ref={noteRef}
                                extensions={[
                                    javascript({ jsx: true }),
                                    EditorView.lineWrapping,
                                    EditorView.theme({
                                        '.cm-gutter,.cm-content': { minHeight: '500px' },
                                        '.cm-scroller': { overflow: 'auto' },
                                    })
                                ]} 
                                onChange={onCMChange}
                                />
                                </div>
                        </Form.Group>
                    </div>
                    <div style={{display: "flex"}} className='formGroupContainer'>
                        {
                            canUpdateFile(editedItem) && <Button ref={updateFileButtonRef} className="btn-lg" disabled={!isDirty} variant='success' onClick={ () => {
                                updateFile();
                            }}
                            title={t("saveToLocation") + ' ' + editedItem.path}>{t("save")}</Button>
                        }
                        &nbsp;
                        {
                            isLocalStorageItem(editedItem) && <Button className="btn-lg" variant='danger' onClick={ () => {
                                setAskDelete(true);
                            }}
                            title={t("delete")}>{t("delete")}</Button>
                        }
                        <div style={{flex: 1}}>&nbsp;</div>
                        &nbsp;
                        <Button className="btn-lg" ref={saveToFileButtonRef} disabled={!isDirty} variant='success' onClick={ () => {
                            setIsSavingAs(true);
                        }}
                        title={t("saveToSelectedLocation")}>{t("saveAs")}</Button>
                        &nbsp;
                        <Button className="btn-lg" disabled={!isDirty} variant='danger' onClick={() => {
                            setNote(orgNote);
                        }}
                        title={t("rollbackItemChanges")}>{t("cancel")}</Button>
                    </div>
                </div>
            }
            {   
                isSavingAs && 
                <SaveAsComp 
                    fileName={fileName}
                    onSave={handleSaveAs}
                    onClose={() => {setIsSavingAs(false)}}
                />
            }
            {   
                showUnsaved && 
                <ConfirmationComp 
                    externalHeading={t("warning")}
                    externalContent={t("unsavedChanges")}
                    externalSaveLabel={t("save")}
                    externalMiddleLabel={t("ignoreUnsaved")}
                    externalCloseLabel={t("cancel")}
                    externalShowMiddleButton={true}
                    handleExternalMiddle={() => {
                        setShowUnsaved(false);
                        if(editedItemCandidate) {
                            if(secret && forgetSecretMode === "IMMEDIATE") {
                                mainDispatch({type: 'CLEAR_SECRET'})     
                            }
                            if(editedItemCandidate?.item) {
                                mainDispatch({type: 'SET_EDITED_ITEM', payload: editedItemCandidate});
                            }
                        }
                    }}
                    handleExternalSave={() => {
                        setShowUnsaved(false);
                        if(!canUpdateFile(editedItem)) {
                            setIsSavingAs(true);
                        } else {
                            updateFile(function() {
                                if(editedItemCandidate?.item) {
                                    mainDispatch({type: 'SET_EDITED_ITEM', payload: editedItemCandidate});
                                }
                            });
                        }
                    }}
                    handleExternalClose={() => {setShowUnsaved(false)}}
                />
            }
            {   
                askRefresh && 
                <ConfirmationComp 
                    externalHeading={t("question")}
                    externalContent={t("confirmRefresh")}
                    externalSaveLabel={t("yes")}
                    externalCloseLabel={t("no")}
                    handleExternalSave={() => {
                        setAskRefresh(false);
                        mainDispatch({type: "UPDATE_ITEMS_LIST"});
                        initializeEditedItem();
                    }}
                    handleExternalClose={() => {setAskRefresh(false)}}
                />
            }
            {   
                askDelete && 
                <ConfirmationComp 
                    externalHeading={t("pleaseConfirm")}
                    externalContent={t("confirmDelete", {item: fileName})}
                    externalSaveLabel={t("yes")}
                    externalCloseLabel={t("no")}
                    handleExternalSave={handleDeleteItem}
                    handleExternalClose={() => {setAskDelete(false)}}
                />
            }
        </div>
    )
}

export default NoteComp
