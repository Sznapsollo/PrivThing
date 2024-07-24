import { useEffect, useState, useRef } from 'react'
import { Navbar, Container, Nav, Dropdown, Button, Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'
import i18n from '../i18n';
import { Link } from 'react-router-dom'
import { AppState } from '../context/Context'
import { LiaFilterSolid } from 'react-icons/lia';
import { RxCross2 } from 'react-icons/rx';
import { FiMenu } from 'react-icons/fi';
import { AlertData, ProcessingResult } from '../model';
import ConfirmationComp from './ConfirmationComp';
import moment from 'moment';
import '../styles.css';
import { retrieveLocalStorage, saveLocalStorage } from '../utils/utils';
import ResultsComp from './ResultsComp';
import { MAIN_ACTIONS, SEARCH_ACTIONS } from '../context/Reducers';

let forgetSecretTimeThreshold: Date | undefined = undefined;
let forgetTimer: ReturnType<typeof setTimeout> | null, forgetDebounceTimer: ReturnType<typeof setTimeout> | null, countDownTimer: ReturnType<typeof setInterval> | null;

const HeaderComp = () => {

    const events = [
        "load",
        "mousemove",
        "mousedown",
        "click",
        "scroll",
        "keypress",
    ];

    let currentLanguageFlag
    if(i18n?.language?.startsWith('pl')) {
        currentLanguageFlag = 'pl.png';
    } else if(i18n?.language?.startsWith('de')) {
        currentLanguageFlag = 'de.png';
    } else {
        currentLanguageFlag = 'en.png';
    }

    const { t } = useTranslation();
    const { searchState, mainState, mainDispatch, searchDispatch, settingsState: {forgetSecretMode, forgetSecretTime} } = AppState();
    const [ processingResult , setProcessingResult ] = useState<ProcessingResult[]>([])
    const [ showProcessingResult, setShowProcessingResult ] = useState(false);
    const [ showAbout, setShowAbout ] = useState(false);
    const centerLabelref = useRef<HTMLDivElement>(null);

    const handleForgetSecret = () => {
        if(!mainState.secret?.length) {
            return
        }
        resetTimer();
        clearEvents();
        mainDispatch({type: MAIN_ACTIONS.CLEAR_SECRET});
    }

    useEffect(() => {
        // console.log('secret changed')
        if(mainState.secret) {
            Object.values(events).forEach((item) => {
                if(forgetSecretMode === 'AFTER_TIME') {
                    window.removeEventListener(item, eventListenersPackage);
                    window.addEventListener(item, eventListenersPackage);
                } 
            });
        } else {
            resetTimer();
            clearEvents();
            setCenterLabelContent('');
        }
        return () => {
            resetTimer();
            clearEvents();
        }
    }, [mainState.secret]);

    const setCenterLabelContent = (labelContent: string): void => {
        if(centerLabelref.current) {
            centerLabelref.current.innerHTML = labelContent;
        }
    }

    const eventListenersPackage = () => {
        if(mainState?.secret) {
            setCenterLabelContent(t("forgetPassword"));
        }
        resetTimer();
        forgetDebounceTimer = setTimeout(() => {
            forgetDebounceTimer = null
            handleLogoutTimer();
        }, 200); 
    }
    
    const clearEvents = () => {
        Object.values(events).forEach((item) => {
            window.removeEventListener(item, eventListenersPackage);
        });
    }

    const handleLogoutTimer = () => {
        forgetSecretTimeThreshold = new Date(new Date().getTime() + forgetSecretTime);
        if (forgetTimer != null) { clearTimeout(forgetTimer); };
        forgetTimer = setTimeout(() => {
          resetTimer();
          clearEvents();
          handleForgetSecret();
        }, forgetSecretTime);
        if (countDownTimer != null) { clearInterval(countDownTimer); };
        countDownTimer = setInterval(() => {
            updateForgetSecretInfo();
        }, 1000)
    };

    const resetTimer = () => {
        if(forgetDebounceTimer) {clearTimeout(forgetDebounceTimer);}
        if (forgetTimer != null) { clearTimeout(forgetTimer); };
        if (countDownTimer != null) { clearInterval(countDownTimer); };
    };

    const updateForgetSecretInfo = () => {
        if(!forgetSecretTimeThreshold) {
            return
        }
        var timeDiff = forgetSecretTimeThreshold.getTime() - new Date().getTime();
        let msg = 'Password will expire in ' + formatDate(new Date(timeDiff), "mm:ss") + '<br>' + t("forgetPassword");
        setCenterLabelContent(msg);
    }

    const formatDate = (value: Date | undefined, format: string): string => {
		if(!value) {
            return ''
        }
        try {
			return moment(value).format(format)
		} catch(e) {
			console.warn('format date')
		}
		return ''
	}

    const handleExportLocalStorageItems = () => {
        let localStorageFilesData = retrieveLocalStorage('privthing.files') || {};

        const blob = new Blob([JSON.stringify(localStorageFilesData)], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = moment().format('MMMM_Do_YYYY_h_mm_ss') + '_privthing_backup.txt';
        link.href = url;
        
        link.click();
    }

    const handleImportLocalStorageItems = () => {
        try {
            var input = document.createElement('input');
            input.type = 'file';
            input.onchange = (e: any) => { 
                try {
                    let results:ProcessingResult[] = [];
                    if(e.target?.value) {
                        var file = e.target.files[0]; 
                        var reader = new FileReader();
                        reader.onload = function(event:any) {
                            // The file's text will be printed here
                            let currentLocalStorage = retrieveLocalStorage('privthing.files') || {};
                            let importedLocalStorage = JSON.parse(event.target.result)
                            for(let storageItem in importedLocalStorage) {
                                if(currentLocalStorage[storageItem] != null) {
                                    results.push({name: storageItem, result: t('itemAlreadyExists'), status: -1});
                                } else {
                                    results.push({name: storageItem, result: t('itemImported'), status: 0});
                                    currentLocalStorage[storageItem] = importedLocalStorage[storageItem];
                                }
                            }
                            let okResult = results.find((resultItem => resultItem.status === 0))
                            if(okResult) {
                                saveLocalStorage('privthing.files', currentLocalStorage);
                                mainDispatch({type: MAIN_ACTIONS.UPDATE_ITEMS_LIST});
                            }
                            setProcessingResult(results);
                            setShowProcessingResult(true);
                        };
                    
                        reader.readAsText(file);
                    }
                } catch(e) {
                    console.warn('localStorage handleImportLocalStorageItems operation error: ', e);
                    mainDispatch({type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: {show: true, type: 'error', closeAfter: 10000, message: t('somethingWentWrong') + e} as AlertData})
                }
            }

            input.click();
        } catch(e) {
            console.warn('localStorage handleImportLocalStorageItems operation error #2: ', e);
            mainDispatch({type: MAIN_ACTIONS.SHOW_NOTIFICATION, payload: {show: true, type: 'error', closeAfter: 10000, message: t('somethingWentWrong') + e} as AlertData})
        }
    }

    const handleLanguageChange = (language: string) => {
        i18n.changeLanguage(language);
        saveLocalStorage("privthing.userLanguage", language);
    }

    return (
        <>
            <Navbar bg="dark" variant="dark" style={{height: 50}}>
                <Container className='brandContainer'>
                    <Navbar.Brand>
                        <Link to="/">
                            <div style={{display: 'flex', flexDirection: 'row'}}>
                                <div style={{paddingTop: 3}}><i><img src={process.env.PUBLIC_URL + "/images/privThingIco.png"} width="30" height="30" className="imageRotateHorizontal d-inline-block align-top" alt="" /></i></div>
                                <div className='navbarTitle'>
                                    <div>{t("privThing")}</div>
                                    <div style={{fontSize: 10, color: '#ffffff80', margin: '-4px 0 0 0'}}>{t('privThingMemo')}</div>
                                </div>
                            </div>
                        </Link>
                    </Navbar.Brand>
                </Container>
                <Container fluid={true}>
                    <span style={{flex: 1}} className="dummyHeaderSpacer smallScreenHeaderItem">&nbsp;</span>
                    <Button className='btn-sm showItemsButton' variant="light" onClick={() => {
                        mainDispatch({type: MAIN_ACTIONS.TOGGLE_ITEMS_BAR});
                    }}><LiaFilterSolid style={{marginBottom: -1}} className='h2'/></Button>
                    <span style={{flex: 1}} className="dummyHeaderSpacer bigScreenHeaderItem">&nbsp;</span>
                    <Navbar.Text style={{flex: 1}} className='search bigScreenHeaderItem'>
                        <Form.Group className='formGroup'>
                            <InputGroup>
                                {
                                    searchState.searchQuery && 
                                    <InputGroup.Text 
                                        className="clearInput" 
                                        onClick={(e) => {
                                            searchDispatch({type: SEARCH_ACTIONS.FILTER_BY_SEARCH, payload: {
                                                searchQuery: '',
                                                searchContent: searchState.searchContent === true,
                                            }});
                                        }
                                    }><RxCross2/></InputGroup.Text>
                                }
                                <Form.Control 
                                    placeholder={t("startTypingToFilterFiles")} 
                                    value={searchState.searchQuery}
                                    onFocus={(event) => event.target.select()}
                                    className={'form-control-lg m-auto ' + ((searchState.searchQuery.length > 0) ? 'filledInput' : '')}
                                    onChange={(e) =>
                                        {
                                            searchDispatch({
                                                type: SEARCH_ACTIONS.FILTER_BY_SEARCH, 
                                                payload: {
                                                    searchQuery: e.target.value,
                                                    searchContent: searchState.searchContent === true,
                                                }
                                            });
                                    
                                        }
                                    }
                                />
                                {<InputGroup.Checkbox title={t('searchContent')} 
                                    checked={searchState.searchContent} 
                                    className="clearInput" 
                                    onChange={(e) => {
                                        searchDispatch({
                                            type: SEARCH_ACTIONS.FILTER_BY_SEARCH, 
                                            payload: {
                                                searchQuery: searchState.searchQuery,
                                                searchContent: e.target.checked === true,
                                            }
                                        });
                                    }
                                }></InputGroup.Checkbox>}
                                {
                                    searchState.searchQuery && 
                                    <InputGroup.Text 
                                        className="clearInput" 
                                        onClick={(e) => {
                                            searchDispatch({type: SEARCH_ACTIONS.FILTER_BY_SEARCH, payload: {
                                                searchQuery: '',
                                                searchContent: searchState.searchContent === true,
                                            }});
                                        }
                                    }><RxCross2/></InputGroup.Text>
                                }
                            </InputGroup>
                            
                        </Form.Group>
                    </Navbar.Text>
                    <div className='navLink' onClick={handleForgetSecret} ref={centerLabelref}></div>
                    <Nav>
                        <Dropdown>
                            <Dropdown.Toggle variant="dark">
                            <img src={process.env.PUBLIC_URL + "/images/flags/" + currentLanguageFlag} className="" alt={currentLanguageFlag} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className='dropdown-menu-end'>
                                <Dropdown.Item style={{textAlign: 'center'}} onClick={() => handleLanguageChange('pl')}>
                                    <img src={process.env.PUBLIC_URL + "/images/flags/pl.png"} className="" alt="pl flag" />&nbsp;&nbsp;-&nbsp;&nbsp;pl
                                </Dropdown.Item>
                                <Dropdown.Item style={{textAlign: 'center'}} onClick={() => handleLanguageChange('de')}>
                                    <img src={process.env.PUBLIC_URL + "/images/flags/de.png"} className="" alt="de flag" />&nbsp;&nbsp;-&nbsp;&nbsp;de
                                </Dropdown.Item>
                                <Dropdown.Item style={{textAlign: 'center'}} onClick={() => handleLanguageChange('en')}>
                                    <img src={process.env.PUBLIC_URL + "/images/flags/en.png"} className="" alt="en flag" />&nbsp;&nbsp;-&nbsp;&nbsp;en
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                    <Nav>
                        <Dropdown>
                            <Dropdown.Toggle variant="dark">
                                <FiMenu fontSize="25px" />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className='dropdown-menu-end'>
                                <Dropdown.Item onClick={() => {
                                    mainDispatch({type: MAIN_ACTIONS.SHOW_SETTINGS});
                                }}>{t("settings")}</Dropdown.Item>
                                <Dropdown.Item onClick={handleExportLocalStorageItems}>{t("exportLocalStorageItems")}</Dropdown.Item>
                                <Dropdown.Item onClick={handleImportLocalStorageItems}>{t("importLocalStorageItems")}</Dropdown.Item>
                                <Dropdown.Item onClick={() => setShowAbout(true)}>{t("aboutPrivThing")}</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Container>
            </Navbar>
            {
                showProcessingResult && 
                <ResultsComp 
                    results={processingResult}
                    onClose={ () => {
                        setShowProcessingResult(false); 
                        setProcessingResult([]);
                    }}
                />
            }
            {
                showAbout &&
                <ConfirmationComp
                    externalHeading={t("aboutPrivThing")}
                    externalSaveLabel={t("ok")}
                    externalShowCloseButton={false}
                    canScroll={true}
                    handleExternalSave={()=>setShowAbout(false)}
                    handleExternalClose={()=>setShowAbout(false)}
                >
                    <div style={{padding: 20, fontSize: 14}}>
                        PrivThing is a tool to manage notes. Provides some nice features listed below to better organize my work.
                        <br/><br/>
                        <ul>
                            <li>Tabs that can be reordered, and that are remembered</li>
                            <li>Hotkeys: ctrl+f, ctrl+s, cmd+s</li>
                            <li>Encrypt some more fragile notes with passwords (just dont forget it - passwords are not stored anywhere so no way to remind it)</li>
                            <li>Very nice CodeMirror editor which comes with many perks like code marking, search, line numbers etc</li>
                            <li>Slider between items and note body</li>
                            <li>Search & sort features</li>
                            <li>If you host it on some local server it provides quick access to files from different folders</li>
                            <li>Export & Import of local storage items</li>
                            <li>...</li>
                        </ul>
                        <br/><br/>
                        It is Open Source. Check it on GitHub - <a href="https://github.com/Sznapsollo/PrivThing" target="_blank">https://github.com/Sznapsollo/PrivThing</a>
                        <br/><br/>
                        I have always some list of things that I want to add here. I usually come up with them when I use this tool and something is missing. 
                        On GitHub there is a todo file committed with such points.
                        I am always open to suggestions and happy when some feature comes to mind that will speed things up.
                        <br/><br/>
                        I you have some ideas please share on Git or <a href="mailto: office@webproject.waw.pl">Email me</a>.
                        <br/><br/>
                        Have nice day,
                        NJ
                    </div>
                </ConfirmationComp>
            }
        </>
    )
}

export default HeaderComp
