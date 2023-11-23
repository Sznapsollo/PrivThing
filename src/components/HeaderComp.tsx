import { useEffect, useState, useRef } from 'react'
import { Navbar, Container, Nav, Dropdown, Button, Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AppState } from '../context/Context'
import { FiPlusCircle } from 'react-icons/fi';
import { LiaFilterSolid } from 'react-icons/lia';
import { CiUndo } from 'react-icons/ci';
import { FiMenu } from 'react-icons/fi';
import { Item } from '../model';
import moment from 'moment';
import '../styles.css';
import { getNewItem } from '../utils/utils';

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

    const { t } = useTranslation();
    const { searchState, mainState, mainDispatch, searchDispatch, settingsState: {forgetSecretMode, forgetSecretTime} } = AppState();
    const centerLabelref = useRef<HTMLDivElement>(null);

    const handleForgetSecret = () => {
        if(!mainState.secret?.length) {
            return
        }
        resetTimer();
        clearEvents();
        mainDispatch({type: 'CLEAR_SECRET'});
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


    return (
        <Navbar bg="dark" variant="dark" style={{height: 40}}>
            <Container className='brandContainer'>
                <Navbar.Brand>
                    <Link to="/">{t("privThing")}</Link>
                </Navbar.Brand>
            </Container>
            <Container fluid={true}>
                <Button className='btn-sm showItemsButton' variant="light" onClick={() => {
                    mainDispatch({type: "TOGGLE_ITEMS_BAR"});
                }}><LiaFilterSolid style={{marginBottom: -1}} className='h2'/></Button>
                <span style={{flex: 1}} className="dummyHeaderSpacer bigScreenItem">&nbsp;</span>
                <Navbar.Text style={{flex: 1}} className='search bigScreenItem'>
                    <Form.Group className='formGroup'>
                        <InputGroup>
                            <Form.Control 
                                placeholder={t("startTypingToFilterFiles")} 
                                value={searchState.searchQuery}
                                className={'form-control-lg m-auto ' + ((searchState.searchQuery.length > 0) ? 'filledInput' : '')}
                                onChange={(e) =>
                                    {
                                        searchDispatch({type: 'FILTER_BY_SEARCH', payload: e.target.value});
                                
                                    }
                                }
                            />
                            {searchState.searchQuery && <InputGroup.Text className="clearInput" onClick={(e) => {
                                searchDispatch({type: 'FILTER_BY_SEARCH', payload: ''});
                            }}><CiUndo/></InputGroup.Text>}
                        </InputGroup>
                        
                    </Form.Group>
                </Navbar.Text>
                <div className='navLink' onClick={handleForgetSecret} ref={centerLabelref}></div>
                <Nav>
                    <Button className='btn-sm' variant="light" onClick={() => {
                        const payLoadItem: Item = getNewItem();
                        mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
                    }}>
                        <FiPlusCircle style={{marginBottom: -1}} className='h2'/>
                    </Button>
                    &nbsp;
                    <Dropdown>
                        <Dropdown.Toggle variant="light">
                            <FiMenu fontSize="25px" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className='dropdown-menu-end'>
                            <Dropdown.Item onClick={() => {
                                mainDispatch({type: "SHOW_SETTINGS"});
                            }}>{t("settings")}</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Nav>
            </Container>
        </Navbar>
    )
}

export default HeaderComp
