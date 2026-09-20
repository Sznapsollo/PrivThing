import ConfirmationComp from '../ConfirmationComp';
import GenericContextMenuComp from '../GenericContextMenuComp';
import SaveAsComp from '../SaveAsComp';
import { useTranslation } from 'react-i18next';
import { GenericContextMenuAction, NoteContextMenu, SaveAsResults } from '../../model';
import { Draft } from '../../storage/draftsStore';

interface Props {
    fileName: string,
    isSavingAs: boolean,
    onSaveAs: (saveResults: SaveAsResults) => void,
    onCloseSaveAs: () => void,
    showUnsaved: boolean,
    onUnsavedSave: () => void,
    onUnsavedIgnore: () => void,
    onUnsavedClose: () => void,
    askRefresh: boolean,
    onRefresh: () => void,
    onRefreshClose: () => void,
    askDelete: boolean,
    onDelete: () => void,
    onDeleteClose: () => void,
    askOverwrite: boolean,
    onOverwrite: () => void,
    onReloadFromDisk: () => void,
    onOverwriteClose: () => void,
    noteContextMenu: NoteContextMenu,
    onContextMenuAction: (menuAction: GenericContextMenuAction) => void,
    pendingDraft: Draft | null,
    onRestoreDraft: () => void,
    onDiscardDraft: () => void
}

const NoteModals = ({
    fileName,
    isSavingAs, onSaveAs, onCloseSaveAs,
    showUnsaved, onUnsavedSave, onUnsavedIgnore, onUnsavedClose,
    askRefresh, onRefresh, onRefreshClose,
    askDelete, onDelete, onDeleteClose,
    askOverwrite, onOverwrite, onReloadFromDisk, onOverwriteClose,
    noteContextMenu, onContextMenuAction,
    pendingDraft, onRestoreDraft, onDiscardDraft
}: Props) => {

    const { t } = useTranslation();

    return (
        <>
            {
                isSavingAs &&
                <SaveAsComp
                    fileName={fileName}
                    onSave={onSaveAs}
                    onClose={onCloseSaveAs}
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
                    handleExternalMiddle={onUnsavedIgnore}
                    handleExternalSave={onUnsavedSave}
                    handleExternalClose={onUnsavedClose}
                >{t("unsavedChanges")}</ConfirmationComp>
            }
            {
                askRefresh &&
                <ConfirmationComp
                    externalHeading={t("question")}
                    externalSaveLabel={t("yes")}
                    externalCloseLabel={t("no")}
                    handleExternalSave={onRefresh}
                    handleExternalClose={onRefreshClose}
                >{t("confirmRefresh")}</ConfirmationComp>
            }
            {
                askDelete &&
                <ConfirmationComp
                    externalHeading={t("pleaseConfirm")}
                    externalSaveLabel={t("yes")}
                    externalCloseLabel={t("no")}
                    handleExternalSave={onDelete}
                    handleExternalClose={onDeleteClose}
                >{t("confirmDelete", { item: fileName })}</ConfirmationComp>
            }
            {
                askOverwrite &&
                <ConfirmationComp
                    externalHeading={t("warning")}
                    externalSaveLabel={t("overwriteAnyway")}
                    externalSaveButtonVariant={'danger'}
                    externalShowMiddleButton={true}
                    externalMiddleLabel={t("reloadFromDisk")}
                    externalMiddleButtonVariant={'primary'}
                    externalCloseLabel={t("cancel")}
                    externalCloseButtonVariant={'secondary'}
                    handleExternalSave={onOverwrite}
                    handleExternalMiddle={onReloadFromDisk}
                    handleExternalClose={onOverwriteClose}
                >{t("fileChangedOnDisk")}</ConfirmationComp>
            }
            {
                pendingDraft &&
                <ConfirmationComp
                    externalHeading={t("draftFound")}
                    externalSaveLabel={t("restoreDraft")}
                    externalCloseLabel={t("discardDraft")}
                    externalCloseButtonVariant={'secondary'}
                    handleExternalSave={onRestoreDraft}
                    handleExternalClose={onDiscardDraft}
                >{t("draftFoundInfo", { when: new Date(pendingDraft.savedAt).toLocaleString() })}</ConfirmationComp>
            }
            {
                noteContextMenu.show === true &&
                <GenericContextMenuComp x={noteContextMenu.x} y={noteContextMenu.y} menuActions={noteContextMenu.menuActions} contextMenuAction={onContextMenuAction} />
            }
        </>
    )
}

export default NoteModals;
