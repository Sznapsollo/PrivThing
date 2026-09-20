import { AiOutlineLoading } from 'react-icons/ai';

import '../styles.css'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Alert, Form, Button, Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { AppState } from '../context/Context'
import SecretComp from './SecretComp';
import { AlertData, EditItem, Item, NotificationData, SaveAsResults, GenericContextMenuItem, GenericContextMenuAction, NoteContextMenu } from '../model';

import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { openSearchPanel } from '@codemirror/search';
import { getNewItem, retrieveLocalStorage, saveLocalStorage } from '../utils/utils';
import { decryptNote, encryptNote, isEncryptedNote } from '../utils/crypto';
import { CONFLICT, getProvider, localStorageItem, StorageError } from '../storage';
import { createServerFile } from '../storage/serverProvider';
import { Draft, getDraft, removeDraft, saveDraft } from '../storage/draftsStore';
import { fileNameTimestamp } from '../utils/dates';
import { MAIN_ACTIONS } from '../context/Reducers';
import { useCodeMirrorSetup } from './note/useCodeMirrorSetup';
import MarkdownPreview from './note/MarkdownPreview';
import { registerNoteText, unregisterNoteText } from './note/noteTexts';
import { isMarkdownNote } from '../utils/markdown';
import { hideRegex } from './note/hideRegex';
import NoteModals from './note/NoteModals';
import NoteToolbar from './note/NoteToolbar';

var scrollNoteHandle: ReturnType<typeof setTimeout> | null = null;
var isIntroducedGlb = retrieveLocalStorage("privthing.isIntroduced");

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
}

const NoteComp = ({ editedItem }: Props) => {

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
    const focusedPathRef = useRef<string | null>(null);
    const lastModifiedRef = useRef<number | undefined>(undefined);
    const pendingSaveRef = useRef<{ fileData: string, callback?: () => void } | null>(null);
    const [askOverwrite, setAskOverwrite] = useState<boolean>(false);
    const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const draftHandle = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const wrapWords = editedItem.wrapWords !== false;

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

    const encryptData = async (secret: string): Promise<string> => {
        return await encryptNote(note, secret)
    };

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
    }, [note]);

    const noteRefForCompare = useRef(note);
    noteRefForCompare.current = note;

    useEffect(() => {
        const spaceId = editedItem.spaceId;
        registerNoteText(spaceId, () => noteRefForCompare.current);
        return () => unregisterNoteText(spaceId)
    }, [editedItem.spaceId]);

    useEffect(() => {
        if (!editedItem.spaceId || isEncrypted || isLoading) {
            return
        }
        if (draftHandle.current != null) {
            clearTimeout(draftHandle.current);
        }
        if (note === orgNote.current) {
            removeDraft(editedItem.spaceId);
            return
        }
        const spaceId = editedItem.spaceId;
        const draftedNote = note;
        draftHandle.current = setTimeout(() => {
            saveDraft({
                spaceId: spaceId,
                path: editedItem.path || '',
                name: editedItem.name || '',
                note: draftedNote,
                savedAt: new Date().getTime()
            }).catch((e) => console.warn('Could not store the draft', e));
        }, 1500)
        return () => {
            if (draftHandle.current != null) {
                clearTimeout(draftHandle.current);
            }
        }
    }, [note, isEncrypted, isLoading, editedItem.spaceId, editedItem.path, editedItem.name]);

    useEffect(() => {
        if (!isDirty) {
            return
        }
        const warnBeforeLeaving = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', warnBeforeLeaving);
        return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
    }, [isDirty]);

    useEffect(() => {
        if (isLoading || !editedItem.isActive || focusedPathRef.current === editedItem.path) {
            return
        }
        focusedPathRef.current = editedItem.path;
        const focusHandle = setTimeout(() => {
            noteRef.current?.view?.focus();
        }, 100)
        return () => clearTimeout(focusHandle)
    }, [isLoading, editedItem.isActive, editedItem.path]);

    const initializeCompleted = () => {
        if (secretUpdateRef.current && secretUpdateRef.current.length) {
            mainDispatch({ type: MAIN_ACTIONS.UPDATE_SECRET, payload: secretUpdateRef.current });
            secretUpdateRef.current = '';
        }
    }

    const reportMissingFile = () => {
        mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, type: 'error', closeAfter: 10000, message: t('fileNotFound') + (filePath || '') } as NotificationData })
        let currentTabs = tabs.filter((tab) => tab.path !== editedItem.path);
        mainDispatch({ type: MAIN_ACTIONS.UPDATE_TABS, payload: currentTabs });
    }

    const initializeEditedItem = async () => {
        if (isUpdating.current !== true) {
            setInitialState();
        }

        let defaultFileName = fileNameTimestamp() + '_privthing.txt';
        setFilePath(editedItem.path || '');
        setFileName(editedItem.name || defaultFileName);

        if (isUpdating.current !== true) {
            // will cause flickker so no on update
            setIsLoading(true);
        }

        try {
            const result = await getProvider(editedItem).read(editedItem);
            lastModifiedRef.current = result.lastModified;
            if (result.found && result.data != null) {
                setRawNote(result.data);
            } else if (!!editedItem.path) {
                reportMissingFile();
            }
        } catch (e) {
            console.warn('Read operation error: ', e);
            mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, type: 'error', closeAfter: 10000, message: t('somethingWentWrong') + (editedItem.path || '') } as NotificationData })
        }

        setIsLoading(false);
        initializeCompleted();

        if (editedItem.spaceId && !isEncrypted) {
            const draft = await getDraft(editedItem.spaceId);
            if (draft && draft.note !== orgNote.current) {
                setPendingDraft(draft);
            }
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
        mainDispatch({ type: MAIN_ACTIONS.SET_NOTE_SPACE_WRAP, payload: { spaceId: editedItem.spaceId, wrapWords: !wrapWords } });
    }

    const handleUnsavedIgnore = () => {
        setShowUnsaved(false);
        if (editedItemCandidate) {
            if (secret && forgetSecretMode === "IMMEDIATE") {
                mainDispatch({ type: MAIN_ACTIONS.CLEAR_SECRET })
            }
            if (editedItemCandidate?.item) {
                mainDispatch({ type: MAIN_ACTIONS.SET_EDITED_ITEM, payload: editedItemCandidate });
            }
        }
    }

    const handleUnsavedSave = () => {
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
    }

    const handleRefreshConfirm = () => {
        setAskRefresh(false);
        mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST });
        initializeEditedItem();
    }

    const handleReloadFromDisk = () => {
        setAskOverwrite(false);
        pendingSaveRef.current = null;
        isUpdating.current = false;
        initializeEditedItem();
    }

    const handleOverwriteAnyway = async () => {
        setAskOverwrite(false);
        const pending = pendingSaveRef.current;
        pendingSaveRef.current = null;
        if (!pending) {
            return
        }

        try {
            const written = await getProvider(editedItem).write(editedItem, pending.fileData, undefined);
            lastModifiedRef.current = written.lastModified;
        } catch (e) {
            mainDispatch({ type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: { show: true, header: t("error"), message: t("dataNotSaved") } as AlertData })
            return
        }

        markSaved();
        mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST });
        mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 3000, message: t('dataSaved') } as NotificationData })

        if (pending.callback) {
            pending.callback();
        }
    }

    const markSaved = () => {
        orgNote.current = note;
        setIsDirty(false);
        if (editedItem.spaceId) {
            removeDraft(editedItem.spaceId);
        }
    }

    const handleRestoreDraft = () => {
        if (pendingDraft) {
            setNote(pendingDraft.note);
        }
        setPendingDraft(null);
    }

    const handleDiscardDraft = () => {
        if (editedItem.spaceId) {
            removeDraft(editedItem.spaceId);
        }
        setPendingDraft(null);
    }

    const handleSaveAs = async (saveResults: SaveAsResults): Promise<void> => {
        if (!canSaveFile(saveResults)) {
            return
        }

        const fileData = (saveResults.encryptData && saveResults.secret)
            ? await encryptData(saveResults.secret)
            : note;

        if (saveResults.saveAsType === "LOCAL_STORAGE") {

            // check if there is some with this name
            let alreadyExistingItem = items.find((item) => {
                return item.folder === "localStorage" && item.name === saveResults.fileName
            })
            if (alreadyExistingItem) {
                mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, type: 'error', closeAfter: 3000, message: t('itemXAlreadyExists', { item: saveResults.fileName }) } as AlertData })
                return
            }

            if (!await saveToLocalStorage(saveResults.fileName, fileData)) {
                setIsSavingAs(false);
                return
            }
            markSaved();
            mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST, payload: "localStorage/" + saveResults.fileName });
            mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 3000, message: t('dataSaved') } as NotificationData })
        } else if (saveResults.saveAsType === "SERVER_FOLDER" && saveResults.folder) {
            try {
                const newPath = await createServerFile(saveResults.folder, saveResults.fileName, fileData);
                markSaved();
                mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST, payload: newPath });
                mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 3000, message: t('dataSaved') } as NotificationData })
            } catch (e) {
                mainDispatch({ type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: { show: true, header: t("error"), message: t("dataNotSaved") } as AlertData })
                setIsSavingAs(false);
                return
            }
        } else {
            saveToFile(saveResults.fileName, fileData);
        }
        setIsSavingAs(false);
    }

    const handleDeleteItem = async () => {
        setAskDelete(false)
        if (!getProvider(editedItem).canDelete) {
            return
        }

        try {
            await getProvider(editedItem).remove(editedItem);
            mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST });
            var currTab = tabs.find((tab) => {
                return tab.path === filePath && tab.isActive === true
            })
            if (currTab) {
                mainDispatch({ type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: { item: getNewItem(), tab: currTab, action: 'REMOVE_TAB' } });
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

    const showSaveFailed = () => {
        mainDispatch({ type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: { show: true, header: t("error"), message: t("dataNotSaved") } as AlertData })
    }

    const saveToLocalStorage = async (fileNameLoc: string, fileData: string): Promise<boolean> => {
        try {
            await getProvider(localStorageItem(fileNameLoc)).write(localStorageItem(fileNameLoc), fileData);
            return true
        } catch (e) {
            showSaveFailed();
            return false
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

        return getProvider(item).canWrite
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

    const updateFile = async (callback?: () => void) => {
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

        const fileData = isEncrypted ? await encryptData(secretLoc) : note;

        try {
            const written = await getProvider(editedItem).write(editedItem, fileData, lastModifiedRef.current);
            lastModifiedRef.current = written.lastModified;
        } catch (e) {
            console.warn('Write operation error: ', e);
            if ((e as StorageError)?.code === CONFLICT) {
                pendingSaveRef.current = { fileData: fileData, callback: callback };
                setAskOverwrite(true);
                return
            }
            mainDispatch({ type: MAIN_ACTIONS.SHOW_ALERT_MODAL, payload: { show: true, header: t("error"), message: t("dataNotSaved") } as AlertData })
            return
        }

        markSaved();
        mainDispatch({ type: MAIN_ACTIONS.UPDATE_ITEMS_LIST });
        mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 3000, message: t('dataSaved') } as NotificationData })

        if (callback) {
            callback();
        } else {
            isUpdating.current = true;
            initializeEditedItem();
        }
    }

    const decryptData = async () => {
        let data: string | undefined;
        let rawData = rawNote.current;
        let encrypted = false;
        try {
            encrypted = isEncryptedNote(rawData, editedItem.name);

            if (encrypted === true) {
                setIsEncrypted(true);

                if (!secret) {
                    giveMeSecret("", "");
                    return
                }

                data = await decryptNote(rawData, secret);
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
                    if (firstPart.endsWith('\r\n')) {
                        firstPart = firstPart.substring(0, firstPart.length - 2);
                    } else if (firstPart.endsWith('\n')) {
                        firstPart = firstPart.substring(0, firstPart.length - 1);
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

    const copyClickedValue = (copiedText: string, copyMessage: string = 'lineCopiedToClipboard') => {
        onTriggerBlinkingBorder();
        let markedText = (copiedText || '').toString();
        navigator.clipboard.writeText(markedText);
        mainDispatch({ type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: { show: true, closeAfter: 5000, message: t(copyMessage) } as NotificationData })
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
    const canPreview = isMarkdownNote(fileName);

    const { codeMirrorTheme: cdmrrorTheme, codeMirrorExtensions: cdmrrorExtensions } = useCodeMirrorSetup({
        fileName: fileName,
        themeName: codeMirrorTheme,
        customThemeColors: customThemeColors,
        wrapWords: wrapWords,
        copyClickedValue: copyClickedValue,
        buildContextMenu: buildContextMenu
    });

    const noteBody = (
        <div className='noteContainer'>
            {
                isLoading &&
                <div style={{ width: "100%", height: "100%", display: "table" }}>
                    <div style={{ display: "table-cell", verticalAlign: "middle", textAlign: 'center' }}>
                        <AiOutlineLoading className='h2 loading-icon' /> &nbsp;{t("inProgress")}
                    </div>
                </div>
            }
            {
                needSecret && <>
                    <SecretComp cssClass={(editedItem.isActive ? 'notepadActive' : 'notepadInactive') + ' secretPane'} globalClick={handleActiveItemFocus} confirm={false} warning={needSecretMeta.warning} info={needSecretMeta.info || t("providePasswordToOpenDecryptedFile")} handleSubmit={handleSecretSubmit} />
                    <div style={{ display: "flex", marginTop: 3, height: '55px' }} className='formGroupContainer'>
                        {
                            editedItem.isActive && getProvider(editedItem).canDelete && <Button className="btn-lg" variant='danger' onClick={() => {
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
                    <div className={'formGroupContainer flexStretch' + (editedItem.isActive ? ' notepadActive' : ' notepadInactive') + (isDirty ? ' notepadDirty' : '') + (showPreview && canPreview ? ' noteWithPreview' : '')} >
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
                        {showPreview && canPreview && <MarkdownPreview note={note} />}
                    </div>
                    {!isIntroduced && editedItem.isActive &&
                        <Alert className='privThingIntroduction' variant="info" dismissible onClose={handleAcceptIntroduction}>
                            {t('privThingIntroduction')}
                        </Alert>
                    }
                    <NoteToolbar
                        isActive={editedItem.isActive === true}
                        filePath={editedItem.path}
                        canUpdateFile={canUpdateFileDom === true}
                        canDelete={getProvider(editedItem).canDelete}
                        isDirty={isDirty}
                        isEncrypted={isEncrypted}
                        needSecret={needSecret}
                        noteLength={note.length}
                        saveHotKey={saveHotKey}
                        showFullScreen={showFullScreen}
                        wrapWords={wrapWords}
                        updateFileButtonRef={updateFileButtonRef}
                        saveToFileButtonRef={saveToFileButtonRef}
                        scrollTopButtonRef={srollTopBtn}
                        onSave={() => { updateFile() }}
                        onDelete={() => { setAskDelete(true) }}
                        onScrollTop={() => {
                            scrollableRef.current?.scrollTo({ top: 0 });
                            rememberScrollPosition();
                        }}
                        onChangeSecret={() => { setUpdateSecret(true) }}
                        onShowFullScreen={() => { setShowFullScreen(true) }}
                        onWrapToggle={handleWrappToggle}
                        canPreview={canPreview}
                        showPreview={showPreview}
                        onPreviewToggle={() => { setShowPreview(!showPreview) }}
                        onSaveAs={() => { setIsSavingAs(true) }}
                        onRollback={() => { setNote(orgNote.current) }}
                    />
                </div>
            }
            <NoteModals
                fileName={fileName}
                isSavingAs={isSavingAs}
                onSaveAs={handleSaveAs}
                onCloseSaveAs={() => { setIsSavingAs(false) }}
                showUnsaved={showUnsaved}
                onUnsavedSave={handleUnsavedSave}
                onUnsavedIgnore={handleUnsavedIgnore}
                onUnsavedClose={() => { setShowUnsaved(false) }}
                askRefresh={askRefresh}
                onRefresh={handleRefreshConfirm}
                onRefreshClose={() => { setAskRefresh(false) }}
                askDelete={askDelete}
                onDelete={handleDeleteItem}
                onDeleteClose={() => { setAskDelete(false) }}
                askOverwrite={askOverwrite}
                onOverwrite={handleOverwriteAnyway}
                onReloadFromDisk={handleReloadFromDisk}
                onOverwriteClose={() => { setAskOverwrite(false); pendingSaveRef.current = null; }}
                noteContextMenu={noteContextMenu}
                onContextMenuAction={handleContextMenuAction}
                pendingDraft={pendingDraft}
                onRestoreDraft={handleRestoreDraft}
                onDiscardDraft={handleDiscardDraft}
            />
        </div>
    )

    if (showFullScreen) {
        return (
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
                    {noteBody}
                </Modal.Body>
                <Modal.Footer>
                    {<Button className={'btn-lg'} variant='secondary' onClick={() => { setShowFullScreen(false) }}>{t('close')}</Button>}
                </Modal.Footer>
            </Modal>
        )
    }

    return noteBody
}

export default NoteComp
