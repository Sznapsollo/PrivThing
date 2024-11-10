import { AiOutlineLoading } from 'react-icons/ai';
import { RiMenuUnfoldFill } from "react-icons/ri";
import { RiArrowUpCircleLine } from "react-icons/ri";
import { FaMagnifyingGlass } from "react-icons/fa6";

import '../styles.css'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Form, Button, Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import CryptoJS from 'crypto-js';
import { AppState } from '../context/Context'
import ConfirmationComp from './ConfirmationComp';
import SecretComp from './SecretComp';
import { AlertData, EditItem, Item, SaveAsResults, GenericContextMenu, GenericContextMenuItem, GenericContextMenuAction, NoteContextMenu } from '../model';

import Dropdown from 'react-bootstrap/Dropdown';
import CodeMirror, { BlockInfo, ReactCodeMirrorRef, lineNumbers, Extension, SelectionRange, EditorSelection, Prec } from '@uiw/react-codemirror';
import { Decoration, DecorationSet, EditorView, MatchDecorator, WidgetType, ViewPlugin, ViewUpdate, keymap } from "@codemirror/view"
import { javascript } from '@codemirror/lang-javascript';
import { openSearchPanel } from '@codemirror/search';
import SaveAsComp from './SaveAsComp';
import { retrieveLocalStorage, saveLocalStorage } from '../utils/utils';
import moment from 'moment';
import { Alert } from '@mui/material';
import { MAIN_ACTIONS } from '../context/Reducers';
import axios from 'axios';
import { amy, ayuLight, barf, bespin, birdsOfParadise, boysAndGirls, clouds, cobalt, coolGlow, dracula, espresso, noctisLilac, rosePineDawn, smoothy, solarizedLight, tomorrow } from 'thememirror';
import { createCustomTheme } from '../utils/customTheme'
import GenericContextMenuComp from './GenericContextMenuComp';

var scrollNoteHandle: ReturnType<typeof setTimeout> | null = null;
var isIntroducedGlb = retrieveLocalStorage("privthing.isIntroduced");

const hideRegex = /hide\[\[(.*)\]\]/g;

const initialContextMenu: NoteContextMenu = {
    show: false,
    menuActions: [],
    x: 0,
    y: 0,
    selectionStart: 0,
    selectionEnd: 0,
    clickEvent: null
}
interface Props {
    editedItem: EditItem,
    isFullScreen?: boolean
}

const NoteComp = ({ editedItem, isFullScreen }: Props) => {

    const { t } = useTranslation();
    interface SecretMeta {
        info?: string,
        warning?: string
    }

    const { mainState: { editedItemCandidate, tabs, secret, newItemToOpen, items }, mainDispatch, settingsState: { forgetSecretMode, stretchNoteSpaceOnActive, codeMirrorTheme, customThemeColors } } = AppState();
    const [filePath, setFilePath] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
    const [isIntroduced, setIsIntroduced] = useState<boolean>(isIntroducedGlb);
    const [showUnsaved, setShowUnsaved] = useState<boolean>(false);
    const [needSecret, setNeedSecret] = useState<boolean>(false);
    const [updateSecret, setUpdateSecret] = useState<boolean>(false);
    const [askRefresh, setAskRefresh] = useState<boolean>(false);
    const [askDelete, setAskDelete] = useState<boolean>(false);
    const [needSecretMeta, setNeedSecretMeta] = useState<SecretMeta>({});
    const [isSavingAs, setIsSavingAs] = useState<boolean>(false);
    const [noteContextMenu, setNoteContextMenu] = useState<NoteContextMenu>(initialContextMenu);
    const [showFullScreen, setShowFullScreen] = useState<boolean>(false);
    const [wrapWords, setWrapWords] = useState<boolean>(true);

    const updateFileButtonRef = useRef<HTMLButtonElement>(null);
    const saveToFileButtonRef = useRef<HTMLButtonElement>(null);
    const scrollableRef = useRef<HTMLDivElement>(null);
    const noteRef = useRef<ReactCodeMirrorRef>(null);
    const secretUpdateRef = useRef<string>('');

    const orgNote = useRef<string>('');
    const rawNote = useRef<string>('');
    const isMouseOver = useRef(false);
    const isUpdating = useRef(false);
    const srollTopBtn = useRef<HTMLDivElement>(null);

    const setRawNote = (rawNoteData: string): void => {
        rawNote.current = rawNoteData;
        if (rawNote.current?.length) {
            decryptData();
        }
    }

    const isMac = window.navigator.userAgent.indexOf('Mac') >= 0;

    useEffect(() => {
        if (!newItemToOpen?.path) {
            return
        }
        setIsDirty(false);
        mainDispatch({ type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: { item: newItemToOpen } });
    }, [newItemToOpen?.path]);

    useEffect(() => {
        if (isEncrypted) {
            if (updateSecret) {
                setUpdateSecret(false);
            }
            if (!secret) {
                giveMeSecret("", "");
                setIsDirty(false); // no ideal since we loose eventual not saved changes to edited doc
                // might address it in the future
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
        if (!editedItem.isActive || !editedItemCandidate?.id) {
            return
        }
        if (isDirty) {
            setShowUnsaved(true);
        } else {
            if (secret && forgetSecretMode === "IMMEDIATE") {
                mainDispatch({ type: MAIN_ACTIONS.CLEAR_SECRET })
            }
            if (editedItemCandidate?.item) {
                mainDispatch({ type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: editedItemCandidate })
            }
        }
    }, [editedItemCandidate?.id]);

    useEffect(() => {
        validateButtonsState();
        setTimeout(() => {
            let noteCMView = noteRef.current?.view;
            if (!noteCMView) {
                return
            }
            noteCMView?.focus();
        }, 100)

    }, [note]);

    const initializeCompleted = () => {
        if (secretUpdateRef.current && secretUpdateRef.current.length) {
            mainDispatch({ type: MAIN_ACTIONS.UPDATE_SECRET, payload: secretUpdateRef.current });
            secretUpdateRef.current = '';
        }
    }

    const initializeEditedItem = () => {
        if (isUpdating.current !== true) {
            setInitialState();
        }

        let defaultFileName = moment().format('MMMM_Do_YYYY_h_mm_ss') + '_privthing.txt';
        setFilePath(editedItem.path || '');
        setFileName(editedItem.name || defaultFileName);

        if (isLocalStorageItem(editedItem)) {
            if (isUpdating.current !== true) {
                // will cause flickker so no on update
                setIsLoading(true);
            }
            try {
                let localStorageFiles = retrieveLocalStorage('privthing.files');
                if (localStorageFiles && localStorageFiles[editedItem.name] != null && localStorageFiles[editedItem.name].data != null) {
                    setRawNote(localStorageFiles[editedItem.name].data);
                } else if (!!editedItem.path) {
                    mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, type: 'error', closeAfter: 10000, message: t('fileNotFound') + (filePath || '') } as AlertData })
                    // mainDispatch({type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: {show: true, header: t("error"), message: t("fileNotFound")} as AlertData})
                    let currentTabs = tabs.filter((tab) => tab.path !== editedItem.path);
                    mainDispatch({ type: MAIN_ACTIONS.UPDATE_TABS, payload: currentTabs });
                }
                initializeCompleted();
            } catch (e) {
                console.warn('localStorage read operation error: ', e);
                mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, type: 'error', closeAfter: 10000, message: t('somethingWentWrong') + (editedItem.path || '') } as AlertData })
                initializeCompleted();
            }
            setIsLoading(false);
        } else if (isExternalFileItem(editedItem)) {
            // NJ load and setEncrypted data
            if (isUpdating.current !== true) {
                // will cause flickker so no on update
                setIsLoading(true);
            }

            axios.post('actions',
                JSON.stringify({ type: 'retrieveFileFromPath', data: editedItem.path }),
                {
                    headers: {
                        "Content-Type": 'application/json',
                    },
                }
            )
                .then(response => {
                    let data = response.data
                    setIsLoading(false);
                    if (data?.status !== 0) {
                        // console.warn("Actions response", data);
                        return
                    }
                    if (data.data == null && !!editedItem.path) {
                        mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, type: 'error', closeAfter: 10000, message: t('fileNotFound') + (filePath || '') } as AlertData })
                        // mainDispatch({type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: {show: true, header: t("error"), message: t("fileNotFound")} as AlertData})
                        let currentTabs = tabs.filter((tab) => tab.path !== editedItem.path);
                        mainDispatch({ type: MAIN_ACTIONS.UPDATE_TABS, payload: currentTabs });
                    }
                    if (typeof data.data === "string") {
                        setRawNote(data.data);
                    }
                    initializeCompleted();
                })
                .catch(function (error) {
                    setIsLoading(false);
                    console.warn('Fetch operation error: ', error.message);
                    mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, type: 'error', closeAfter: 10000, message: t('somethingWentWrong') + (editedItem.path || '') } as AlertData })
                    initializeCompleted();
                });
        } else {
            setIsLoading(true);
            setRawNote(editedItem.rawNote || '');
            setIsLoading(false);
            initializeCompleted();
        }
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "f") {
            if (noteRef?.current?.view) {
                openSearchPanel(noteRef.current.view);
                e.preventDefault();
            }
        } else if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "s" && updateFileButtonRef.current && updateFileButtonRef.current?.disabled === false) {
            e.preventDefault();
            if (updateFileButtonRef.current) {
                updateFileButtonRef.current.click();
            }
        } else if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "s" && saveToFileButtonRef.current && saveToFileButtonRef.current?.disabled === false) {
            e.preventDefault();
            if (saveToFileButtonRef.current) {
                saveToFileButtonRef.current.click();
            }
        }
    }

    useEffect(() => {
        if (editedItem.isActive) {
            window.addEventListener("keydown", onKeyDown);
            if (stretchNoteSpaceOnActive && (!editedItem.flex || editedItem.flex === 1)) {
                mainDispatch({ type: MAIN_ACTIONS.STRETCH_NOTE_SPACE, payload: editedItem });
            }
            manageTopButtonVisibility();
        }
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        }
    }, [editedItem.isActive]);

    const manageTopButtonVisibility = () => {
        if (srollTopBtn.current) {
            if (scrollableRef.current?.scrollTop != null && scrollableRef.current?.scrollTop > 100) {
                srollTopBtn.current.style.display = 'flex';
            } else {
                srollTopBtn.current.style.display = 'none';
            }
        }
    }

    const rememberScrollPosition = () => {
        // console.log('scrollableRef.current?.scrollTop', scrollableRef.current?.scrollTop)
        if (scrollNoteHandle) {
            clearTimeout(scrollNoteHandle);
        }
        scrollNoteHandle = setTimeout(function () {
            if (editedItem.isActive && isMouseOver.current === true) {
                // console.log('remember', scrollableRef.current?.scrollTop)
                let currentTabs = tabs.map((tab) => {
                    if (tab.isActive === true) {
                        return { ...tab, scrollTop: scrollableRef.current?.scrollTop }
                    }
                    return { ...tab }
                });

                mainDispatch({ type: MAIN_ACTIONS.UPDATE_TABS_SILENT, payload: currentTabs });
            }
            if (editedItem.isActive) {
                manageTopButtonVisibility();
            }

            // to prevent debounce from stretching of elements that causes scroll
            // if it wants to get back to focus but it was deactivated just moment ago - dont do it
            let shouldActiveItemFocus = (!editedItem.isActive);

            if (shouldActiveItemFocus && isMouseOver.current === true) {
                handleActiveItemFocus();
            }
        }, 200)
    }

    const giveMeSecret = (info?: string, warning?: string): void => {
        setNeedSecretMeta({ info: info, warning: warning });
        setNeedSecret(true);
    }

    const dismissSecret = (): void => {
        setNeedSecretMeta({});
        setNeedSecret(false);
    }

    const validateButtonsState = () => {
        setIsDirty((note !== orgNote.current));
    }

    const setInitialState = () => {
        setFileName('');
        setFilePath('');
        setIsEncrypted(false);
        setIsSavingAs(false);
        dismissSecret();
        setNote('');
        setIsDirty(false);
        orgNote.current = '';
        setRawNote('');
        setShowUnsaved(false);
        setUpdateSecret(false);
    }

    const handleSecretSubmit = (secret: string) => {
        mainDispatch({ type: MAIN_ACTIONS.UPDATE_SECRET, payload: secret });
    }

    const handleSecretUpdate = (passedSecret: string) => {
        if (isEncrypted && !needSecret && passedSecret && canUpdateFile(editedItem)) {
            secretUpdateRef.current = passedSecret;
            updateFile(function () {
                initializeEditedItem();
            });
        }
        setUpdateSecret(false);
    }

    const handleWrappToggle = () => {
        setWrapWords(prev => !prev);
    }

    const handleSaveAs = (saveResults: SaveAsResults): void => {
        if (!canSaveFile(saveResults)) {
            return
        }
        if (saveResults.saveAsType === "LOCAL_STORAGE") {

            // check if there is some with this name
            let alreadyExistingItem = items.find((item) => {
                return item.folder === "localStorage" && item.name === saveResults.fileName
            })
            if (alreadyExistingItem) {
                mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, type: 'error', closeAfter: 3000, message: t('itemXAlreadyExists', { item: saveResults.fileName }) } as AlertData })
                return
            }

            if (saveResults.encryptData && saveResults.secret) {
                saveEncrypted(saveResults);
            } else {
                saveToLocalStorage(saveResults.fileName, note);
            }
            mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST, payload: "localStorage/" + saveResults.fileName });
            mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 3000, message: t('dataSaved') } as AlertData })
        } else {
            if (saveResults.encryptData && saveResults.secret) {
                saveEncrypted(saveResults);
            } else {
                saveToFile(saveResults.fileName, note);
            }
        }
        setIsSavingAs(false);
    }

    const handleDeleteItem = () => {
        setAskDelete(false)
        if (!isLocalStorageItem(editedItem)) {
            return
        }

        try {
            let privThingLSFiles = retrieveLocalStorage('privthing.files') || {};
            if (privThingLSFiles) {
                delete privThingLSFiles[fileName]
                saveLocalStorage('privthing.files', privThingLSFiles);
                mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST });
                var currTab = tabs.find((tab) => {
                    return tab.path === filePath && tab.isActive === true
                })
                if (currTab) {
                    mainDispatch({ type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: { item: {}, tab: currTab, action: 'REMOVE_TAB' } });
                }
            }
        } catch (e) {
            mainDispatch({ type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: { show: true, header: t("error"), message: t("somethingWentWrong") } as AlertData })
        }
    }

    const handleAcceptIntroduction = () => {
        setIsIntroduced(true);
        saveLocalStorage("privthing.isIntroduced", true);
    }

    const handleActiveItemFocus = () => {
        if (editedItem.isActive) {
            return
        }
        mainDispatch({ type: MAIN_ACTIONS.SET_NOTE_SPACE_ACTIVE, payload: editedItem })
    }

    const saveEncrypted = (saveResults: SaveAsResults) => {
        if (saveResults.secret) {
            if (saveResults.saveAsType === "LOCAL_STORAGE") {
                saveToLocalStorage(saveResults.fileName, encryptData(saveResults.secret));
            } else {
                saveToFile(saveResults.fileName, encryptData(saveResults.secret));
            }
        }
    }

    const saveToLocalStorage = (fileNameLoc: string, fileData: string) => {
        try {
            let privThingLSFiles = retrieveLocalStorage('privthing.files') || {};
            privThingLSFiles[fileNameLoc] = {
                size: fileData.length,
                lastModified: new Date().getTime(),
                data: fileData
            }
            saveLocalStorage('privthing.files', privThingLSFiles);
        } catch (e) {
            mainDispatch({ type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: { show: true, header: t("error"), message: t("somethingWentWrong") } as AlertData })
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

    const canSaveFile = (item: SaveAsResults): boolean => {
        if (!item.saveAsType?.length) {
            return false
        }

        if (!item.fileName?.length) {
            return false
        }

        return true
    }

    const canUpdateFile = (item: Item): boolean => {
        if (!item.path?.length) {
            return false
        }

        if (!item.name?.length) {
            return false
        }

        if (isLocalStorageItem(item)) {
            return true
        } else if (isExternalFileItem(item)) {
            return true
        }
        return false
    }

    const onMouseOver = () => {
        isMouseOver.current = true;
        if (scrollableRef.current) {
            // scrollableRef.current.style.overflow = 'auto';
        }
    }

    const onMouseLeave = () => {
        isMouseOver.current = false;
        if (scrollableRef.current) {
            // scrollableRef.current.style.overflow = 'hidden';
        }
    }

    const updateFile = (callback?: () => void) => {
        if (!canUpdateFile(editedItem)) {
            return
        }

        if (isEncrypted && !secret) {
            mainDispatch({ type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: { show: true, header: t("warning"), message: t("cantSaveWithoutPassword", { name: editedItem.name }) } as AlertData })
            return
        }

        let secretLoc = secret
        if (updateSecret === true && secretUpdateRef.current && secretUpdateRef.current.length && isEncrypted && secret && secret.length && !needSecret) {
            secretLoc = secretUpdateRef.current;
        }

        const fileData = isEncrypted ? encryptData(secretLoc) : note;

        if (isLocalStorageItem(editedItem)) {
            saveToLocalStorage(editedItem.name, fileData);

            mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST });
            mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 3000, message: t('dataSaved') } as AlertData })

            if (callback) {
                callback();
            } else {
                isUpdating.current = true;
                initializeEditedItem();
            }
        } else if (isExternalFileItem(editedItem)) {
            axios.post('actions',
                JSON.stringify({ type: 'updateFileFromPath', data: fileData, path: editedItem.path }),
                {
                    headers: {
                        "Content-Type": 'application/json',
                    },
                }
            )
                .then(response => {
                    let data = response.data;
                    if (data?.status !== 0) {
                        // console.warn("Actions response", data);
                        mainDispatch({ type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: { show: true, header: t("error"), message: t("somethingWentWrong") } as AlertData })
                        return
                    }
                    mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST });
                    mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 5000, message: t('dataSaved') } as AlertData })

                    if (callback) {
                        callback();
                    } else {
                        isUpdating.current = true;
                        initializeEditedItem();
                    }
                })
        }
    }

    const encryptData = (secret: string): string => {
        const encryptedData = CryptoJS.AES.encrypt(
            JSON.stringify(note),
            secret
        ).toString();

        return 'privthingencrypted_' + encryptedData;
    };

    const decryptData = () => {
        let data;
        let rawData = rawNote.current;
        let encrypted = false;
        try {
            encrypted = false;
            if (editedItem.name?.toLocaleLowerCase()?.includes('.prvthng')) {
                encrypted = true;
            }
            if (rawData.startsWith('privthingencrypted_')) {
                encrypted = true;
                rawData = rawData.replace('privthingencrypted_', '');
            }

            if (encrypted === true) {
                setIsEncrypted(true);

                if (!secret) {
                    giveMeSecret("", "");
                    return
                }

                const bytes = CryptoJS.AES.decrypt(rawData, secret);
                data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            } else {
                data = rawData;
            }
        } catch (e) {
            if (encrypted) {
                giveMeSecret("", t("incorrectPassword"));
            }
        }
        if (data && data.length) {
            let updateNoteElements = true;
            if (isUpdating.current === true) {
                isUpdating.current = false;
                if (data.length === note.length) {
                    updateNoteElements = false;
                }
            }

            orgNote.current = data;
            if (updateNoteElements) {
                setNote(data);
                let currentTab = tabs.find((tab) => tab.isActive === true);
                // console.log('currentTab?.scrollTop', currentTab?.scrollTop)
                if (currentTab?.scrollTop && currentTab.scrollTop >= 0) {
                    setTimeout(() => {
                        scrollableRef.current?.scrollTo({ top: currentTab?.scrollTop });
                        manageTopButtonVisibility();
                    }, 500);
                }
            } else {
                console.log('Is update and notes the same will not update note to avoid scroll & flicker')
                if (isDirty) {
                    setIsDirty(false);
                }
                onTriggerBlinkingBorder();
            }
        }
    };

    const buildContextMenu = (e: any, options?: { type: string, selectionStart?: number, selectionEnd?: number }) => {
        e.preventDefault();
        const { pageX, pageY } = e;
        const menuActions: GenericContextMenuItem[] = [];
        const noteContextMenuObj: NoteContextMenu = {
            show: true,
            menuActions: menuActions,
            x: pageX,
            y: pageY
        }
        const fromChar = noteRef.current?.view?.state?.selection?.main.from;
        const toChar = noteRef.current?.view?.state?.selection?.main.to;

        if (options?.type === 'fromMarked') {
            if (options.selectionStart != null && options.selectionEnd != null && options.selectionEnd > options.selectionStart) {
                let selectedText = note.substring(options.selectionStart, options.selectionEnd);
                if (selectedText && selectedText.length && selectedText.match(hideRegex) && !selectedText.includes('\n')) {
                    noteContextMenuObj.selectionStart = options.selectionStart;
                    noteContextMenuObj.selectionEnd = options.selectionEnd;
                    noteContextMenuObj.clickEvent = e;
                    menuActions.push({
                        action: 'copyHiddenText',
                        title: t('copy')
                    })
                    menuActions.push({
                        action: 'unveilHiddenText',
                        title: t('unveilHiddenText')
                    })
                    menuActions.push({
                        action: 'unhideHiddenText',
                        title: t('unhideHiddenText')
                    })
                }
            }
        } else {

            if (fromChar != null && toChar != null && toChar > fromChar) {
                console.log(fromChar, toChar)
                // console.log(noteRef.current?.view?.state.sliceDoc(fromChar, toChar))
                // console.log(note.substring(fromChar, toChar))

                let selectedText = note.substring(fromChar, toChar);

                noteContextMenuObj.selectionStart = fromChar;
                noteContextMenuObj.selectionEnd = toChar;

                menuActions.push({
                    action: 'copy',
                    title: t('copy')
                })

                // we do not want it to contain any other decorators
                // we do not want to have new lines either - would be nide to but decorator regexp works only withing current line content 
                // so untill i resolve that lets limit o one line
                if (selectedText && selectedText.length && !selectedText.match(hideRegex) && !selectedText.includes('\n')) {
                    menuActions.push({
                        action: 'hideSelectedText',
                        title: t('hideSelectedText')
                    })
                }
            } else {
                if (noteRef.current?.view) {
                    let pos = noteRef.current.view.posAtCoords({ x: pageX, y: pageY });
                    if (pos != null) {
                        let lineNo = noteRef.current.view.state.doc.lineAt(pos).number;
                        noteContextMenuObj.clickedLine = lineNo;
                        menuActions.push({
                            action: 'copyLine',
                            title: `${t('copyLine')} ${lineNo}`
                        })
                        menuActions.push({
                            action: 'deleteLine',
                            title: `${t('deleteLine')} ${lineNo}`
                        })
                    }
                }
            }

            if (fromChar != null && toChar != null && toChar > fromChar) {
                menuActions.push({
                    action: 'delete',
                    title: t('delete')
                })
            }
        }

        setNoteContextMenu(noteContextMenuObj);
    }

    const handleContextMenuAction = (menuAction: GenericContextMenuAction) => {
        switch (menuAction.action) {
            case 'copy':
                if (noteContextMenu.selectionStart != null && noteContextMenu.selectionEnd != null && noteContextMenu.selectionEnd > noteContextMenu.selectionStart) {
                    copyClickedValue((note.substring(noteContextMenu.selectionStart, noteContextMenu.selectionEnd) || '').replaceAll('hide[[', '').replaceAll(']]', ''));
                }
                break;
            case 'copyLine':
                if (noteContextMenu.clickedLine != null && noteRef.current?.view != null) {
                    copyClickedValue((noteRef.current.view.state.doc.line(noteContextMenu.clickedLine).text || '').replaceAll('hide[[', '').replaceAll(']]', ''));
                }
                break;
            case 'delete':
                if (noteContextMenu.selectionStart != null && noteContextMenu.selectionEnd != null && noteContextMenu.selectionEnd > noteContextMenu.selectionStart) {
                    let selectedText = note.substring(noteContextMenu.selectionStart, noteContextMenu.selectionEnd);
                    if (selectedText && selectedText.length) {
                        setNote(note.substring(0, noteContextMenu.selectionStart) + note.substring(noteContextMenu.selectionEnd))
                    }
                }
                break;
            case 'deleteLine':
                if (noteContextMenu.clickedLine != null && noteRef.current?.view != null) {
                    let line = noteRef.current.view.state.doc.line(noteContextMenu.clickedLine); // Convert 1-based line number to 0-based index
                    let charStart = line.from;
                    let chartEnd = line.to;

                    let firstPart = note.substring(0, charStart);
                    if (firstPart.endsWith('\n')) {
                        firstPart = firstPart.substring(0, firstPart.length - 2);
                    }
                    setNote(firstPart + note.substring(chartEnd));
                }
                break;
            case 'hideSelectedText':
                if (noteContextMenu.selectionStart != null && noteContextMenu.selectionEnd != null && noteContextMenu.selectionEnd > noteContextMenu.selectionStart) {
                    let selectedText = note.substring(noteContextMenu.selectionStart, noteContextMenu.selectionEnd);
                    // we do not want it to contain any other decorators
                    if (selectedText && selectedText.length && !selectedText.match(hideRegex) && !selectedText.includes('\n')) {
                        setNote(note.substring(0, noteContextMenu.selectionStart) + `hide[[${selectedText}]]` + note.substring(noteContextMenu.selectionEnd))
                    }
                }
                break;
            case 'unveilHiddenText':
                if (noteContextMenu.selectionStart != null && noteContextMenu.selectionEnd != null && noteContextMenu.selectionEnd > noteContextMenu.selectionStart && noteContextMenu.clickEvent != null && noteContextMenu.clickEvent.target != null) {
                    const evC = noteContextMenu.clickEvent
                    const orgValue = (evC.target as HTMLSpanElement).innerHTML;
                    const markedNodeId = `${noteContextMenu.selectionStart}_${noteContextMenu.selectionEnd}`;
                    const markedNode = document.getElementById(markedNodeId);

                    if (markedNode) {
                        const hiddenText = note.substring(noteContextMenu.selectionStart, noteContextMenu.selectionEnd);
                        setTimeout(() => {
                            const markedNode = document.getElementById(markedNodeId);
                            if (markedNode) {
                                markedNode.innerHTML = hiddenText.replaceAll('hide[[', '').replaceAll(']]', '');
                            }

                            setTimeout(() => {
                                const markedNode = document.getElementById(markedNodeId);
                                if (markedNode) {
                                    markedNode.innerHTML = orgValue;
                                }
                            }, 5000)
                        }, 200)
                    }
                }
                break;
            case 'unhideHiddenText':
                if (noteContextMenu.selectionStart != null && noteContextMenu.selectionEnd != null && noteContextMenu.selectionEnd > noteContextMenu.selectionStart) {
                    let hiddenText = note.substring(noteContextMenu.selectionStart, noteContextMenu.selectionEnd);
                    // we do not want it to contain any other decorators
                    if (hiddenText && hiddenText.length && hiddenText.match(hideRegex) && !hiddenText.includes('\n')) {
                        setNote(note.substring(0, noteContextMenu.selectionStart) + `${hiddenText.replaceAll('hide[[', '').replaceAll(']]', '')}` + note.substring(noteContextMenu.selectionEnd))
                    }
                }
                break;
            case 'copyHiddenText':
                if (noteContextMenu.selectionStart != null && noteContextMenu.selectionEnd != null && noteContextMenu.selectionEnd > noteContextMenu.selectionStart) {
                    let hiddenText = note.substring(noteContextMenu.selectionStart, noteContextMenu.selectionEnd);
                    // we do not want it to contain any other decorators
                    if (hiddenText && hiddenText.length && hiddenText.match(hideRegex) && !hiddenText.includes('\n')) {
                        copyClickedValue((hiddenText || '').replaceAll('hide[[', '').replaceAll(']]', ''), 'copied');
                    }
                }
                break;
            case 'close':
            default:
                break;
        }
        setNoteContextMenu(initialContextMenu);
    }

    var canUpdateFileDom = canUpdateFile(editedItem);
    var saveHotKey = isMac ? "Cmd + S" : "Ctrl + S";

    //https://codemirror.net/docs/ref/
    const onCMChange = useCallback((val: any, viewUpdate: any) => {
        setNote(val);
    }, []);

    const copyClickedValue = (copiedText: String, copyMessage: string = 'lineCopiedToClipboard') => {
        onTriggerBlinkingBorder();
        let markedText = (copiedText || '').toString();
        navigator.clipboard.writeText(markedText);
        mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 5000, message: t(copyMessage) } as AlertData })
    }

    const onTriggerBlinkingBorder = () => {
        if (!noteRef.current || !noteRef.current.view?.contentDOM.classList) {
            return
        }
        const blinkingCss = 'blinkNotepad';
        if (noteRef.current.view.contentDOM.classList.contains(blinkingCss)) {
            noteRef.current.view.contentDOM.classList.remove(blinkingCss);
            setTimeout(onTriggerBlinkingBorder, 100);
        } else {
            noteRef.current.view.contentDOM.classList.add(blinkingCss);
        }
    }
    class PassHiderWidget extends WidgetType {
        constructor(readonly element: string, readonly view: EditorView, readonly position: number) { super() }

        toDOM() {
            const spanID = `${this.position}_${this.position + this.element.length + ('hide[[]]').length}`
            let wrap = document.createElement("span")
            wrap.setAttribute("aria-hidden", "true")
            wrap.setAttribute("id", spanID)
            wrap.onclick = (e) => {
                copyClickedValue((this.element || '').replaceAll('hide[[', '').replaceAll(']]', ''), 'copied');
                e.preventDefault();
            }
            wrap.oncontextmenu = (e) => {
                if (e && e.target) {
                    // const {pageX, pageY} = e;
                    buildContextMenu(e, { type: 'fromMarked', selectionStart: this.position, selectionEnd: this.position + this.element.length + ('hide[[]]').length });
                }
                e.preventDefault();
            }
            wrap.className = "cm-pass-hider";
            wrap.innerHTML = this.element.replace(/./g, '*');

            return wrap
        }

        ignoreEvent() { return false }
    }

    const placeholderMatcher = new MatchDecorator({
        // regexp: /pass\[\[(\w+)\]\]/g,
        regexp: hideRegex,
        decoration: (match, view, position) => Decoration.replace({
            widget: new PassHiderWidget(match[1], view, position)
        })
    })

    const placeholders = ViewPlugin.fromClass(class {
        placeholders: DecorationSet
        constructor(view: EditorView) {
            this.placeholders = placeholderMatcher.createDeco(view)
        }
        update(update: ViewUpdate) {
            this.placeholders = placeholderMatcher.updateDeco(update, this.placeholders)
        }
    }, {
        decorations: instance => instance.placeholders,
        provide: plugin => EditorView.atomicRanges.of(view => {
            return view.plugin(plugin)?.placeholders || Decoration.none
        })
    })

    let cdmrrorTheme: 'none' | Extension = 'none'
    if (codeMirrorTheme === 'amy') {
        cdmrrorTheme = amy
    } else if (codeMirrorTheme === 'ayuLight') {
        cdmrrorTheme = ayuLight
    } else if (codeMirrorTheme === 'barf') {
        cdmrrorTheme = barf
    } else if (codeMirrorTheme === 'bespin') {
        cdmrrorTheme = bespin
    } else if (codeMirrorTheme === 'birdsOfParadise') {
        cdmrrorTheme = birdsOfParadise
    } else if (codeMirrorTheme === 'boysAndGirls') {
        cdmrrorTheme = boysAndGirls
    } else if (codeMirrorTheme === 'clouds') {
        cdmrrorTheme = clouds
    } else if (codeMirrorTheme === 'cobalt') {
        cdmrrorTheme = cobalt
    } else if (codeMirrorTheme === 'coolGlow') {
        cdmrrorTheme = coolGlow
    } else if (codeMirrorTheme === 'dracula') {
        cdmrrorTheme = dracula
    } else if (codeMirrorTheme === 'espresso') {
        cdmrrorTheme = espresso
    } else if (codeMirrorTheme === 'noctisLilac') {
        cdmrrorTheme = noctisLilac
    } else if (codeMirrorTheme === 'rosePineDawn') {
        cdmrrorTheme = rosePineDawn
    } else if (codeMirrorTheme === 'smoothy') {
        cdmrrorTheme = smoothy
    } else if (codeMirrorTheme === 'solarizedLight') {
        cdmrrorTheme = solarizedLight
    } else if (codeMirrorTheme === 'tomorrow') {
        cdmrrorTheme = tomorrow
    } else if (codeMirrorTheme === 'customTheme') {
        cdmrrorTheme = createCustomTheme(customThemeColors)
    }

    let cdmrrorExtensions = [
        javascript({ jsx: true }),
        lineNumbers({
            domEventHandlers: {
                click(view: EditorView, line: BlockInfo, event: any) {
                    let clickedNumber = event?.srcElement?.innerText;
                    if (clickedNumber) {
                        let rowNumber = parseInt(clickedNumber);
                        if (!isNaN(rowNumber)) {
                            copyClickedValue((view.state.doc.line(rowNumber).text || '').replaceAll('hide[[', '').replaceAll(']]', ''));

                            view.dispatch({
                                // Set selection to that entire line.
                                // selection: { head: line.from, anchor: line.to },
                                selection: { head: line.from, anchor: line.from },
                                // Ensure the selection is shown in viewport
                                scrollIntoView: true
                            });
                        }
                    }
                    return true
                }
            }
        }),
        placeholders,
        EditorView.theme({
            '.cm-gutter,.cm-content': { borderBottom: "nonde", minHeight: '1000px' },
            '.cm-scroller': { overflow: 'auto' },
        }),
        // Prec.high(
        //     EditorView.domEventHandlers({
        //         keydown: (event, view) => {
        //             console.log(`Key pressed: ${event.key}`);
        //           // Return false to let CodeMirror handle the event as well
        //           return false;
        //         },
        //     }),
        // ),
        // without Prec.high Enter and Backspace will not execute
        Prec.high(
            keymap.of([
                {
                    key: 'Enter',
                    run: (view) => {
                        const { state, dispatch } = view;
                        const changes = state.changeByRange((range) => ({
                            changes: { from: range.from, insert: '\n' },
                            range: EditorSelection.range(range.to + 1, range.to + 1),
                            // range: EditorView.range(range.from + 1),
                        }));
                        dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
                        return true;
                    },
                },
            ]),
        ),
        EditorView.theme({
            // '&.cm-focused .cm-selectionLayer .cm-selectionBackground': {
            '.cm-scroller .cm-selectionBackground': {
                backgroundColor: '#99999940 !important', // Change the selection background color here
            },
        }, { dark: true })
        // EditorView.theme({
        //     '.cm-cursor': {
        //       borderLeftColor: 'red', // Change the cursor color here
        //     },
        // }, { dark: true })
    ]

    if (wrapWords) {
        cdmrrorExtensions.push(EditorView.lineWrapping);
    }

    return (
        <div className='noteContainer'>
            {
                isLoading &&
                <div style={{ width: "100%", height: "100%", display: "table" }}>
                    <div style={{ display: "table-cell", verticalAlign: "middle", textAlign: 'center' }}>
                        <AiOutlineLoading className='h2 loading-icon' /> &nbsp;In progress ...
                    </div>
                </div>
            }
            {
                needSecret && <>
                    <SecretComp cssClass={(editedItem.isActive ? 'notepadActive' : 'notepadInactive') + ' secretPane'} globalClick={handleActiveItemFocus} confirm={false} warning={needSecretMeta.warning} info={needSecretMeta.info || t("providePasswordToOpenDecryptedFile")} handleSubmit={handleSecretSubmit} />
                    <div style={{ display: "flex", marginTop: 3, height: '55px' }} className='formGroupContainer'>
                        {
                            editedItem.isActive && isLocalStorageItem(editedItem) && <Button className="btn-lg" variant='danger' onClick={() => {
                                setAskDelete(true);
                            }}
                                title={t("delete")}>{t("delete")}</Button>
                        }
                    </div>
                </>
            }
            {
                updateSecret && <>
                    <SecretComp cssClass={(editedItem.isActive ? 'notepadActive' : 'notepadInactive') + ' secretPane'} globalClick={handleActiveItemFocus} confirm={true} info={t("changeSecret")} handleSubmit={handleSecretUpdate} />
                    <div style={{ display: "flex", marginTop: 3, height: '55px' }} className='formGroupContainer'>
                        {
                            editedItem.isActive && updateSecret && <Button className="btn-lg" variant='danger' onClick={() => {
                                setUpdateSecret(false);
                            }}
                                title={t("cancel")}>{t("cancel")}</Button>
                        }
                    </div>
                </>
            }
            {
                !isLoading && !needSecret && !updateSecret && !isSavingAs && <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className='noteInputFields'>
                        <div className='formGroupContainer' style={{ flex: 1 }}>
                            <Form.Group className='formGroup'>
                                <label className={'upperLabel' + (editedItem.isActive ? ' upperLabelActive' : '') + (isDirty ? ' upperLabelDirty' : '')}>{t("filePath")}</label>
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
                        <div style={{ width: 5, height: 1 }}></div>
                        <div className='formGroupContainer' style={{ flex: 1 }}>
                            <Form.Group className='formGroup'>
                                <label className={'upperLabel' + (editedItem.isActive ? ' upperLabelActive' : '') + (isDirty ? ' upperLabelDirty' : '')}>{t("fileName")}</label>
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
                    </div>
                    <div className={'formGroupContainer flexStretch' + (editedItem.isActive ? ' notepadActive' : ' notepadInactive') + (isDirty ? ' notepadDirty' : '')} >
                        <Form.Group ref={scrollableRef} className='formGroup' style={{ overflow: 'auto' }} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave} onScroll={() => { rememberScrollPosition() }}>
                            <label className={'upperLabel' + (editedItem.isActive ? ' upperLabelActive' : '') + (isDirty ? ' upperLabelDirty' : '')}>{t("note")}</label>
                            <div style={{ height: 100 }}>
                                <CodeMirror
                                    value={note}
                                    spellCheck={false}
                                    ref={noteRef}
                                    theme={cdmrrorTheme}
                                    onContextMenu={(e) => {
                                        buildContextMenu(e);
                                    }}
                                    extensions={cdmrrorExtensions}
                                    onChange={onCMChange}
                                    onClick={handleActiveItemFocus}
                                />
                            </div>
                        </Form.Group>
                    </div>
                    {!isIntroduced && editedItem.isActive &&
                        <Alert className='privThingIntroduction' onClose={handleAcceptIntroduction} severity="info">
                            {t('privThingIntroduction')}
                        </Alert>
                    }
                    <div style={{ display: "flex", marginTop: 3, height: '55px' }} className='formGroupContainer'>
                        {
                            editedItem.isActive && canUpdateFileDom &&
                            <Button ref={updateFileButtonRef} className="btn-lg" disabled={!isDirty} variant='success'
                                onClick={() => {
                                    updateFile();
                                }}
                                title={t("saveToLocation") + ' ' + editedItem.path}>
                                {t("save")}
                                {canUpdateFileDom === true && isDirty === true && <div style={{ fontSize: 10, margin: '-5px 0 -5px 0' }}>{saveHotKey}</div>}
                            </Button>
                        }
                        &nbsp;
                        {
                            editedItem.isActive && isLocalStorageItem(editedItem) && <Button className="btn-lg" variant='danger' onClick={() => {
                                setAskDelete(true);
                            }}
                                title={t("delete")}>{t("delete")}</Button>
                        } &nbsp;
                        {
                            editedItem.isActive &&
                            <div style={{ display: 'none', alignItems: 'center', cursor: 'pointer' }} ref={srollTopBtn} onClick={() => {
                                scrollableRef.current?.scrollTo({ top: 0 });
                                rememberScrollPosition();
                            }}><RiArrowUpCircleLine className='h1' /></div>

                        } &nbsp;
                        {
                            editedItem.isActive && isEncrypted && <Dropdown>
                                <Dropdown.Toggle variant="default" id="dropdown-basic" className="btn-lg">
                                    <RiMenuUnfoldFill className='h2' />
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    {isEncrypted && !needSecret && <Dropdown.Item href="#/action-1" onClick={() => {
                                        setUpdateSecret(true);
                                    }}
                                    >{t("changeSecret")}</Dropdown.Item>}
                                </Dropdown.Menu>
                            </Dropdown>
                        }
                        <div style={{ flex: 1 }}>&nbsp;</div>
                        <div style={{ margin: "auto", color: "#666666", fontSize: 10 }}>
                            <div style={{ textAlign: 'center' }}>
                                {
                                    `${t('size')}: ${note.length}`
                                }
                            </div>
                            {
                                !isFullScreen &&
                                <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', justifyItems: 'center', alignContent: 'center' }}>
                                    <button className='btn btn-sm' onClick={() => { setShowFullScreen(true) }}>
                                        <FaMagnifyingGlass className='h3' />
                                        &nbsp;
                                        {t('showFullScreen')}
                                    </button>
                                </div>
                            }
                            {
                                isFullScreen &&
                                <Form.Check
                                    id="wrapWorkdsChbx"
                                    type="checkbox"
                                    label={t("wrapRows")}
                                    name="wrapWords"
                                    checked={wrapWords}
                                    className={'form-control-sm'}
                                    onChange={(e) => {
                                        handleWrappToggle()
                                    }}
                                ></Form.Check>
                            }

                        </div>
                        <div style={{ flex: 1 }}>&nbsp;</div>
                        &nbsp;
                        {
                            editedItem.isActive && <Button className="btn-lg" ref={saveToFileButtonRef} disabled={!note?.length} variant='success' onClick={() => {
                                setIsSavingAs(true);
                            }}
                                title={t("saveToSelectedLocation")}>
                                {t("saveAs")}
                                {(note?.length > 0) && (canUpdateFileDom !== true || isDirty !== true) && <div style={{ fontSize: 10, margin: '-5px 0 -5px 0' }}>{saveHotKey}</div>}
                            </Button>
                        }
                        &nbsp;
                        {
                            editedItem.isActive && <Button className="btn-lg" disabled={!isDirty} variant='danger' onClick={() => {
                                setNote(orgNote.current);
                            }}
                                title={t("rollbackItemChanges")}>{t("cancel")}</Button>
                        }
                    </div>
                </div>
            }
            {
                isSavingAs &&
                <SaveAsComp
                    fileName={fileName}
                    onSave={handleSaveAs}
                    onClose={() => { setIsSavingAs(false) }}
                />
            }
            {
                showUnsaved &&
                <ConfirmationComp
                    externalHeading={t("warning")}
                    externalSaveLabel={t("save")}
                    externalMiddleLabel={t("ignoreUnsaved")}
                    externalCloseLabel={t("cancel")}
                    externalShowMiddleButton={true}
                    handleExternalMiddle={() => {
                        setShowUnsaved(false);
                        if (editedItemCandidate) {
                            if (secret && forgetSecretMode === "IMMEDIATE") {
                                mainDispatch({ type: MAIN_ACTIONS.CLEAR_SECRET })
                            }
                            if (editedItemCandidate?.item) {
                                mainDispatch({ type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: editedItemCandidate });
                            }
                        }
                    }}
                    handleExternalSave={() => {
                        setShowUnsaved(false);
                        if (!canUpdateFile(editedItem)) {
                            setIsSavingAs(true);
                        } else {
                            updateFile(function () {
                                if (editedItemCandidate?.item) {
                                    mainDispatch({ type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: editedItemCandidate });
                                }
                            });
                        }
                    }}
                    handleExternalClose={() => { setShowUnsaved(false) }}
                >{t("unsavedChanges")}</ConfirmationComp>
            }
            {
                askRefresh &&
                <ConfirmationComp
                    externalHeading={t("question")}
                    externalSaveLabel={t("yes")}
                    externalCloseLabel={t("no")}
                    handleExternalSave={() => {
                        setAskRefresh(false);
                        mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST });
                        initializeEditedItem();
                    }}
                    handleExternalClose={() => { setAskRefresh(false) }}
                >{t("confirmRefresh")}</ConfirmationComp>
            }
            {
                askDelete &&
                <ConfirmationComp
                    externalHeading={t("pleaseConfirm")}
                    externalSaveLabel={t("yes")}
                    externalCloseLabel={t("no")}
                    handleExternalSave={handleDeleteItem}
                    handleExternalClose={() => { setAskDelete(false) }}
                >{t("confirmDelete", { item: fileName })}</ConfirmationComp>
            }
            {
                noteContextMenu.show === true &&
                <GenericContextMenuComp x={noteContextMenu.x} y={noteContextMenu.y} menuActions={noteContextMenu.menuActions} contextMenuAction={handleContextMenuAction} />
            }
            {
                showFullScreen &&
                <Modal
                    show={showFullScreen}
                    onHide={() => { setShowFullScreen(false) }}
                    backdrop="static"
                    keyboard={false}
                    fullscreen
                    aria-labelledby="contained-modal-title-vcenter"
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            {
                                fileName
                            }
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <NoteComp editedItem={editedItem} isFullScreen={true} />
                    </Modal.Body>
                    <Modal.Footer>
                        {<Button className={'btn-lg'} variant='secondary' onClick={() => { setShowFullScreen(false) }}>{t('close')}</Button>}
                    </Modal.Footer>
                </Modal>
            }
        </div>
    )
}

export default NoteComp
