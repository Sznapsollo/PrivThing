import { Navbar, Container, Nav, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'
import { FiPlusCircle } from 'react-icons/fi';
import { LiaFilterSolid } from 'react-icons/lia';
import { AppState } from '../context/Context'
import { Item } from '../model';
import '../styles.css';

const HeaderComp = () => {

    const { mainDispatch, searchDispatch } = AppState();

    return (
        <Navbar bg="dark" variant="dark" style={{height: 40}}>
            <Container className='brandContainer'>
                <Navbar.Brand>
                    <Link to="/">PrivMatter</Link>
                </Navbar.Brand>
            </Container>
            <Container>
                <Button className='btn-sm showItemsButton' variant="light" onClick={() => {
                    mainDispatch({type: "TOGGLE_ITEMS_BAR"});
                }}><LiaFilterSolid style={{marginBottom: -1}} className='h2'/></Button>
                <Navbar.Text className='search'>
                    
                </Navbar.Text>
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
                    {/* <Dropdown>
                        <Dropdown.Toggle variant="success">
                            <FaShoppingCart color="white" fontSize="25px" />
                            <Badge className="bg-transparent">{cartState.cart.length}</Badge>
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{minWidth: 370}}>
                            {
                                cartState.cart.length > 0 ? (
                                    <>
                                    {
                                        cartState.cart.map((prod) => (
                                            <span className="cartitem" key={prod.id}>
                                            <img
                                                src={prod.image}
                                                className="cartItemImg"
                                                alt={prod.name}
                                            />
                                            <div className="cartItemDetail">
                                                <span>{prod.name}</span>
                                                <span>₹ {prod.price.split(".")[0]}</span>
                                            </div>
                                            <AiFillDelete
                                                fontSize="20px"
                                                style={{ cursor: "pointer" }}
                                                onClick={() =>
                                                cartDispatch({
                                                    type: "REMOVE_FROM_CART",
                                                    payload: prod,
                                                })
                                                }
                                            />
                                            </span>
                                        ))
                                    }
                                    <Link to="/cart">
                                        <Button style={{ width: "95%", margin: "0 10px" }}>
                                        Go To Cart
                                        </Button>
                                    </Link>
                                    </>
                                ) : (
                                    <span style={{padding: 10}}>Cart is empty!</span>
                                )
                            }
                        </Dropdown.Menu>
                    </Dropdown> */}
                </Nav>
            </Container>
        </Navbar>
    )
}

export default HeaderComp
