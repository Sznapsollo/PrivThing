import { useState, useEffect } from 'react'
import { AppState, settingsInitialStateBaseline } from '../context/Context'
import { Modal, Button, Form, InputGroup } from 'react-bootstrap'
import ConfirmationComp from './ConfirmationComp';
import { useTranslation } from 'react-i18next'
import { removeLocalStorage, saveLocalStorage } from '../utils/utils'
import moment from 'moment';
import { MAIN_ACTIONS, SETTINGS_ACTIONS } from '../context/Reducers';


const SettingsComp = () => {

    const { t } = useTranslation();

    const { mainState, mainDispatch, settingsState, settingsDispatch } = AppState();
    const [ settings, setSettings ] = useState<any>(settingsState);
    const [ clearSettings, setClearSettings ] = useState<boolean>(false);

    useEffect(() => {
        setSettings(settingsState);
    }, [settingsState]);

    const handleClose = () => {
        mainDispatch({type: MAIN_ACTIONS.HIDE_SETTINGS});
    }

    const handleSave = () => {
        settingsDispatch({type: SETTINGS_ACTIONS.UPDATE_SETTINGS, payload: settings});
        saveLocalStorage("privthing.pmSettings", settings);
        mainDispatch({type: MAIN_ACTIONS.HIDE_SETTINGS});
        mainDispatch({type: MAIN_ACTIONS.UPDATE_ITEMS_LIST});
    }

    const handleClearSettings = () => {
        setClearSettings(false);

        removeLocalStorage("privthing.pmItemsWidth");
        removeLocalStorage("privthing.pmSaveAsType");
        removeLocalStorage("privthing.pmSearchSettings");
        removeLocalStorage("privthing.pmSettings");
        removeLocalStorage("privthing.pmTabs");
        removeLocalStorage("privthing.pmTabsDisplayMode");
        removeLocalStorage("privthing.isIntroduced");

        settingsDispatch({type: SETTINGS_ACTIONS.UPDATE_SETTINGS, payload: settingsInitialStateBaseline});

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
                {t("settings")} <span style={{fontSize: 8, color: '#cecece'}}>version: 1.0.30</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <label className='sectionLabel'>{t("passwordSettings")}</label>
                <div className='formSection'>
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
                </div>

                <div className='formSection'>
                    <Form.Group className='formGroup'>
                        <label className='upperLabel'>{t("excludeFromAll")}</label>
                        <InputGroup>
                            <Form.Control 
                                value={settings.excludeFromAll}
                                className='form-control-lg'
                                placeholder={t("excludeFromAllHint")}
                                onChange={(e) => {
                                    setSettings({...settings, excludeFromAll: e.target.value});
                                }}
                            />
                        </InputGroup>
                    </Form.Group>
                    <br/>
                    <Form.Group className='formGroup'>
                        <label className='upperLabel'>{t("codeMirrorTheme")}</label>
                        <Form.Control 
                            as="select" 
                            name="codeMirrorTheme"
                            value={settings.codeMirrorTheme}
                            className='form-control-lg'
                        onChange={(e) => {
                                setSettings({...settings, codeMirrorTheme: e.target.value});
                            }}
                        >
                            <option value="none">{'Standard'}</option>
                            <option value="customTheme">{t('customTheme')}</option>
                            <option value="amy">{'Amy'}</option>
                            <option value="ayuLight">{'Ayu Light'}</option>
                            <option value="barf">{'Barf'}</option>
                            <option value="bespin">{'Bespin'}</option>
                            <option value="birdsOfParadise">{'Birds of Paradise'}</option>
                            <option value="boysAndGirls">{'Boys and Girls'}</option>
                            <option value="clouds">{'Clouds'}</option>
                            <option value="cobalt">{'Cobalt'}</option>
                            <option value="coolGlow">{'Cool Glow'}</option>
                            <option value="dracula">{'Dracula'}</option>
                            <option value="espresso">{'Espresso'}</option>
                            <option value="noctisLilac">{'Noctis Lilac'}</option>
                            <option value="rosePineDawn">{'Rosé Pine Dawn'}</option>
                            <option value="smoothy">{'Smoothy'}</option>
                            <option value="solarizedLight">{'Solarized Light'}</option>
                            <option value="tomorrow">{'Tomorrow'}</option>
                        </Form.Control>
                    </Form.Group>
                </div>

                {
                settings.codeMirrorTheme === 'customTheme' &&
                <div className='formGroupContainer' style={{textAlign:'center', display: 'flex', flexDirection: 'row'}}>
                    <div style={{flex: 1}}>
                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeBackground')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, background: e.target.value}});
                                }} value={settings.customThemeColors.background}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeForeground')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, foreground: e.target.value}});
                                }} value={settings.customThemeColors.foreground}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeCaret')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, caret: e.target.value}});
                                }} value={settings.customThemeColors.caret}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeSelection')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, selection: e.target.value}});
                                }} value={settings.customThemeColors.selection}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeLineHighlight')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, lineHighlight: e.target.value}});
                                }} value={settings.customThemeColors.lineHighlight}></input>
                            </div>
                        </div>
                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeAttributeName')}</div>
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, attributeName: e.target.value}});
                                }} value={settings.customThemeColors.attributeName}></input>
                            </div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeGutterBackground')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, gutterBackground: e.target.value}});
                                }} value={settings.customThemeColors.gutterBackground}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeGutterForeground')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, gutterForeground: e.target.value}});
                                }} value={settings.customThemeColors.gutterForeground}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeComment')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, comment: e.target.value}});
                                }} value={settings.customThemeColors.comment}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeVariableName')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, variableName: e.target.value}});
                                }} value={settings.customThemeColors.variableName}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeBrace')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, brace: e.target.value}});
                                }} value={settings.customThemeColors.brace}></input>
                            </div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeKeyWordType')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, keyWordType: e.target.value}});
                                }} value={settings.customThemeColors.keyWordType}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeOperatorType')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, operatorType: e.target.value}});
                                }} value={settings.customThemeColors.operatorType}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeClassNameType')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, classNameType: e.target.value}});
                                }} value={settings.customThemeColors.classNameType}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeTypeName')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, typeName: e.target.value}});
                                }} value={settings.customThemeColors.typeName}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeTypeName2')}</div>
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, typeName2: e.target.value}});
                                }} value={settings.customThemeColors.typeName2}></input>
                            </div>
                        </div>
                    </div>
                    <div style={{flex: 1}}>
                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeTagName')}</div>
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, tagName: e.target.value}});
                                }} value={settings.customThemeColors.tagName}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeBoolType')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, boolType: e.target.value}});
                                }} value={settings.customThemeColors.boolType}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeNullType')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, nullType: e.target.value}});
                                }} value={settings.customThemeColors.nullType}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeNumberType')}</div>    
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, numberType: e.target.value}});
                                }} value={settings.customThemeColors.numberType}></input>
                            </div>
                        </div>

                        <div className='customThemeColorSettingContainer'>
                            <div className='customThemeColorSettingLabel'>{t('customThemeAngleBracket')}</div>
                            <div className='customThemeColorSettingInput'>
                                <input type="color" id="html5colorpicker" onChange={(e) => {
                                    setSettings({...settings, customThemeColors: {...settings.customThemeColors, angleBracket: e.target.value}});
                                }} value={settings.customThemeColors.angleBracket}></input>
                            </div>
                        </div>
                    </div>
                </div> 
                }
                
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

                <div className='formGroupContainer' style={{textAlign:'center'}}>
                    <Form.Group className='formGroup' style={{display: 'inline-block'}}>
                        <Form.Check
                            id="showHintsChbx"
                            type="checkbox"
                            label={t("showHints")}
                            name="showHints"
                            checked={settings.showHints}
                            className={'form-control-lg largeCheckbox'}
                            onChange={(e) => {
                                setSettings({...settings, showHints: e.target.checked});
                            }}
                            onClick={(e) => {
                                console.log('onclicked', e.target)
                            }}
                        ></Form.Check>
                    </Form.Group>
                </div>

                <div className='formGroupContainer' style={{textAlign:'center'}}>
                    <Form.Group className='formGroup' style={{display: 'inline-block'}}>
                        <Form.Check
                            id="stretchNoteSpaceOnActiveChbx"
                            type="checkbox"
                            label={t("stretchNoteSpaceOnActive")}
                            name="stretchNoteSpaceOnActive"
                            checked={settings.stretchNoteSpaceOnActive}
                            className={'form-control-lg largeCheckbox'}
                            onChange={(e) => {
                                setSettings({...settings, stretchNoteSpaceOnActive: e.target.checked});
                            }}
                            onClick={(e) => {
                                console.log('onclicked', e.target)
                            }}
                        ></Form.Check>
                    </Form.Group>
                </div>

                <div className='formGroupContainer' style={{textAlign:'center'}}>
                    <Form.Group className='formGroup' style={{display: 'inline-block'}}>
                        <Form.Check
                            id="enableRecentsChbx"
                            type="checkbox"
                            label={t("enableRecents")}
                            name="enableRecents"
                            checked={settings.enableRecents}
                            className={'form-control-lg largeCheckbox'}
                            onChange={(e) => {
                                setSettings({...settings, enableRecents: e.target.checked});
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
