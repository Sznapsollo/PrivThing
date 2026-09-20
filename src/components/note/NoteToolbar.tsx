import { RefObject } from 'react';
import { Button, Dropdown, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaEye, FaMagnifyingGlass } from 'react-icons/fa6';
import { RiArrowUpCircleLine, RiMenuUnfoldFill } from 'react-icons/ri';

interface Props {
    isActive: boolean,
    filePath: string,
    canUpdateFile: boolean,
    canDelete: boolean,
    isDirty: boolean,
    isEncrypted: boolean,
    needSecret: boolean,
    noteLength: number,
    saveHotKey: string,
    showFullScreen: boolean,
    wrapWords: boolean,
    updateFileButtonRef: RefObject<HTMLButtonElement>,
    saveToFileButtonRef: RefObject<HTMLButtonElement>,
    scrollTopButtonRef: RefObject<HTMLDivElement>,
    onSave: () => void,
    onDelete: () => void,
    onScrollTop: () => void,
    onChangeSecret: () => void,
    onShowFullScreen: () => void,
    onWrapToggle: () => void,
    canPreview: boolean,
    showPreview: boolean,
    onPreviewToggle: () => void,
    onSaveAs: () => void,
    onRollback: () => void
}

const NoteToolbar = ({
    isActive, filePath, canUpdateFile, canDelete, isDirty, isEncrypted, needSecret,
    noteLength, saveHotKey, showFullScreen, wrapWords,
    updateFileButtonRef, saveToFileButtonRef, scrollTopButtonRef,
    onSave, onDelete, onScrollTop, onChangeSecret, onShowFullScreen, onWrapToggle,
    canPreview, showPreview, onPreviewToggle,
    onSaveAs, onRollback
}: Props) => {

    const { t } = useTranslation();

    return (
            <div style={{ display: "flex", marginTop: 3, height: '55px' }} className='formGroupContainer'>
                {
                    isActive && canUpdateFile &&
                    <Button ref={updateFileButtonRef} className="btn-lg" disabled={!isDirty} variant='success'
                        onClick={onSave}
                        title={t("saveToLocation") + ' ' + filePath}>
                        {t("save")}
                        {canUpdateFile && isDirty && <div style={{ fontSize: 10, margin: '-5px 0 -5px 0' }}>{saveHotKey}</div>}
                    </Button>
                }
                &nbsp;
                {
                    isActive && canDelete && <Button className="btn-lg" variant='danger' onClick={onDelete}
                        title={t("delete")}>{t("delete")}</Button>
                } &nbsp;
                {
                    isActive &&
                    <div style={{ display: 'none', alignItems: 'center', cursor: 'pointer' }} ref={scrollTopButtonRef} onClick={onScrollTop}><RiArrowUpCircleLine className='h1' /></div>

                } &nbsp;
                {
                    isActive && isEncrypted && <Dropdown>
                        <Dropdown.Toggle variant="default" id="dropdown-basic" className="btn-lg">
                            <RiMenuUnfoldFill className='h2' />
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            {isEncrypted && !needSecret && <Dropdown.Item href="#/action-1" onClick={onChangeSecret}
                            >{t("changeSecret")}</Dropdown.Item>}
                        </Dropdown.Menu>
                    </Dropdown>
                }
                <div style={{ flex: 1 }}>&nbsp;</div>
                <div style={{ margin: "auto", color: "#666666", fontSize: 10 }}>
                    <div style={{ textAlign: 'center' }}>
                        {
                            `${t('size')}: ${noteLength}`
                        }
                    </div>
                    <div className='noteToolbarExtras'>
                    {
                        canPreview &&
                        <button className='btn btn-sm' onClick={onPreviewToggle}>
                            <FaEye className='h3' />
                            &nbsp;
                            {showPreview ? t('hidePreviewMD') : t('showPreviewMD')}
                        </button>
                    }
                    {
                        !showFullScreen &&
                        <div className='bigScreenItem' style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', justifyItems: 'center', alignContent: 'center' }}>
                            <button className='btn btn-sm' onClick={onShowFullScreen}>
                                <FaMagnifyingGlass className='h3' />
                                &nbsp;
                                {t('showFullScreen')}
                            </button>
                        </div>
                    }
                    {
                        <Form.Check
                            id={'wrapWordsChbx' + (showFullScreen ? 'FullScreen' : '')}
                            type="checkbox"
                            label={t("wrapRows")}
                            name="wrapWords"
                            checked={wrapWords}
                            className={'form-control-sm'}
                            onChange={onWrapToggle}
                        ></Form.Check>
                    }
                    </div>

                </div>
                <div style={{ flex: 1 }}>&nbsp;</div>
                &nbsp;
                {
                    isActive && <Button className="btn-lg" ref={saveToFileButtonRef} disabled={!noteLength} variant='success' onClick={onSaveAs}
                        title={t("saveToSelectedLocation")}>
                        {t("saveAs")}
                        {(noteLength > 0) && (!canUpdateFile || !isDirty) && <div style={{ fontSize: 10, margin: '-5px 0 -5px 0' }}>{saveHotKey}</div>}
                    </Button>
                }
                &nbsp;
                {
                    isActive && <Button className="btn-lg" disabled={!isDirty} variant='danger' onClick={onRollback}
                        title={t("rollbackItemChanges")}>{t("cancel")}</Button>
                }
            </div>
    )
}

export default NoteToolbar;
