import { useEffect, useState, useRef } from 'react'
import { Button, Form, InputGroup } from "react-bootstrap";
import { useTranslation } from 'react-i18next'
import { AppState } from '../context/Context'
import LisItem from './LisItem';
import { AiOutlineLoading } from 'react-icons/ai';
import { CiUndo } from 'react-icons/ci';
import { BsFillArrowUpSquareFill } from 'react-icons/bs';
import { Item } from '../model';
import { FiPlusCircle } from 'react-icons/fi';
import { getNewItem } from '../utils/utils';
import { MAIN_ACTIONS, SEARCH_ACTIONS } from '../context/Reducers';

const ItemsComp = () => {

    const { t } = useTranslation();

    const {mainState, mainDispatch, searchState, searchDispatch, settingsState: {enableFileServer}} = AppState();
    const { searchState: {currentFolder, sort, searchQuery} } = AppState()
    const [foldersLoaded, setFoldersLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [scrollTop, setScrollTop] = useState<number>(0);
    const [transformedItems, setTransformedItems] = useState<Item[]>([]);
    const itemsContainerRef = useRef(null);
    const [serverMode, setServerMode] = useState('unknown');

    const handleNewItem = () => {
        const payLoadItem: Item = getNewItem();
        mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem, tab: {...payLoadItem, isNew: true}}});
    }

    const loadFromFile = (eventData: HTMLInputElement) => {
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

                mainDispatch({type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE, payload: {item: payLoadItem}});
            };
        
            reader.readAsText(file);
        } catch(e) {
            alert("Can't load this file!")
        }
    }

    useEffect(() => {
        // console.log('refreshing items')
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({type: 'getListOfFiles'}) 
        };
      
        if(enableFileServer === true) {
            if(!mainState.items?.length) {
                setIsLoading(true);
            }
            fetch('actions', requestOptions)
            .then(result => {
                if(!result.ok) {
                    throw new Error('Network response was not ok.');
                }
                return result.json()
            })
            .then(data => {
                setIsLoading(false);
                if(data.status !== 0) {
                    // console.warn("Actions response", data);
                    return
                }
                if(data?.data?.files) {
                    // NJ will fire is service is configured and works
                    setFoldersLoaded(true);
                }
                if(Array.isArray(data?.data?.files)) {
                    // console.log('dispatching items', data.data)
                    mainDispatch({type: MAIN_ACTIONS.SET_ITEMS, payload: data.data.files});
                }
            })
            .catch(function(error) {
                setIsLoading(false);
                setFoldersLoaded(true);
                setServerMode("offline");
                mainDispatch({type: MAIN_ACTIONS.SET_ITEMS, payload: []});
                console.warn('Fetch operation error: ', error.message);
            });
        } else {
            setFoldersLoaded(true);
            setServerMode("disabled");
            mainDispatch({type: MAIN_ACTIONS.SET_ITEMS, payload: []});
        }

    }, [mainState.itemsListRefreshTrigger]);

    const transformItems = () => {
        let transformedItemsLocal = mainState.items

        if(currentFolder) {
            transformedItemsLocal = transformedItemsLocal.filter((item) => item.folder?.toLowerCase() === currentFolder.toLowerCase());
        }

        if(sort) {
            transformedItemsLocal = transformedItemsLocal.sort((a, b) => {
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
            transformedItemsLocal = transformedItemsLocal.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return setTransformedItems(transformedItemsLocal);
    }

    useEffect(() => {
        transformItems();
    }, [mainState.items, searchState])

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
        <div className={"items"}>
            <div className='formGroupContainer'>
                <label className='upperLabel'>{t("manualPickFile")}</label>
                <Form.Group className='formGroup'>
                    <Form.Control
                        type="file"
                        name="file"
                        placeholder=''
                        // value={[path]}
                        onChange={(e) => {
                            loadFromFile(e.target as HTMLInputElement);
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
            {!isLoading && foldersLoaded === true && <div className='formGroupContainer smallScreenItem'>
                <label className='upperLabel'>{t("search")}</label>
                <Form.Group className='formGroup'>
                    <InputGroup>
                        <Form.Control 
                            placeholder={t("startTypingToFilterFiles")} 
                            value={searchState.searchQuery}
                            className={'m-auto ' + ((searchState.searchQuery.length > 0) ? 'filledInput' : '')}
                            onChange={(e) =>
                                {
                                    searchDispatch({type: SEARCH_ACTIONS.FILTER_BY_SEARCH, payload: e.target.value});
                                }
                            }
                        />
                        {searchState.searchQuery && <InputGroup.Text className="clearInput" onClick={(e) => {
                            searchDispatch({type: SEARCH_ACTIONS.FILTER_BY_SEARCH, payload: ''});
                        }}><CiUndo/></InputGroup.Text>}
                    </InputGroup>
                    
                </Form.Group>
            </div>}
            {!isLoading && foldersLoaded === true && <div className='formGroupContainer'>
                <label className='upperLabel'>{t("sortBy")}</label>
                <Form.Group className='formGroup'>
                    <Form.Control 
                        as="select" 
                        name="sortBy"
                        value={searchState.sort}
                        onChange={(e) => {
                        searchDispatch({type: SEARCH_ACTIONS.SORT_BY, payload: e.target.value});
                        }}
                    >
                        <option value="nameLowToHigh">{t("nameLowToHigh")}</option>
                        <option value="nameHighToLow">{t("nameHighToLow")}</option>
                        <option value="lastModifiedHighToLow">{t("lastModifiedHighToLow")}</option>
                        <option value="lastModifiedLowToHigh">{t("lastModifiedLowToHigh")}</option>
                    </Form.Control>
                </Form.Group>
            </div>}
            {!isLoading && foldersLoaded === true && mainState.folders.length >= 1 && <div className='formGroupContainer'>
                <label className='upperLabel'>{t("folders")}</label>
                <Form.Group className='formGroup'>
                    <Form.Control 
                        as="select" 
                        name="currentFolder"
                        value={searchState.currentFolder}
                        onChange={(e) => {
                        searchDispatch({type: SEARCH_ACTIONS.SET_CURRENT_FOLDER, payload: e.target.value});
                        }}
                    >
                        <option value="">{t("allFolders")}</option>
                        {
                            mainState.folders.map((folder, folderIndex) => {
                                return <option key={folderIndex} value={folder.name}>{folder.name}&nbsp;({folder.itemsCount})</option>
                            })
                        }
                    </Form.Control>
                </Form.Group>
            </div>}
            {
                !isLoading && serverMode === "offline" && <div style={{wordWrap: 'break-word', fontSize: 12, paddingTop: 10, paddingBottom: 10}}>{t("storageNotConfigured")}</div>
            }
            {
                !isLoading && foldersLoaded === true &&
                    <div style={{display: 'flex'}}>
                        <div style={{flex: 1, wordWrap: 'break-word', fontSize: 12, paddingTop: 10, paddingBottom: 10}} >{t("filesLoaded")} ({transformedItems.length})</div>
                        <div><Button className='btn-success' onClick={handleNewItem}>{t('new')}&nbsp;<FiPlusCircle style={{marginBottom: -1}} className='h2'/></Button></div>
                    </div>
            }
            <div className='itemsContainer' ref={itemsContainerRef} onScroll={handleScroll}>
            {
                !isLoading && foldersLoaded === true && transformedItems.map((item, itemIndex) => {
                    return <LisItem key={itemIndex} keyProp={itemIndex} item={item}/>
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
            <div className='privThingGitHubInfo'>{t('privThingOpenSource')} <a href="https://github.com/Sznapsollo/PrivThing" target="_blank">{t('privThingGitHub')}</a></div>
        </div>
    )
}

export default ItemsComp