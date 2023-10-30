import {useEffect, useState, useRef} from 'react'
import { Form, InputGroup } from "react-bootstrap";
import { AppState } from '../context/Context'
import LisItem from './LisItem';
import { CiUndo } from 'react-icons/ci';
import { AiOutlineLoading } from 'react-icons/ai';
import { BsFillArrowUpSquareFill } from 'react-icons/bs';
import { Item } from '../model';

const ItemsComp = () => {
    const { mainState, mainDispatch, searchState, searchDispatch } = AppState();
    const [ foldersLoaded, setFoldersLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [scrollTop, setScrollTop] = useState(0);
    const itemsContainerRef = useRef(null);

    const translateCode = (msgCode: string) => {
        var msgCodes:any = {
            manualPickFile: 'Manual pick file',
            sortBy: 'Sort by',
            search: 'Search'
        }
        return msgCodes[msgCode] || msgCode;
    }

    const loadFromFile = (eventData: any) => {
        try {
            if(!eventData?.value || !eventData?.files?.length) {
                console.warn('Incorrect picked data!!')
                return
            }
            
            let file = eventData.files[0];
            
            var reader = new FileReader();
            reader.onload = function(event:any) {
                // The file's text will be printed here
                const payLoadItem: Item = {
                    name: file.name,
                    path: eventData.value,
                    size: 0,
                    rawNote: event.target.result
                };

                mainDispatch({type: "SET_EDITED_ITEM_CANDIDATE", payload: payLoadItem});
            };
        
            reader.readAsText(file);
        } catch(e) {
            alert("Cant load this file!")
        }
    }

    useEffect(() => {
        setIsLoading(true);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({type: 'getListOfFiles'}) 
        };
      
        fetch('actions', requestOptions)
        .then(result => {return result.json()})
        .then(data => {
            setIsLoading(false);
            if(data.status !== 0) {
                console.warn("Actions response", data);
                return
            }
            if(data?.data?.files) {
                setFoldersLoaded(true);
            }
            if(Array.isArray(data?.data?.files)) {
                console.log(data.data)
                mainDispatch({type: "SET_ITEMS", payload: data.data.files});
            }
        })
    }, [mainState.itemsListRefreshTrigger]);

    useEffect(() => {
        console.log(scrollTop)
    }, [scrollTop]);

    const { searchState: {sort, searchQuery} } = AppState()

    // console.log(cartState)

    const transformItems = () => {
        let sortedItems = mainState.items

        if(sort) {
        sortedItems = sortedItems.sort((a, b) => {
            if(sort === 'nameLowToHigh') {
            return (a.name.localeCompare(b.name))
            } else if(sort === 'nameHighToLow') {
            return (b.name.localeCompare(a.name))
            } else if(sort === 'lastModifiedHighToLow') {
            return ((b.lastModified || 0) - (a.lastModified || 0))
            } else if(sort === 'lastModifiedLowToHigh') {
            return ((a.lastModified || 0) - (b.lastModified || 0))
            }
            return (a.name.localeCompare(b.name))
        })
        }

        if(searchQuery) {
            sortedItems = sortedItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return sortedItems
    }

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const handleScrollTop = () => {
        if(!itemsContainerRef?.current) {
            return
        }
        (itemsContainerRef.current as any).scrollTo({ top: 0});
    }

    return (
        <div className={"items " + mainState.itemsCss}>
            <div className='formGroupContainer'>
                <label className='upperLabel'>{translateCode("manualPickFile")}</label>
                <Form.Group className='formGroup'>
                    <Form.Control
                        type="file"
                        name="file"
                        placeholder=''
                        // value={[path]}
                        onChange={(e) => {
                            loadFromFile(e.target as any);
                        }}
                    ></Form.Control>
                </Form.Group>
            </div>
            {
                isLoading &&
                <div style={{width: "100%", height: "100%", display: "table"}}>
                    <div style={{display: "table-cell", verticalAlign: "middle", textAlign: 'center'}}>
                        <AiOutlineLoading className='h2 loading-icon'/> &nbsp;In progress ...
                    </div>
                </div>
            } 
            {!isLoading && foldersLoaded === true && <div className='formGroupContainer'>
                <label className='upperLabel'>{translateCode("search")}</label>
                <Form.Group className='formGroup'>
                    <InputGroup>
                        <Form.Control 
                            placeholder='Start typing to filter files' 
                            value={searchState.searchQuery}
                            className={'m-auto ' + ((searchState.searchQuery.length > 0) ? 'filledInput' : '')}
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
            </div>}
            {!isLoading && foldersLoaded === true && <div className='formGroupContainer'>
                <label className='upperLabel'>{translateCode("sortBy")}</label>
                <Form.Group className='formGroup'>
                    <Form.Control 
                        as="select" 
                        name="officialIdType"
                        value={searchState.sort}
                        onChange={(e) => {
                        searchDispatch({type: 'SORT_BY', payload: e.target.value});
                        }}
                    >
                        <option value="nameLowToHigh">by name asc</option>
                        <option value="nameHighToLow">by name desc</option>
                        <option value="lastModifiedHighToLow">by last modified desc</option>
                        <option value="lastModifiedLowToHigh">by last modified desc</option>
                    </Form.Control>
                </Form.Group>
            </div>}
            {
                !isLoading && !foldersLoaded && <div style={{wordWrap: 'break-word', fontSize: 12, paddingTop: 10, paddingBottom: 10}}>Files storage folder and service not configured. You can only work in manual pick and save files mode</div>
            }
            {
                !isLoading && foldersLoaded === true && <div style={{wordWrap: 'break-word', fontSize: 12, paddingTop: 10, paddingBottom: 10}}>Files loaded</div>
            }
            <div className='itemsContainer' ref={itemsContainerRef} onScroll={handleScroll}>
            {
                !isLoading && foldersLoaded === true && transformItems().map((item, i) => {
                    return <LisItem key={i} keyProp={i} item={item}/>
                })
            }
            {
                (scrollTop > 0) &&
                <div style={{position: "absolute", bottom: 10, cursor: 'pointer'}} onClick={() => {
                    handleScrollTop();
                }}>
                    <BsFillArrowUpSquareFill className='h1' style={{height: 45, width: 45}}/>
                </div>
            }
            </div>
        </div>
    )
}

export default ItemsComp