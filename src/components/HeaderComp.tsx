import { Navbar, Container, Nav, Dropdown, Button, Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FiPlusCircle } from 'react-icons/fi';
import { LiaFilterSolid } from 'react-icons/lia';
import { CiUndo } from 'react-icons/ci';
import { FiMenu } from 'react-icons/fi';
import { AppState } from '../context/Context'
import { Item } from '../model';
import '../styles.css';
import SecretComp from './SecretComp';

interface Props {
    centerLabel?: string
}

const HeaderComp = ({centerLabel} : Props) => {

    const { t } = useTranslation();
    const { searchState, mainState, mainDispatch, searchDispatch } = AppState();

    const handleForgetSecret = () => {
        if(!centerLabel?.length) {
            return
        }
        mainDispatch({type: 'CLEAR_SECRET'});
    }

    if(!centerLabel?.length && mainState?.secret) {
        centerLabel = t("forgetPassword");
    }

    return (
        <Navbar bg="dark" variant="dark" style={{height: 40}}>
            <Container className='brandContainer'>
                <Navbar.Brand>
                    <Link to="/">{t("privMatter")}</Link>
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
                <div className='navLink' onClick={handleForgetSecret}>{centerLabel || ''}</div>
                <Nav>
                    <Button className='btn-sm' variant="light" onClick={() => {
                        const payLoadItem: Item = {
                            name: '',
                            path: '',
                            size: 0,
                            rawNote: undefined
                        };
                        mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: {item: payLoadItem}});
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
