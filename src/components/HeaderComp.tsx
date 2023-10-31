import { Navbar, Container, Nav, Dropdown, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FiPlusCircle } from 'react-icons/fi';
import { LiaFilterSolid } from 'react-icons/lia';
import { FiMenu } from 'react-icons/fi';
import { AppState } from '../context/Context'
import { Item } from '../model';
import '../styles.css';

interface Props {
    centerLabel?: string
}

const HeaderComp = ({centerLabel} : Props) => {

    const { t } = useTranslation();
    const { mainDispatch } = AppState();

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
                <Navbar.Text className='search'>
                    
                </Navbar.Text>
                <span style={{color: 'white'}}>{centerLabel}</span>
                <Nav>
                    <Button className='btn-sm' variant="light" onClick={() => {
                        const payLoadItem: Item = {
                            name: '',
                            path: '',
                            size: 0,
                            new: true,
                            rawNote: undefined
                        };
                        mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: payLoadItem});
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
