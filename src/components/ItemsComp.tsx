import {useEffect, useState} from 'react'
import { Button, Form, InputGroup } from "react-bootstrap";
import { AppState } from '../context/Context'
import LisItem from './LisItem';
import { CiUndo } from 'react-icons/ci';
import { Item } from '../model';

const ItemsComp = () => {
    const { mainState, mainDispatch, searchState, searchDispatch } = AppState();
    const [ foldersLoaded, setFoldersLoaded] = useState<boolean>(false);

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
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({type: 'getListOfFiles'}) 
        };
      
        fetch('listingServer/actions', requestOptions)
        .then(result => {return result.json()})
        .then(data => {
            if(data.status !== "OK") {
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
            {foldersLoaded === true && <div className='formGroupContainer'>
                <label className='upperLabel'>{translateCode("search")}</label>
                <Form.Group className='formGroup'>
                    <InputGroup>
                        <Form.Control 
                            placeholder='Start typing to filter files' 
                            className='m-auto'
                            value={searchState.searchQuery}
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
            {foldersLoaded === true && <div className='formGroupContainer'>
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
                !foldersLoaded && <div style={{wordWrap: 'break-word', fontSize: 12, paddingTop: 10, paddingBottom: 10}}>Files storage folder and service not configured. You can only work in manual pick and save files mode</div>
            }
            {
                foldersLoaded === true && <div style={{wordWrap: 'break-word', fontSize: 12, paddingTop: 10, paddingBottom: 10}}>Files loaded</div>
            }
            <div className='itemsContainer'>
            {
                foldersLoaded === true && transformItems().map((item, i) => {
                    return <LisItem key={i} keyProp={i} item={item}/>
                })
            }
            </div>
        </div>
    )
}

export default ItemsComp